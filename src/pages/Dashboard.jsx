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

const STAGE_LABELS = {
  idea: 'Idea',
  concept_validation: 'Concept validation',
  prototype: 'Prototype',
  pilot: 'Pilot',
  pre_deployment: 'Pre-deployment',
};

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
          text: `${formatPersonName(m.requester)} sent a meeting request for “${postTitle}”.`,
        });
      } else if (m.status === 'scheduled' && m.confirmed_slot) {
        const when = new Date(m.confirmed_slot).toLocaleString();
        items.push({
          key: `in-${m.id}-scheduled`,
          kind: 'scheduled',
          meetingId: m.id,
          at: updatedAt,
          text: `Your meeting with ${formatPersonName(m.requester)} for “${postTitle}” is scheduled for ${when}.`,
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
          text: `Your request for “${postTitle}” was declined by ${formatPersonName(m.post_owner)}.`,
        });
      } else if (m.status === 'accepted') {
        items.push({
          key: `out-${m.id}-accepted`,
          kind: 'accepted',
          meetingId: m.id,
          at: updatedAt,
          text: `Your request for “${postTitle}” was accepted by ${formatPersonName(m.post_owner)}.`,
        });
      } else if (m.status === 'scheduled' && m.confirmed_slot) {
        const when = new Date(m.confirmed_slot).toLocaleString();
        items.push({
          key: `out-${m.id}-scheduled`,
          kind: 'scheduled',
          meetingId: m.id,
          at: updatedAt,
          text: `Your meeting for “${postTitle}” is scheduled for ${when}.`,
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

  useEffect(() => {
    loadPosts();
    loadMeetingsData();
    const ev = getAuthChangedEventName();
    const sync = () => {
      loadPosts();
      loadMeetingsData();
    };
    window.addEventListener(ev, sync);
    return () => window.removeEventListener(ev, sync);
  }, []);

  const activePosts = useMemo(
    () => posts.filter((p) => p.status === 'active'),
    [posts]
  );

  return (
    <div className="min-h-[100dvh] pt-28 pb-16 px-6 lg:px-16 bg-background">
      <div className="max-w-[1400px] mx-auto space-y-8">
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-border/50 bg-gradient-to-br from-primary/10 via-background to-background p-6 lg:p-8 shadow-sm"
        >
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3 flex items-center gap-2">
                <Sparkles size={14} />
                Workspace Overview
              </p>
              <h1 className="font-serif text-4xl lg:text-5xl leading-tight">
                Welcome back, {displayName}
              </h1>
              <p className="mt-3 text-muted-foreground text-base lg:text-lg flex items-center gap-2">
                {isHealthcare ? <Stethoscope size={16} /> : <Cpu size={16} />}
                {isHealthcare ? 'Healthcare Dashboard' : 'Engineer Dashboard'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              
              {canCreatePost && (
                <Link to="/post/new" className="btn-primary">
                  <Plus size={16} /> Create Post
                </Link>
              )}
            </div>
          </div>
        </motion.header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: isHealthcare ? 'Active Posts' : 'Active collaborations',
              value: loading ? '…' : String(activePosts.length),
              icon: FileText,
            },
            {
              title: 'Pending Meetings',
              value: meetingPending === null ? '—' : String(meetingPending),
              icon: Clock,
            },
            {
              title: 'New Matches',
              value:
                meetingsLoading
                  ? '…'
                  : incomingMatchCount === null
                    ? '—'
                    : String(incomingMatchCount),
              icon: Users,
            },
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * idx }}
              className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{item.title}</p>
                <item.icon size={16} className="text-primary" />
              </div>
              <p className="mt-2 text-3xl font-semibold">{item.value}</p>
            </motion.div>
          ))}
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl border border-border/60 bg-card/50 backdrop-blur-md p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-3xl">
                {isHealthcare ? 'Your Active Posts' : 'Your Active Collaborations'}
              </h2>
              <Link
                to="/profile?tab=posts"
                className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
              >
                View History <ArrowUpRight size={14} />
              </Link>
            </div>

            {fetchErr && (
              <p className="mb-4 text-sm text-destructive">{fetchErr}</p>
            )}

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading your posts…</p>
            ) : activePosts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 bg-background/50 p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  No active posts yet. Create one to appear here.
                </p>
                {canCreatePost && (
                  <Link to="/post/new" className="btn-primary inline-flex">
                    <Plus size={16} /> Create post
                  </Link>
                )}
              </div>
            ) : (
              <ul className="space-y-4">
                {activePosts.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-2xl border border-border/60 bg-background/70 p-5 transition-colors hover:border-primary/40 hover:bg-background"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <Link to={`/post/${p.id}`} className="min-w-0 flex-1 group">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                Active
                              </span>
                              {p.domain && (
                                <span className="text-xs text-muted-foreground truncate max-w-[12rem]">
                                  {p.domain}
                                </span>
                              )}
                            </div>
                            <h3 className="text-xl font-semibold text-foreground truncate group-hover:text-primary">
                              {p.title}
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                              {p.description}
                            </p>
                            <div className="flex flex-wrap gap-3 pt-3">
                              {p.project_stage && (
                                <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-1.5 text-sm">
                                  <CheckCircle2 size={14} />
                                  {STAGE_LABELS[p.project_stage] || p.project_stage}
                                </span>
                              )}
                              {p.expiry_date && (
                                <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock size={12} />
                                  Expires {p.expiry_date}
                                </span>
                              )}
                            </div>
                          </div>
                          <ArrowUpRight
                            size={20}
                            className="shrink-0 text-muted-foreground mt-1 opacity-70 group-hover:opacity-100"
                          />
                        </div>
                      </Link>
                      <div className="flex shrink-0 gap-2 sm:flex-col sm:items-stretch sm:pt-0.5">
                        <Link
                          to={`/post/${p.id}/edit`}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                        >
                          <Pencil size={14} /> Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeletePost(p.id)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="rounded-3xl border border-border/60 bg-card/50 backdrop-blur-md p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl mb-2">Meeting requests</h2>
                <p className="text-sm text-muted-foreground max-w-xl">
                  Review interest on your posts and manage outgoing requests. Accept or
                  decline, handle NDA where required, and negotiate time slots until a
                  meeting is scheduled.
                </p>
              </div>
              <Link
                to="/meetings"
                className="btn-primary shrink-0 inline-flex items-center gap-2"
              >
                Open requests <ArrowUpRight size={16} />
              </Link>
            </div>
          </motion.section>
          </div>

          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-3xl border border-border/60 bg-card/50 backdrop-blur-md p-6"
          >
            <h2 className="font-serif text-2xl mb-5">Recent Notifications</h2>
            <div className="space-y-3">
              {meetingsLoading ? (
                <p className="text-sm text-muted-foreground">Loading notifications…</p>
              ) : notifications.length === 0 ? (
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <p className="text-sm text-muted-foreground">
                    No meeting notifications yet. Incoming requests and responses to your requests
                    will appear here.
                  </p>
                </div>
              ) : (
                notifications.map((n) => {
                  const icon =
                    n.kind === 'incoming' ? (
                      <Inbox size={16} className="shrink-0 text-primary mt-0.5" />
                    ) : n.kind === 'declined' ? (
                      <UserMinus size={16} className="shrink-0 text-destructive mt-0.5" />
                    ) : n.kind === 'scheduled' ? (
                      <CalendarCheck size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    ) : (
                      <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    );
                  return (
                    <Link
                      key={n.key}
                      to={`/meetings/${n.meetingId}`}
                      className="flex gap-3 rounded-2xl border border-border/60 bg-background/70 p-4 transition-colors hover:border-primary/35 hover:bg-background"
                    >
                      {icon}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground leading-snug">{n.text}</p>
                        {n.at && (
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            {new Date(n.at).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <ArrowUpRight size={16} className="shrink-0 text-muted-foreground mt-0.5" />
                    </Link>
                  );
                })
              )}
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
