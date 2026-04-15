import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  UserX,
  DownloadCloud,
  Settings,
  ShieldCheck,
  FileText,
  ArrowUpRight,
  Loader2,
  Pencil,
  Trash2,
} from 'lucide-react';
import { clearAuth, getAuth, getAuthChangedEventName } from '@/lib/auth';

const STATUS_LABELS = {
  draft: 'Draft',
  active: 'Active',
  meeting_scheduled: 'Meeting scheduled',
  partner_found: 'Partner found',
  expired: 'Expired',
};

const STAGE_LABELS = {
  idea: 'Idea',
  concept_validation: 'Concept validation',
  prototype: 'Prototype',
  pilot: 'Pilot',
  pre_deployment: 'Pre-deployment',
};

const inputClass =
  'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function Profile() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'posts' ? 'posts' : 'settings';

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    institution: '',
    city: '',
    country: '',
    expertise: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const auth = getAuth();
  const token = auth?.accessToken;

  const loadProfile = useCallback(async () => {
    const a = getAuth();
    if (!a?.accessToken) {
      setProfile(null);
      setLoadingProfile(false);
      return;
    }
    setLoadingProfile(true);
    setError('');
    try {
      const res = await fetch('/api/users/profile', {
        headers: { Authorization: `Bearer ${a.accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load profile.');
      const u = data.user;
      setProfile(u);
      setForm({
        firstName: u.firstName ?? '',
        lastName: u.lastName ?? '',
        institution: u.institution ?? '',
        city: u.city ?? '',
        country: u.country ?? '',
        expertise: u.expertise ?? '',
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load profile.');
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  const loadPosts = useCallback(async () => {
    const a = getAuth();
    if (!a?.accessToken) {
      setPosts([]);
      return;
    }
    setLoadingPosts(true);
    try {
      const res = await fetch('/api/posts/mine?limit=100', {
        headers: { Authorization: `Bearer ${a.accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load posts.');
      setPosts(Array.isArray(data.data) ? data.data : []);
    } catch {
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }, []);

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
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed.');
    }
  };

  useEffect(() => {
    loadProfile();
    const ev = getAuthChangedEventName();
    window.addEventListener(ev, loadProfile);
    return () => window.removeEventListener(ev, loadProfile);
  }, [loadProfile]);

  useEffect(() => {
    if (tab === 'posts') loadPosts();
  }, [tab, loadPosts]);

  const displayName = profile
    ? [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || profile.email
    : '';

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setSaveMsg('');
    setError('');
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          institution: form.institution || null,
          city: form.city || null,
          country: form.country || null,
          expertise: form.expertise || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not save profile.');
      setProfile(data.user);
      setSaveMsg('Profile saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/users/export-data', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Export failed.');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `healthai_export_${profile?.id ?? 'data'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Export failed.');
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        'This will permanently delete your account and personal data (GDPR). Continue?'
      )
    ) {
      return;
    }
    const password = window.prompt('Enter your password to confirm:');
    if (!password) return;
    if (!token) return;
    try {
      const res = await fetch('/api/users/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Deletion failed.');
      clearAuth();
      window.location.href = '/auth?mode=login';
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Deletion failed.');
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background pt-28 pb-16 px-4 sm:px-6 lg:px-16">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex flex-col gap-4 border-b border-border/40 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Account
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl tracking-tight">
              {loadingProfile ? (
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="animate-spin" size={22} /> Loading…
                </span>
              ) : (
                displayName || 'Profile'
              )}
            </h1>
            {profile?.email && (
              <p className="mt-1 text-sm text-muted-foreground">{profile.email}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSearchParams({ tab: 'settings' })}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                tab === 'settings'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Profile
            </button>
            <button
              type="button"
              onClick={() => setSearchParams({ tab: 'posts' })}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                tab === 'posts'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Post history
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {tab === 'settings' && (
          <>
            <section className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-sm backdrop-blur-md">
              <div className="mb-6 flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <Settings size={22} />
                </div>
                <div>
                  <h2 className="font-serif text-xl">Base information</h2>
                  <p className="text-sm text-muted-foreground">
                    Name and affiliation (email cannot be changed here).
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      First name
                    </label>
                    <input
                      className={inputClass}
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      required
                      minLength={2}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Last name
                    </label>
                    <input
                      className={inputClass}
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      required
                      minLength={2}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Institution
                  </label>
                  <input
                    className={inputClass}
                    value={form.institution}
                    onChange={(e) => setForm({ ...form, institution: e.target.value })}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      City
                    </label>
                    <input
                      className={inputClass}
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Country
                    </label>
                    <input
                      className={inputClass}
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Expertise
                  </label>
                  <input
                    className={inputClass}
                    value={form.expertise}
                    onChange={(e) => setForm({ ...form, expertise: e.target.value })}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button type="submit" className="btn-primary" disabled={saving || loadingProfile}>
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                  {saveMsg && (
                    <span className="text-sm text-emerald-600 dark:text-emerald-400">{saveMsg}</span>
                  )}
                </div>
              </form>
            </section>

            <section className="rounded-2xl border border-border/60 bg-card/40 p-6">
              <div className="mb-4 flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h2 className="font-serif text-xl">GDPR & data</h2>
                  <p className="text-sm text-muted-foreground">
                    Export or delete your account data.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" className="btn-secondary inline-flex items-center gap-2" onClick={handleExport}>
                  <DownloadCloud size={18} /> Export my data
                </button>
                <button
                  type="button"
                  className="btn-primary inline-flex items-center gap-2 bg-destructive text-destructive-foreground hover:opacity-90"
                  onClick={handleDelete}
                >
                  <UserX size={18} /> Delete account
                </button>
              </div>
            </section>
          </>
        )}

        {tab === 'posts' && (
          <section className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-sm backdrop-blur-md">
            <div className="mb-6 flex items-center gap-2">
              <FileText size={20} className="text-primary" />
              <div>
                <h2 className="font-serif text-xl">All your posts</h2>
                <p className="text-sm text-muted-foreground">
                  Active and inactive listings (draft, scheduled, closed, expired).
                </p>
              </div>
            </div>

            {loadingPosts ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="animate-spin" size={16} /> Loading posts…
              </p>
            ) : posts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No posts yet.{' '}
                <Link to="/post/new" className="text-primary underline">
                  Create a post
                </Link>
                .
              </p>
            ) : (
              <ul className="space-y-3">
                {posts.map((p) => {
                  const isActive = p.status === 'active';
                  return (
                    <li
                      key={p.id}
                      className="rounded-xl border border-border/50 bg-background/60 p-4 transition-colors hover:border-primary/20"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <Link to={`/post/${p.id}`} className="min-w-0 flex-1 group">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${
                                isActive
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {STATUS_LABELS[p.status] || p.status}
                            </span>
                            {p.domain && (
                              <span className="text-xs text-muted-foreground truncate">{p.domain}</span>
                            )}
                          </div>
                          <h3 className="font-medium text-foreground truncate group-hover:text-primary">
                            {p.title}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {p.project_stage && (
                              <span>
                                Stage: {STAGE_LABELS[p.project_stage] || p.project_stage}
                              </span>
                            )}
                            {p.expiry_date && <span>· Expires {p.expiry_date}</span>}
                            <ArrowUpRight
                              size={14}
                              className="inline opacity-0 transition-opacity group-hover:opacity-100 sm:ml-1"
                            />
                          </div>
                        </Link>
                        <div className="flex shrink-0 gap-2 sm:flex-col sm:items-stretch">
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
                  );
                })}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default Profile;
