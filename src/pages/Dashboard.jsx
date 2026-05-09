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
import { buildGoogleCalendarDeeplink, buildGoogleMeetEventDeeplink } from '@/lib/googleCalendar';
import { calculateProjectMatchScore } from '@/lib/matchScore';
import { getDiscoverImageForSeed } from '@/lib/discoverImages';
import { DashboardStatsSkeleton, MeetingRowSkeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { useLocale } from '@/contexts/locale-context';
import { boardListings } from '@/lib/showcaseListings';

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
  const expertise =
    typeof post?.required_expertise === 'string' && post.required_expertise.trim()
      ? post.required_expertise.trim()
      : 'Collaborator';
  const city = typeof post?.city === 'string' ? post.city.trim() : '';
  return {
    role: expertise,
    city,
    imageUrl: getDiscoverImageForSeed(rawId),
  };
}

function formatPersonName(u) {
  if (!u) return 'Someone';
  const name = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
  return name || u.email || 'Someone';
}

/** @param {Array<Record<string, unknown>>} list */
function interpolate(template, vars) {
  return Object.entries(vars).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)), template);
}

function buildMeetingNotifications(list, uid, t) {
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
          postStatus: m.post?.status || '',
          text: `${formatPersonName(m.requester)} sent a meeting request for "${postTitle}".`,
        });
      } else if (m.status === 'accepted') {
        items.push({
          key: `in-${m.id}-accepted`,
          kind: 'accepted',
          meetingId: m.id,
          at: updatedAt,
          postStatus: m.post?.status || '',
          text: interpolate(
            t('dashboardNotifIncomingAccepted', '{person} accepted flow is active for "{post}". Review and confirm a slot.'),
            { person: formatPersonName(m.requester), post: postTitle }
          ),
        });
      } else if (m.status === 'scheduled' && m.confirmed_slot) {
        const when = new Date(m.confirmed_slot).toLocaleString();
        items.push({
          key: `in-${m.id}-scheduled`,
          kind: 'scheduled',
          meetingId: m.id,
          at: m.confirmed_slot,
          confirmedAt: m.confirmed_slot,
          postStatus: m.post?.status || '',
          text: interpolate(
            t('dashboardNotifIncomingScheduled', 'Your meeting with {person} for "{post}" is scheduled for {when}.'),
            { person: formatPersonName(m.requester), post: postTitle, when }
          ),
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
          postStatus: m.post?.status || '',
          text: interpolate(
            t('dashboardNotifOutgoingDeclined', 'Your request for "{post}" was declined by {person}.'),
            { person: formatPersonName(m.post_owner), post: postTitle }
          ),
        });
      } else if (m.status === 'accepted') {
        const meetUrl = m.time_slots?.[0]?.slot_datetime
          ? buildGoogleMeetEventDeeplink({
              title: postTitle,
              details:
                typeof m.post?.description === 'string' && m.post.description.trim()
                  ? m.post.description
                  : `Meeting with ${formatPersonName(m.post_owner)}.`,
              startIso: m.time_slots[0].slot_datetime,
            })
          : '';
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
          postStatus: m.post?.status || '',
          text: interpolate(
            t('dashboardNotifOutgoingAccepted', 'Your request for "{post}" was accepted by {person}.'),
            { person: formatPersonName(m.post_owner), post: postTitle }
          ),
          meetUrl,
          calendarUrl,
        });
      } else if (m.status === 'scheduled' && m.confirmed_slot) {
        const when = new Date(m.confirmed_slot).toLocaleString();
        const meetUrl = buildGoogleMeetEventDeeplink({
          title: postTitle,
          details:
            typeof m.post?.description === 'string' && m.post.description.trim()
              ? m.post.description
              : `Meeting with ${formatPersonName(m.post_owner)}.`,
          startIso: m.confirmed_slot,
        });
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
          at: m.confirmed_slot,
          confirmedAt: m.confirmed_slot,
          postStatus: m.post?.status || '',
          text: interpolate(
            t('dashboardNotifOutgoingScheduled', 'Your meeting for "{post}" is scheduled for {when}.'),
            { post: postTitle, when }
          ),
          meetUrl,
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
  const { toast } = useToast();
  const { t, locale } = useLocale();
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
  const [meetingsRaw, setMeetingsRaw] = useState([]);
  const [meetingSummary, setMeetingSummary] = useState({
    all: 0,
    awaiting: 0,
    ndaAccepted: 0,
    scheduled: 0,
  });
  const [meetingsLoading, setMeetingsLoading] = useState(true);
  const [recommendedProjects, setRecommendedProjects] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [savedPosts, setSavedPosts] = useState([]);
  const [savedTab, setSavedTab] = useState(false);

  const loadSavedPosts = async () => {
    const a = getAuth();
    if (!a?.accessToken) { setSavedPosts([]); return; }
    try {
      const res = await fetch('/api/bookmarks', { headers: { Authorization: `Bearer ${a.accessToken}` } });
      const json = await res.json();
      const rawList = res.ok
        ? (Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [])
        : [];
      const apiBookmarks = rawList;

      // Ayrıca Discover/Board ekranında yerel olarak kaydedilmiş (mock vitrin) ilanları da ekle.
      let localShowcaseBookmarks = [];
      if (typeof window !== 'undefined') {
        try {
          const raw = window.localStorage.getItem('health-ai-cocreation:board-favorites');
          const ids = raw ? JSON.parse(raw) : [];
          if (Array.isArray(ids)) {
            localShowcaseBookmarks = ids
              .map((id) => {
                const item = boardListings.find((p) => String(p.id) === String(id));
                if (!item) return null;
                // Dashboard panelinin beklediği forma yakın hafif model
                return {
                  id: `showcase-${item.id}`,
                  post: {
                    id: item.id,
                    title: item.title,
                    city: item.city || '',
                    required_expertise: item.role || '',
                  },
                };
              })
              .filter(Boolean);
          }
        } catch {
          // localStorage hatalarını sessizce yoksay
          localShowcaseBookmarks = [];
        }
      }

      setSavedPosts([...apiBookmarks, ...localShowcaseBookmarks]);
    } catch { setSavedPosts([]); }
  };

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
      setMeetingsRaw([]);
      setMeetingSummary({ all: 0, awaiting: 0, ndaAccepted: 0, scheduled: 0 });
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
        setMeetingsRaw([]);
        setMeetingSummary({ all: 0, awaiting: 0, ndaAccepted: 0, scheduled: 0 });
        return;
      }
      const list = Array.isArray(json.data) ? json.data : [];
      const activeList = list.filter((x) => ['pending', 'accepted', 'scheduled'].includes(x.status));
      const uid = a.user?.id;
      setMeetingPending(list.filter((x) => x.status === 'pending').length);
      setIncomingMatchCount(
        uid != null
          ? list.filter((x) => x.post_owner_id === uid && ['pending', 'accepted', 'scheduled'].includes(x.status)).length
          : 0
      );
      setMeetingsRaw(list);
      setMeetingSummary({
        all: activeList.length,
        awaiting: list.filter((x) => x.status === 'pending').length,
        ndaAccepted: list.filter((x) => x.nda_accepted || x.status === 'accepted').length,
        scheduled: list.filter((x) => x.status === 'scheduled').length,
      });
      setNotifications(buildMeetingNotifications(list, uid, t));
    } catch {
      setMeetingPending(null);
      setIncomingMatchCount(null);
      setNotifications([]);
      setMeetingsRaw([]);
      setMeetingSummary({ all: 0, awaiting: 0, ndaAccepted: 0, scheduled: 0 });
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
    loadSavedPosts();
    const ev = getAuthChangedEventName();
    const sync = () => {
      loadPosts();
      loadMeetingsData();
      loadRecommendedProjects();
      loadSavedPosts();
    };
    loadRecommendedProjects();
    const intervalId = window.setInterval(() => {
      loadMeetingsData();
      loadSavedPosts();
    }, 15000);
    window.addEventListener('focus', sync);
    window.addEventListener(ev, sync);
    return () => {
      window.removeEventListener(ev, sync);
      window.removeEventListener('focus', sync);
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    loadMeetingsData();
  }, [locale]);

  const activePosts = useMemo(
    () => posts.filter((p) => p.status === 'active'),
    [posts]
  );

  const scheduledThisWeek = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const start = new Date(now);
    start.setDate(now.getDate() + mondayOffset);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    const items = [];

    meetingsRaw.forEach((meeting) => {
      if (meeting.status === 'scheduled' && meeting.confirmed_slot) {
        const when = new Date(meeting.confirmed_slot).getTime();
        if (Number.isFinite(when) && when >= start.getTime() && when < end.getTime()) {
          items.push({
            key: `scheduled-${meeting.id}`,
            kind: 'scheduled',
            at: meeting.confirmed_slot,
            confirmedAt: meeting.confirmed_slot,
            text: meeting.post?.title || `Post #${meeting.post_id}`,
            meetingId: meeting.id,
          });
        }
      }

      if (meeting.status === 'accepted' && Array.isArray(meeting.time_slots)) {
        meeting.time_slots.forEach((slot) => {
          const when = new Date(slot.slot_datetime).getTime();
          if (Number.isFinite(when) && when >= start.getTime() && when < end.getTime()) {
            items.push({
              key: `accepted-slot-${meeting.id}-${slot.id}`,
              kind: 'accepted_slot',
              at: slot.slot_datetime,
              confirmedAt: slot.slot_datetime,
              text: meeting.post?.title || `Post #${meeting.post_id}`,
              meetingId: meeting.id,
            });
          }
        });
      }
    });

    return items
      .sort((a, b) => new Date(a.confirmedAt || a.at).getTime() - new Date(b.confirmedAt || b.at).getTime())
      .slice(0, 3);
  }, [meetingsRaw]);

  const stats = [
    {
      title: isHealthcare ? t('dashboardMetricActivePosts', 'Active Posts') : t('dashboardMetricActiveCollaborations', 'Active Collaborations'),
      value: loading ? '…' : String(activePosts.length),
      icon: FileText,
      accent: 'emerald',
      note: t('dashboardMetricNoteCurrentlyLive', 'Currently live'),
    },
    {
      title: t('dashboardMetricPendingMeetings', 'Pending Meetings'),
      value: meetingPending === null ? '—' : String(meetingPending),
      icon: Clock,
      accent: 'amber',
      note: t('dashboardMetricNoteAwaitingResponse', 'Awaiting response'),
    },
    {
      title: t('dashboardMetricInboundRequests', 'Inbound Requests'),
      value: meetingsLoading ? '…' : incomingMatchCount === null ? '—' : String(incomingMatchCount),
      icon: Users,
      accent: 'emerald',
      note: t('dashboardMetricNoteActivePipeline', 'Active pipeline'),
    },
    {
      title: t('dashboardMetricRecommendations', 'Recommendations'),
      value: recommendationsLoading ? '…' : String(recommendedProjects.length),
      icon: Sparkles,
      accent: 'emerald',
      note: t('dashboardMetricNoteRankedByProfileFit', 'Ranked by profile fit'),
    },
  ];

  return (
    <section className="page" data-screen-label="02 Dashboard">
      <div className="dash">
        <div className="sidebar">
          <h4>{t('inbox', 'Inbox')}</h4>
          <ul>
            <li className="active">{t('allRequests', 'All requests')} <span className="count">{meetingSummary.all}</span></li>
            <li>{t('awaitingResponse', 'Awaiting response')} <span className="count">{meetingSummary.awaiting}</span></li>
            <li>{t('ndaAccepted', 'NDA / accepted')} <span className="count">{meetingSummary.ndaAccepted}</span></li>
            <li>{t('scheduled', 'Scheduled')} <span className="count">{meetingSummary.scheduled}</span></li>
          </ul>
          <li
            className={savedTab ? 'active' : ''}
            style={{ cursor: 'pointer' }}
            onClick={() => setSavedTab((v) => !v)}
          >
            {t('savedListings', 'Saved Listings')} <span className="count">{savedPosts.length}</span>
          </li>
          <h4>{t('quickActions', 'Quick actions')}</h4>
          <div className="mt-4">
            {canCreatePost && (
              <Link to="/post/new" className="btn btn-primary w-full text-center justify-center" data-tour="create-post-btn">
                <Plus size={14} /> {t('postProject', 'Post project')}
              </Link>
            )}
            <Link to="/meetings" className="btn btn-ghost w-full text-center justify-center mt-2" data-tour="meetings-tab">
              <Inbox size={14} /> {t('openRequestsWorkspace', 'Open requests workspace')}
            </Link>
          </div>
        </div>

        <div className="main">
          <div className="metrics" data-tour="dashboard-overview">
            {loading && meetingsLoading ? (
              <DashboardStatsSkeleton />
            ) : (
              stats.map((item) => (
                <div key={item.title} className="metric">
                  <span className="label text-muted-foreground">{item.title}</span>
                  <span className="num text-foreground">{item.value}</span>
                  <span className="delta">{item.note}</span>
                </div>
              ))
            )}
          </div>

          <div className="panel">
            <div className="panel-head">
              <h3>{t('dashboardInboundRequestsTitle', 'Inbound requests')}</h3>
              <Link to="/meetings" className="text-xs text-muted-foreground font-semibold hover:text-foreground">
                {t('dashboardViewAllRequests', 'View all requests →')}
              </Link>
            </div>
            
            {meetingsLoading ? (
              [0,1,2].map((i) => <MeetingRowSkeleton key={i} />)
            ) : notifications.filter((n) => n.key.startsWith('in-')).slice(0, 6).map((n) => {
              const uStatus = n.postStatus === 'expired'
                ? 'expired'
                : n.kind === 'scheduled'
                  ? 'scheduled'
                  : n.kind === 'accepted'
                    ? 'nda'
                    : 'pending';
              const isNda = uStatus === 'nda';
              const isPending = uStatus === 'pending';
              const isExpired = uStatus === 'expired';
              
              return (
                <div key={n.key} className="req-row">
                  <div className="req-avatar" style={{ background: isExpired ? 'var(--status-danger)' : isNda ? 'var(--accent-violet)' : isPending ? 'var(--status-warning)' : 'var(--accent-emerald)' }}>
                    <Bell size={16} />
                  </div>
                  <div>
                    <div className="req-name">{n.text}</div>
                    <div className="req-sub">
                      <span
                        className={`status ${isPending ? 's-pending' : isNda ? 's-nda' : 's-scheduled'} mr-2`}
                        style={isExpired ? { background: 'var(--status-danger-tint)', color: 'var(--status-danger)' } : undefined}
                      >
                        <span className="pip"></span>
                        {isExpired
                          ? t('statusExpired', 'Expired')
                          : isPending
                          ? t('statusPending', 'Pending')
                          : isNda
                            ? t('ndaAccepted', 'NDA / accepted')
                            : t('statusScheduled', 'Scheduled')}
                      </span>
                      {n.at ? new Date(n.at).toLocaleString() : ''}
                    </div>
                  </div>
                  <div className="req-actions">
                    <Link to={`/meetings/${n.meetingId}`} className="btn-sm">{t('dashboardViewDetails', 'View details')}</Link>
                  </div>
                </div>
              );
            })}
            {!meetingsLoading && notifications.filter((n) => n.key.startsWith('in-')).length === 0 && (
              <div className="p-6 text-center text-muted-foreground text-sm">
                {t('dashboardNoInboundRequests', 'No inbound requests yet.')}
              </div>
            )}
          </div>

          <div className="panel schedule">
            <div className="flex-between mb-6">
              <h3 className="font-serif text-[22px] m-0 tracking-[-.01em]">{t('dashboardThisWeek', 'This week')}</h3>
              <Link to="/meetings" className="text-xs text-muted-foreground font-semibold hover:text-foreground">{t('dashboardViewCalendar', 'View calendar →')}</Link>
            </div>
            
            {scheduledThisWeek.map((n) => (
              <div key={`${n.key}-wk`} className="sched-day">
                 <div className="sched-date">
                   {new Date(n.confirmedAt || n.at).getDate()}
                   <small>{new Date(n.confirmedAt || n.at).toLocaleString('default', { month: 'short' })}</small>
                 </div>
                 <div className="sched-events">
                   <div className="sched-event violet">
                      <div className="sched-time">{new Date(n.confirmedAt || n.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div>
                        <div className="sched-title">
                          {n.kind === 'accepted_slot'
                            ? t('dashboardProposedSlot', 'Proposed Time Slot')
                            : t('dashboardIntroductoryCall', 'Introductory Call')}
                        </div>
                        <div className="sched-sub">{n.text}</div>
                      </div>
                      {(n.meetUrl || n.calendarUrl) && (
                        <a
                          href={n.meetUrl || n.calendarUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-sm primary"
                          style={{ textDecoration: 'none' }}
                        >
                          {t('googleMeetPlanForSlot', 'Plan a Google Meet for this slot')}
                        </a>
                      )}
                      {!n.meetUrl && !n.calendarUrl && n.meetingId && (
                        <Link to={`/meetings/${n.meetingId}`} className="btn-sm primary" style={{ textDecoration: 'none' }}>
                          {t('dashboardViewDetails', 'View details')}
                        </Link>
                      )}
                   </div>
                 </div>
              </div>
            ))}
            
            {!scheduledThisWeek.length && (
              <div className="text-center text-muted-foreground text-sm py-4">
                {t('dashboardNoScheduledIntros', 'No scheduled intros this week.')}
              </div>
            )}
          </div>

          {/* ── Kaydettiğim İlanlar panel ── */}
          {savedTab && (
            <div className="panel">
              <div className="panel-head">
                <h3>{t('savedListings', 'Saved Listings')}</h3>
                <span className="text-xs text-muted-foreground">
                  {savedPosts.length}{' '}
                  {savedPosts.length === 1 ? t('listingOne', 'listing') : t('listingMany', 'listings')}
                </span>
              </div>
              {savedPosts.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  {t('noSavedListings', 'No saved listings yet.')}{' '}
                  <a href="/board" className="text-primary underline">{t('discoverListings', 'Discover listings')} &rarr;</a>
                </div>
              ) : (
                <ul className="space-y-2">
                  {savedPosts.map((b) => {
                    const p = b.post ?? b;
                    return (
                      <li key={b.id ?? p.id}>
                        <a
                          href={`/post/${p.id ?? b.postId ?? b.post_id}`}
                          className="flex items-center justify-between gap-4 rounded-xl border border-border/50 bg-background/55 p-3 transition-all hover:-translate-y-0.5 hover:border-primary/30"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium text-sm text-foreground">{p.title || `Post #${p.id}`}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{p.city || 'Remote'} · {p.required_expertise || '—'}</p>
                          </div>
                          <ArrowUpRight size={15} className="shrink-0 text-muted-foreground" />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
