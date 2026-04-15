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

  const loadMeetingPending = async () => {
    const a = getAuth();
    if (!a?.accessToken) {
      setMeetingPending(null);
      return;
    }
    try {
      const res = await fetch('/api/meetings?type=all', {
        headers: { Authorization: `Bearer ${a.accessToken}` },
      });
      const json = await res.json();
      if (!res.ok) {
        setMeetingPending(null);
        return;
      }
      const list = Array.isArray(json.data) ? json.data : [];
      setMeetingPending(list.filter((x) => x.status === 'pending').length);
    } catch {
      setMeetingPending(null);
    }
  };

  useEffect(() => {
    loadPosts();
    loadMeetingPending();
    const ev = getAuthChangedEventName();
    const sync = () => {
      loadPosts();
      loadMeetingPending();
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
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-card text-foreground hover:bg-accent transition-colors"
              >
                <Bell size={18} />
              </button>
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
            { title: 'New Matches', value: '—', icon: Users },
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
                  <li key={p.id}>
                    <Link
                      to={`/post/${p.id}`}
                      className="block rounded-2xl border border-border/60 bg-background/70 p-5 transition-colors hover:border-primary/40 hover:bg-background"
                    >
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
                          <h3 className="text-xl font-semibold text-foreground truncate">
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
                          className="shrink-0 text-muted-foreground mt-1"
                        />
                      </div>
                    </Link>
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
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <p className="text-sm text-muted-foreground">
                  Notifications will appear here when you receive meeting requests and updates.
                </p>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
