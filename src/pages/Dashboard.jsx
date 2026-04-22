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
      title: 'New Matches',
      value: meetingsLoading ? '…' : incomingMatchCount === null ? '—' : String(incomingMatchCount),
      icon: Users,
      accent: 'violet',
      note: 'Interest on your posts',
    },
  ];

  return (
    <div className="min-h-[100dvh] pt-28 pb-16 bg-background relative overflow-hidden">
      {/* Subtle dot-grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.045]"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      <div className="px-6 lg:px-16 relative">
        <div className="max-w-[1400px] mx-auto space-y-5">

          {/* ── Hero header ── */}
          <motion.header
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-3xl overflow-hidden bg-zinc-950 p-8 lg:p-10 shadow-2xl"
          >
            {/* Background radial glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse 55% 90% at 95% 50%, rgba(255,255,255,0.08) 0%, transparent 70%)',
              }}
            />
            {/* Large decorative icon watermark */}
            <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-[0.05] pointer-events-none">
              {isHealthcare ? <Stethoscope size={210} strokeWidth={0.8} /> : <Cpu size={210} strokeWidth={0.8} />}
            </div>

            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.08] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] mb-5 text-white/60">
                  {isHealthcare ? <Stethoscope size={11} /> : <Cpu size={11} />}
                  {isHealthcare ? 'Healthcare' : 'Engineer'} · Workspace
                </div>
                <p className="font-serif text-4xl lg:text-[3.5rem] leading-none text-white/50 mb-1">
                  Welcome back,
                </p>
                <h1 className="font-serif text-4xl lg:text-[3.5rem] leading-none text-white">
                  {displayName}
                </h1>
              </div>

              {canCreatePost && (
                <CreatePostCTA to="/post/new" />
              )}
            </div>
          </motion.header>

          {/* ── Stats ── */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.07 * idx }}
                className={[
                  'group relative rounded-2xl border bg-card p-6 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg',
                  item.accent === 'emerald' && 'border-emerald-500/20 hover:border-emerald-400/40',
                  item.accent === 'amber'   && 'border-amber-500/20 hover:border-amber-400/40',
                  item.accent === 'violet'  && 'border-violet-500/20 hover:border-violet-400/40',
                ].filter(Boolean).join(' ')}
              >
                {/* Corner glow */}
                <div className={[
                  'absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl opacity-20 pointer-events-none',
                  item.accent === 'emerald' && 'bg-emerald-400',
                  item.accent === 'amber'   && 'bg-amber-400',
                  item.accent === 'violet'  && 'bg-violet-400',
                ].filter(Boolean).join(' ')} />

                <div className="flex items-start justify-between mb-5">
                  <div className={[
                    'p-2.5 rounded-xl',
                    item.accent === 'emerald' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                    item.accent === 'amber'   && 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                    item.accent === 'violet'  && 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
                  ].filter(Boolean).join(' ')}>
                    <item.icon size={18} />
                  </div>
                  <ArrowUpRight size={14} className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                </div>
                <p className="text-4xl font-bold tracking-tight mb-1">{item.value}</p>
                <p className="text-sm font-semibold text-foreground leading-tight mb-0.5">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.note}</p>
              </motion.div>
            ))}
          </section>

          {/* ── Main 2-col grid ── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2 space-y-5">

              {/* Posts section */}
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-3xl border border-border/60 bg-card/50 backdrop-blur-md overflow-hidden"
              >
                <div className="flex items-center justify-between px-6 py-5 border-b border-border/40">
                  <div>
                    <h2 className="font-serif text-2xl">
                      {isHealthcare ? 'Your Active Posts' : 'Your Active Collaborations'}
                    </h2>
                    {!loading && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {activePosts.length} listing{activePosts.length !== 1 ? 's' : ''} currently live
                      </p>
                    )}
                  </div>
                  <Link
                    to="/profile?tab=posts"
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
                  >
                    View history <ArrowUpRight size={12} />
                  </Link>
                </div>

                <div className="p-5">
                  {fetchErr && (
                    <p className="mb-4 text-sm text-destructive">{fetchErr}</p>
                  )}

                  {loading ? (
                    <p className="text-sm text-muted-foreground py-4">Loading your posts…</p>
                  ) : activePosts.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/60 bg-background/50 py-12 text-center">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                        <FileText size={17} className="text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">No active posts yet</p>
                      <p className="text-xs text-muted-foreground mb-5">
                        Create a listing to start finding collaborators.
                      </p>
                      {canCreatePost && (
                        <Link to="/post/new" className="btn-primary inline-flex text-sm py-2.5 px-5">
                          <Plus size={14} /> Create post
                        </Link>
                      )}
                    </div>
                  ) : (
                    <ul className="space-y-2.5">
                      {activePosts.map((p) => (
                        <li
                          key={p.id}
                          className="group relative rounded-2xl border border-border/50 bg-background/60 hover:bg-background hover:border-primary/25 transition-all duration-200 overflow-hidden"
                        >
                          {/* Left accent stripe */}
                          <div className="absolute left-0 top-3 bottom-3 w-[3px] bg-emerald-500 rounded-full" />

                          <div className="pl-5 pr-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <Link to={`/post/${p.id}`} className="min-w-0 flex-1 group/link">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                                  Active
                                </span>
                                {p.domain && (
                                  <>
                                    <span className="text-muted-foreground/40 text-[10px]">·</span>
                                    <span className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                                      {p.domain}
                                    </span>
                                  </>
                                )}
                              </div>
                              <h3 className="text-[15px] font-semibold text-foreground group-hover/link:text-primary transition-colors truncate">
                                {p.title}
                              </h3>
                              <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{p.description}</p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {p.project_stage && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted rounded-full px-2.5 py-1">
                                    <CheckCircle2 size={9} />
                                    {STAGE_LABELS[p.project_stage] || p.project_stage}
                                  </span>
                                )}
                                {p.expiry_date && (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <Clock size={9} />
                                    Expires {p.expiry_date}
                                  </span>
                                )}
                              </div>
                            </Link>

                            <div className="flex items-center gap-2 shrink-0">
                              <Link
                                to={`/post/${p.id}/edit`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                              >
                                <Pencil size={12} /> Edit
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleDeletePost(p.id)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.section>

              {/* Meetings CTA */}
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="relative rounded-3xl overflow-hidden bg-zinc-950 p-7 lg:p-8 shadow-xl"
              >
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(ellipse 50% 100% at 100% 50%, rgba(255,255,255,0.05), transparent)',
                  }}
                />
                <div className="absolute right-7 top-1/2 -translate-y-1/2 opacity-[0.04] pointer-events-none">
                  <CalendarCheck size={150} strokeWidth={0.8} className="text-white" />
                </div>

                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/35 mb-2">
                      Collaboration Hub
                    </p>
                    <h2 className="font-serif text-2xl text-white mb-1.5">Meeting Requests</h2>
                    <p className="text-sm text-white/50 max-w-sm leading-relaxed">
                      Review incoming interest, handle NDA agreements, and negotiate time slots with partners.
                    </p>
                  </div>
                  <CreatePostCTA to="/meetings" label="Open requests" variant="arrow" />
                </div>
              </motion.section>
            </div>

            {/* ── Notifications sidebar ── */}
            <motion.aside
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-3xl border border-border/60 bg-card/50 backdrop-blur-md overflow-hidden flex flex-col"
            >
              <div className="px-6 py-5 border-b border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <h2 className="font-serif text-xl">Notifications</h2>
                </div>
                {notifications.length > 0 && (
                  <span className="text-xs font-bold text-muted-foreground bg-muted rounded-full px-2.5 py-1 tabular-nums">
                    {notifications.length}
                  </span>
                )}
              </div>

              <div className="p-4 space-y-2 flex-1 overflow-y-auto">
                {meetingsLoading ? (
                  <p className="text-sm text-muted-foreground px-2 py-6 text-center">
                    Loading notifications…
                  </p>
                ) : notifications.length === 0 ? (
                  <div className="rounded-2xl bg-background/50 py-10 text-center">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                      <Bell size={15} className="text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed px-4">
                      No notifications yet. Incoming requests and responses will appear here.
                    </p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const isIncoming = n.kind === 'incoming';
                    const isDeclined = n.kind === 'declined';
                    const isScheduled = n.kind === 'scheduled';

                    const dotColor = isDeclined
                      ? 'bg-red-500'
                      : isScheduled
                      ? 'bg-emerald-500'
                      : isIncoming
                      ? 'bg-blue-500'
                      : 'bg-emerald-500';

                    const icon = isIncoming ? (
                      <Inbox size={13} />
                    ) : isDeclined ? (
                      <UserMinus size={13} />
                    ) : isScheduled ? (
                      <CalendarCheck size={13} />
                    ) : (
                      <CheckCircle2 size={13} />
                    );

                    const iconColor = isDeclined
                      ? 'text-red-500 bg-red-500/10'
                      : isScheduled
                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                      : isIncoming
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10'
                      : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10';

                    return (
                      <div
                        key={n.key}
                        className="rounded-xl border border-border/40 bg-background/60 p-3.5 transition-all duration-200 hover:border-primary/25 hover:bg-background hover:-translate-y-0.5 hover:shadow-sm"
                      >
                        <Link to={`/meetings/${n.meetingId}`} className="group flex gap-3">
                          <div className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center mt-0.5 ${iconColor}`}>
                            {icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-foreground leading-snug">{n.text}</p>
                            {n.at && (
                              <p className="mt-1 text-[10px] text-muted-foreground">
                                {new Date(n.at).toLocaleString()}
                              </p>
                            )}
                          </div>
                          <ArrowUpRight size={11} className="shrink-0 text-muted-foreground/30 group-hover:text-muted-foreground mt-0.5 transition-colors" />
                        </Link>
                        {n.calendarUrl && (
                          <a
                            href={n.calendarUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex rounded-full border border-border px-3 py-1.5 text-[11px] font-medium hover:bg-muted"
                          >
                            Add to Calendar
                          </a>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.aside>
          </div>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="rounded-3xl border border-border/60 bg-card/50 backdrop-blur-md p-6"
          >
            <div className="mb-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-2">
                Smart Matching
              </p>
              <h2 className="font-serif text-2xl">AI-Recommended Opportunities</h2>
            </div>

            {recommendationsLoading ? (
              <p className="text-sm text-muted-foreground">Loading recommendations…</p>
            ) : recommendedProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No recommendations yet. Complete your profile expertise and city to improve matching.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {recommendedProjects.map((project) => {
                  const badgeClass =
                    project.matchScore > 80
                      ? 'bg-emerald-500/90 text-white border-emerald-300/80 shadow-[0_0_0_1px_rgba(6,78,59,0.35)]'
                      : project.matchScore > 60
                      ? 'bg-amber-500/90 text-zinc-950 border-amber-200/90 shadow-[0_0_0_1px_rgba(120,53,15,0.35)]'
                      : 'bg-zinc-900/90 text-white border-zinc-300/70 shadow-[0_0_0_1px_rgba(0,0,0,0.35)]';
                  return (
                    <article
                      key={project.id}
                      className="group relative rounded-xl border border-border/60 bg-background/70 p-3 transition-colors hover:border-foreground/25 backdrop-blur-md"
                    >
                      <div className="relative">
                        <span className="absolute top-2 left-2 z-10 rounded-full bg-emerald-600/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                          Live
                        </span>
                        <img
                          src={project.imageUrl}
                          alt={project.title}
                          className="h-36 w-full rounded-lg object-cover"
                          loading="lazy"
                        />
                      </div>

                      <div className="absolute right-5 top-5">
                        <span
                          className={`inline-flex cursor-help items-center rounded-full border px-2.5 py-1 text-xs font-bold tracking-wide backdrop-blur-sm ${badgeClass}`}
                        >
                          {project.matchScore}% Match
                        </span>
                        <span className="pointer-events-none absolute right-0 top-8 z-20 mt-1 w-64 rounded-lg border border-border bg-card px-3 py-2 text-[11px] text-muted-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                          Recommended because your expertise and city match this project.
                        </span>
                      </div>

                      <p className="mt-2.5 text-[10px] font-bold uppercase tracking-widest text-primary/80">
                        {project.domain || 'Project'}
                      </p>
                      <h3 className="mt-1 pr-24 text-sm font-semibold text-foreground line-clamp-2">
                        {project.title}
                      </h3>
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-3">
                        {project.description}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                        {project.project_stage && (
                          <span className="rounded-full bg-muted px-2 py-1">
                            {STAGE_LABELS[project.project_stage] || project.project_stage}
                          </span>
                        )}
                        <span className="rounded-full bg-muted px-2 py-1">{project.city || 'Remote'}</span>
                        <span className="rounded-full bg-muted px-2 py-1">{project.role}</span>
                      </div>

                      <Link
                        to={`/post/${project.id}`}
                        className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        View Details <ArrowUpRight size={12} />
                      </Link>
                    </article>
                  );
                })}
              </div>
            )}
          </motion.section>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
