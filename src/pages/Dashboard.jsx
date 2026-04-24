import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Bell,
  FileText,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
  Stethoscope,
  Cpu,
  ArrowUpRight,
  Pencil,
  Trash2,
  Inbox,
  UserMinus,
  CalendarCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAuth, getAuthChangedEventName } from '@/lib/auth';
import { CreatePostCTA } from '@/components/ui/hand-writing-text';
import { buildGoogleCalendarDeeplink } from '@/lib/googleCalendar';
import { calculateProjectMatchScore } from '@/lib/matchScore';

const STAGE_LABELS = {
  idea: 'Idea',
  concept_validation: 'Concept validation',
  prototype: 'Prototype',
  pilot: 'Pilot',
  pre_deployment: 'Pre-deployment',
};

const STATUS_STYLES = {
  pending: { bg: 'var(--status-warning-tint)', text: 'var(--status-warning)' },
  nda: { bg: 'var(--accent-violet-tint)', text: 'var(--accent-violet)' },
  scheduled: { bg: 'var(--status-info-tint)', text: 'var(--status-info)' },
};

function mapPostToDiscoverCard(post) {
  const rawId = post?.id;
  const idNum = typeof rawId === 'number' ? rawId : parseInt(String(rawId), 10);
  const expertise =
    typeof post?.required_expertise === 'string' && post.required_expertise.trim()
      ? post.required_expertise.trim()
      : 'Collaborator';
  const city = typeof post?.city === 'string' ? post.city.trim() : '';
  const meshIdx = Number.isFinite(idNum) && idNum > 0 ? ((idNum - 1) % 5) + 1 : 1;
  return {
    role: expertise,
    city,
    imageUrl: `/assets/mesh_${meshIdx}.png`,
  };
}

function formatPersonName(u) {
  if (!u) return 'Someone';
  const name = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
  return name || u.email || 'Someone';
}

/** @param {Array<Record<string, unknown>>} list */
function buildMeetingNotifications(list, uid) {
  if (uid == null) return [];
  const items = [];
  for (const m of list) {
    const postTitle = typeof m.post?.title === 'string' ? m.post.title : 'Listing';
    const createdAt = m.created_at;
    const updatedAt = m.updated_at;

    if (m.post_owner_id === uid) {
      if (m.status === 'pending') {
        items.push({
          key: `in-${m.id}`,
          kind: 'incoming',
          meetingId: m.id,
          at: createdAt,
          text: `${formatPersonName(m.requester)} sent a meeting request for "${postTitle}".`,
        });
      } else if (m.status === 'scheduled' && m.confirmed_slot) {
        const when = new Date(m.confirmed_slot).toLocaleString();
        items.push({
          key: `in-${m.id}-scheduled`,
          kind: 'scheduled',
          meetingId: m.id,
          at: updatedAt,
          text: `Your meeting with ${formatPersonName(m.requester)} for "${postTitle}" is scheduled for ${when}.`,
        });
      }
    }

    if (m.requester_id === uid) {
      if (m.status === 'declined') {
        items.push({
          key: `out-${m.id}-declined`,
          kind: 'declined',
          meetingId: m.id,
          at: updatedAt,
          text: `Your request for "${postTitle}" was declined by ${formatPersonName(m.post_owner)}.`,
        });
      } else if (m.status === 'accepted') {
        const calendarUrl = m.confirmed_slot
          ? buildGoogleCalendarDeeplink({
              title: postTitle,
              details:
                typeof m.post?.description === 'string' && m.post.description.trim()
                  ? m.post.description
                  : `Meeting accepted with ${formatPersonName(m.post_owner)}.`,
              startIso: m.confirmed_slot,
            })
          : '';
        items.push({
          key: `out-${m.id}-accepted`,
          kind: 'accepted',
          meetingId: m.id,
          at: updatedAt,
          text: `Your request for "${postTitle}" was accepted by ${formatPersonName(m.post_owner)}.`,
          calendarUrl,
        });
      } else if (m.status === 'scheduled' && m.confirmed_slot) {
        const when = new Date(m.confirmed_slot).toLocaleString();
        const calendarUrl = buildGoogleCalendarDeeplink({
          title: postTitle,
          details:
            typeof m.post?.description === 'string' && m.post.description.trim()
              ? m.post.description
              : `Meeting accepted with ${formatPersonName(m.post_owner)}.`,
          startIso: m.confirmed_slot,
        });
        items.push({
          key: `out-${m.id}-scheduled`,
          kind: 'scheduled',
          meetingId: m.id,
          at: updatedAt,
          text: `Your meeting for "${postTitle}" is scheduled for ${when}.`,
          calendarUrl,
        });
      }
    }
  }
  items.sort((a, b) => {
    const ta = new Date(a.at).getTime();
    const tb = new Date(b.at).getTime();
    return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
  });
  return items;
}

function Dashboard() {
  const auth = getAuth();
  const role = auth?.user?.role;
  const isHealthcare = role === 'healthcare';
  const canCreatePost = role === 'healthcare' || role === 'engineer';
  const displayName = auth?.user?.first_name || auth?.user?.firstName || 'User';

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState('');
  const [meetingPending, setMeetingPending] = useState(null);
  const [incomingMatchCount, setIncomingMatchCount] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [meetingsLoading, setMeetingsLoading] = useState(true);
  const [recommendedProjects, setRecommendedProjects] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);

  const loadPosts = async () => {
    const a = getAuth();
    if (!a?.accessToken) {
      setPosts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setFetchErr('');
    try {
      const res = await fetch('/api/posts/mine?limit=50', {
        headers: { Authorization: `Bearer ${a.accessToken}` },
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to load posts.');
      }
      setPosts(Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      setFetchErr(e instanceof Error ? e.message : 'Failed to load posts.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post permanently? This cannot be undone.')) {
      return;
    }
    const a = getAuth();
    if (!a?.accessToken) return;
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${a.accessToken}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Could not delete post.');
      }
      await loadPosts();
      await loadMeetingsData();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed.');
    }
  };

  const loadMeetingsData = async () => {
    const a = getAuth();
    if (!a?.accessToken) {
      setMeetingPending(null);
      setIncomingMatchCount(null);
      setNotifications([]);
      setMeetingsLoading(false);
      return;
    }
    setMeetingsLoading(true);
    try {
      const res = await fetch('/api/meetings?type=all', {
        headers: { Authorization: `Bearer ${a.accessToken}` },
      });
      const json = await res.json();
      if (!res.ok) {
        setMeetingPending(null);
        setIncomingMatchCount(null);
        setNotifications([]);
        return;
      }
      const list = Array.isArray(json.data) ? json.data : [];
      const uid = a.user?.id;
      setMeetingPending(list.filter((x) => x.status === 'pending').length);
      setIncomingMatchCount(
        uid != null
          ? list.filter((x) => x.post_owner_id === uid && ['pending', 'accepted', 'scheduled'].includes(x.status)).length
          : 0
      );
      setNotifications(buildMeetingNotifications(list, uid));
    } catch {
      setMeetingPending(null);
      setIncomingMatchCount(null);
      setNotifications([]);
    } finally {
      setMeetingsLoading(false);
    }
  };

  const loadRecommendedProjects = async () => {
    const a = getAuth();
    if (!a?.accessToken) {
      setRecommendedProjects([]);
      setRecommendationsLoading(false);
      return;
    }
    setRecommendationsLoading(true);
    try {
      const [postsRes, profileRes] = await Promise.all([
        fetch('/api/posts?limit=30', {
          headers: { Authorization: `Bearer ${a.accessToken}` },
        }),
        fetch('/api/users/profile', {
          headers: { Authorization: `Bearer ${a.accessToken}` },
        }),
      ]);

      const postsJson = await postsRes.json().catch(() => ({}));
      const profileJson = await profileRes.json().catch(() => ({}));

      if (!postsRes.ok) {
        setRecommendedProjects([]);
        return;
      }

      const rawProfile = profileJson?.user || {};
      const profile = {
        city:
          rawProfile.city ||
          a.user?.city ||
          '',
        expertise:
          rawProfile.expertise ||
          a.user?.expertise ||
          '',
      };

      const uid = a.user?.id;
      const list = Array.isArray(postsJson.data) ? postsJson.data : [];
      const ranked = list
        .filter((project) => project.user_id !== uid)
        .map((project) => {
          const match = calculateProjectMatchScore(profile, project);
          const visual = mapPostToDiscoverCard(project);
          return { ...project, ...visual, matchScore: match.score };
        })
        .sort((left, right) => right.matchScore - left.matchScore)
        .slice(0, 3);

      setRecommendedProjects(ranked);
    } catch {
      setRecommendedProjects([]);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
    loadMeetingsData();
    const ev = getAuthChangedEventName();
    const sync = () => {
      loadPosts();
      loadMeetingsData();
      loadRecommendedProjects();
    };
    loadRecommendedProjects();
    window.addEventListener(ev, sync);
    return () => window.removeEventListener(ev, sync);
  }, []);

  const activePosts = useMemo(
    () => posts.filter((p) => p.status === 'active'),
    [posts]
  );

  const stats = [
    {
      title: isHealthcare ? 'Active Posts' : 'Active Collaborations',
      value: loading ? '…' : String(activePosts.length),
      icon: FileText,
      accent: 'emerald',
      note: 'Currently live',
    },
    {
      title: 'Pending Meetings',
      value: meetingPending === null ? '—' : String(meetingPending),
      icon: Clock,
      accent: 'amber',
      note: 'Awaiting response',
    },
    {
      title: 'Inbound Requests',
      value: meetingsLoading ? '…' : incomingMatchCount === null ? '—' : String(incomingMatchCount),
      icon: Users,
      accent: 'emerald',
      note: 'Active pipeline',
    },
    {
      title: 'Recommendations',
      value: recommendationsLoading ? '…' : String(recommendedProjects.length),
      icon: Sparkles,
      accent: 'emerald',
      note: 'Ranked by profile fit',
    },
  ];

  return (
    <section className="page" data-screen-label="02 Dashboard">
      <div className="dash">
        <div className="sidebar">
          <h4>Inbox</h4>
          <ul>
            <li className="active">All requests <span className="count">{meetingPending ?? 0}</span></li>
            <li>Awaiting response <span className="count">{meetingPending ?? 0}</span></li>
            <li>NDA / accepted <span className="count">{notifications.filter((n) => n.kind === 'accepted').length}</span></li>
            <li>Scheduled <span className="count">{notifications.filter((n) => n.kind === 'scheduled').length}</span></li>
          </ul>
          <h4>Quick actions</h4>
          <div className="mt-4">
            {canCreatePost && (
              <Link to="/post/new" className="btn btn-primary w-full text-center justify-center">
                <Plus size={14} /> Post project
              </Link>
            )}
          </div>
        </div>

        <div className="main">
          <div className="metrics">
            {stats.map((item, idx) => (
              <div key={item.title} className="metric">
                <span className="label text-muted-foreground">{item.title}</span>
                <span className="num text-foreground">{item.value}</span>
                <span className="delta">{item.note}</span>
              </div>
            ))}
          </div>

          <div className="panel">
            <div className="panel-head">
              <h3>Inbound requests</h3>
              <div className="tabs">
                <span className="active">All</span>
                <span>Active</span>
                <span>Requires action</span>
              </div>
            </div>
            
            {notifications.slice(0, 6).map((n) => {
              const uStatus = n.kind === 'scheduled' ? 'scheduled' : n.kind === 'accepted' ? 'nda' : 'pending';
              const isNda = uStatus === 'nda';
              const isPending = uStatus === 'pending';
              
              return (
                <div key={n.key} className="req-row">
                  <div className="req-avatar" style={{ background: isNda ? 'var(--accent-violet)' : isPending ? 'var(--status-warning)' : 'var(--accent-emerald)' }}>
                    <Bell size={16} />
                  </div>
                  <div>
                    <div className="req-name">{n.text}</div>
                    <div className="req-sub">
                      <span className={`status ${isPending ? 's-pending' : isNda ? 's-nda' : 's-scheduled'} mr-2`}>
                        <span className="pip"></span>
                        {uStatus}
                      </span>
                      {n.at ? new Date(n.at).toLocaleString() : ''}
                    </div>
                  </div>
                  <div className="req-actions">
                    <Link to={`/meetings/${n.meetingId}`} className="btn-sm">View details</Link>
                  </div>
                </div>
              );
            })}
            
            {!notifications.length && (
              <div className="p-6 text-center text-muted-foreground text-sm">
                No inbound requests yet.
              </div>
            )}
          </div>

          <div className="panel schedule">
            <div className="flex-between mb-6">
              <h3 className="font-serif text-[22px] m-0 tracking-[-.01em]">This week</h3>
              <Link to="/meetings" className="text-xs text-muted-foreground font-semibold hover:text-foreground">View calendar →</Link>
            </div>
            
            {notifications.filter((n) => n.kind === 'scheduled').slice(0, 3).map((n) => (
              <div key={`${n.key}-wk`} className="sched-day">
                 <div className="sched-date">
                   {new Date(n.at).getDate()}
                   <small>{new Date(n.at).toLocaleString('default', { month: 'short' })}</small>
                 </div>
                 <div className="sched-events">
                   <div className="sched-event violet">
                      <div className="sched-time">{new Date(n.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div>
                        <div className="sched-title">Introductory Call</div>
                        <div className="sched-sub">{n.text}</div>
                      </div>
                      {n.calendarUrl && (
                        <a href={n.calendarUrl} target="_blank" rel="noreferrer" className="btn-sm primary" style={{ textDecoration: 'none' }}>
                          Add to Google Calendar
                        </a>
                      )}
                   </div>
                 </div>
              </div>
            ))}
            
            {!notifications.some((n) => n.kind === 'scheduled') && (
              <div className="text-center text-muted-foreground text-sm py-4">
                No scheduled intros this week.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
