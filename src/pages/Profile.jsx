import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Users,
  HelpCircle,
  Lock,
} from 'lucide-react';
import { clearAuth, getAuth, getAuthChangedEventName } from '@/lib/auth';
import { downloadUserDataPdf } from '@/lib/exportUserDataPdf';

const STATUS_LABELS = {
  draft: 'Draft',
  active: 'Active',
  meeting_scheduled: 'Meeting Scheduled',
  partner_found: 'Partner Found',
  expired: 'Expired',
  removed_by_admin: 'Removed by Admin',
};

const STATUS_COLORS = {
  draft: 'bg-gray-500/15 text-gray-700 dark:text-gray-400',
  active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  meeting_scheduled: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  partner_found: 'bg-purple-500/15 text-purple-700 dark:text-purple-400',
  expired: 'bg-red-500/15 text-red-700 dark:text-red-400',
  removed_by_admin: 'bg-red-900/25 text-red-600 dark:text-red-400',
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

const PASSWORD_UPPER_AND_DIGIT = /^(?=.*[A-Z])(?=.*[0-9])/;

function validatePasswordForm(p) {
  if (!p.current.trim()) return 'Enter your current password.';
  if (!p.new.trim()) return 'Enter a new password.';
  if (!p.confirm.trim()) return 'Confirm your new password.';
  if (p.new !== p.confirm) return 'New password and confirmation do not match.';
  if (p.new.length < 8) return 'Password must be at least 8 characters long.';
  if (!PASSWORD_UPPER_AND_DIGIT.test(p.new)) {
    return 'Password must contain at least one uppercase letter and one digit.';
  }
  if (p.new === p.current) return 'New password must be different from your current password.';
  return null;
}

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
  const [pwdForm, setPwdForm] = useState({ current: '', new: '', confirm: '' });
  const pwdFormRef = useRef(pwdForm);
  pwdFormRef.current = pwdForm;
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccessMsg, setPwdSuccessMsg] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmColor: 'bg-primary text-primary-foreground',
    requiresInput: false,
    inputValue: '',
    onConfirm: null,
  });

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

  const triggerDeletePost = (postId) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Post',
      message: 'Are you sure you want to delete this post permanently? This cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmColor: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      requiresInput: false,
      inputValue: '',
      onConfirm: () => executeDeletePost(postId),
    });
  };

  const executeDeletePost = async (postId) => {
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

  const triggerMarkPartnerFound = (postId) => {
    setModalConfig({
      isOpen: true,
      title: 'Confirm Action',
      message: 'Are you sure you want to mark this post as Partner Found? It will be closed to new requests.',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      confirmColor: 'bg-purple-600 text-white hover:bg-purple-700',
      requiresInput: false,
      inputValue: '',
      onConfirm: () => executeMarkPartnerFound(postId),
    });
  };

  const executeMarkPartnerFound = async (postId) => {
    const a = getAuth();
    if (!a?.accessToken) return;
    try {
      const res = await fetch(`/api/posts/${postId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${a.accessToken}`,
        },
        body: JSON.stringify({ status: 'partner_found' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Could not update status.');
      }
      await loadPosts();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Update failed.');
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
  const initials = (
    `${profile?.firstName?.[0] || ''}${profile?.lastName?.[0] || ''}` ||
    (profile?.email ? profile.email.slice(0, 2) : '')
  ).toUpperCase();
  const expertiseItems = (form.expertise || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 6);
  const publications = [
    'DP-ClinBERT: Differentially private fine-tuning for discharge summarization',
    'Federated de-identification across three regional EHR deployments',
    'Rethinking evaluation for clinical NLP: coverage, drift, and harm',
  ];

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

  const triggerChangePasswordConfirm = () => {
    setPwdSuccessMsg('');
    const err = validatePasswordForm(pwdForm);
    if (err) {
      setPwdError(err);
      return;
    }
    setPwdError('');
    setModalConfig({
      isOpen: true,
      title: 'Change password',
      message:
        'Are you sure you want to update your password? Your session will stay active on this device.',
      confirmText: 'Change password',
      cancelText: 'Cancel',
      confirmColor: 'bg-primary text-primary-foreground hover:bg-primary/90',
      requiresInput: false,
      inputValue: '',
      onConfirm: () => executeChangePassword(),
    });
  };

  const executeChangePassword = async () => {
    const { current: currentPassword, new: newPassword } = pwdFormRef.current;
    const err = validatePasswordForm(pwdFormRef.current);
    if (err) {
      alert(err);
      return;
    }
    const a = getAuth();
    if (!a?.accessToken) return;
    setPwdSaving(true);
    try {
      const res = await fetch('/api/users/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${a.accessToken}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          Array.isArray(data.errors) && data.errors.length > 0
            ? data.errors.join(' ')
            : data.message || 'Could not change password.';
        throw new Error(msg);
      }
      setPwdForm({ current: '', new: '', confirm: '' });
      setPwdError('');
      setPwdSuccessMsg('Password updated.');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not change password.');
    } finally {
      setPwdSaving(false);
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
      const data = await res.json();
      const base = `healthai_export_${profile?.id ?? 'data'}`;
      downloadUserDataPdf(data, `${base}.pdf`);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Export failed.');
    }
  };

  const triggerDeleteAccount = () => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Account',
      message: 'This will permanently delete your account and personal data (GDPR). Enter your password to confirm.',
      confirmText: 'Delete Account',
      cancelText: 'Cancel',
      confirmColor: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      requiresInput: true,
      inputValue: '',
      onConfirm: (password) => executeDeleteAccount(password),
    });
  };

  const executeDeleteAccount = async (password) => {
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
    <section className="page" data-screen-label="03 Profile">
      <div className="profile-hero">
        <div className="profile-cover" style={{ backgroundImage: 'url("/assets/mesh_4.png")' }}></div>
        <div className="profile-hero-inner">
          <div className="profile-avatar flex-shrink-0">{initials || 'US'}</div>
          <div className="profile-name">
            <h1>{loadingProfile ? 'Loading...' : (displayName || 'Profile')}</h1>
            <div className="meta">
              <span>{profile?.institution || 'Institution'}</span><span className="dot"></span>
              <span>{profile?.expertise || 'Role'}</span><span className="dot"></span>
              <span>{profile?.city || 'Location'}</span>
            </div>
          </div>
          <div className="profile-actions">
            <button
              onClick={() => setSearchParams({ tab: 'settings' })}
              className={`btn flex-1 ${tab === 'settings' ? 'btn-on-dark' : 'btn-ghost-on-dark'}`}
            >
              Edit profile
            </button>
            <button
              onClick={() => setSearchParams({ tab: 'posts' })}
              className={`btn flex-1 ${tab === 'posts' ? 'btn-on-dark' : 'btn-ghost-on-dark'}`}
            >
              Post history
            </button>
          </div>
        </div>
      </div>

      <div className="profile-body">
        <div className="space-y-6">
            <section className="profile-about">
              <h2>About</h2>
              <p>
                Keep your institution, location, and expertise updated so matching and recommendations can rank relevant collaboration opportunities.
              </p>
              <div className="expertise-grid">
                {expertiseItems.length ? expertiseItems.map((item) => (
                  <div key={item} className="expertise">
                    <div className="name">{item}</div>
                    <div className="years">Expertise area</div>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">No expertise set yet.</p>
                )}
              </div>
            </section>

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

            <section className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-sm backdrop-blur-md">
              <div className="mb-6 flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <Lock size={22} />
                </div>
                <div>
                  <h2 className="font-serif text-xl">Password</h2>
                  <p className="text-sm text-muted-foreground">
                    Use at least 8 characters, including one uppercase letter and one digit. New password cannot match
                    your current password.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Current password
                  </label>
                  <input
                    type="password"
                    autoComplete="current-password"
                    className={inputClass}
                    value={pwdForm.current}
                    onChange={(e) => {
                      setPwdForm({ ...pwdForm, current: e.target.value });
                      setPwdSuccessMsg('');
                    }}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    New password
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    className={inputClass}
                    value={pwdForm.new}
                    onChange={(e) => {
                      setPwdForm({ ...pwdForm, new: e.target.value });
                      setPwdSuccessMsg('');
                    }}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    className={inputClass}
                    value={pwdForm.confirm}
                    onChange={(e) => {
                      setPwdForm({ ...pwdForm, confirm: e.target.value });
                      setPwdSuccessMsg('');
                    }}
                  />
                </div>

                {pwdError && (
                  <p className="text-sm text-destructive" role="alert">
                    {pwdError}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={pwdSaving || loadingProfile}
                    onClick={triggerChangePasswordConfirm}
                  >
                    {pwdSaving ? 'Updating…' : 'Change password'}
                  </button>
                  {pwdSuccessMsg && (
                    <span className="text-sm text-emerald-600 dark:text-emerald-400">{pwdSuccessMsg}</span>
                  )}
                </div>
              </div>
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
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" className="btn-secondary inline-flex items-center gap-2" onClick={handleExport}>
                    <DownloadCloud size={18} /> Export my data
                  </button>
                  <span className="relative inline-flex shrink-0">
                    <HelpCircle
                      size={18}
                      className="peer cursor-help text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-full"
                      tabIndex={0}
                      aria-describedby="export-data-tooltip"
                      aria-label="How data export works"
                    />
                    <span
                      role="tooltip"
                      id="export-data-tooltip"
                      className="pointer-events-none invisible absolute left-1/2 top-full z-20 mt-2 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-border bg-card px-3 py-2 text-left text-xs leading-relaxed text-card-foreground shadow-lg opacity-0 transition-opacity peer-hover:visible peer-hover:opacity-100 peer-focus-visible:visible peer-focus-visible:opacity-100"
                    >
                      Download a PDF that bundles your profile, your posts, meeting requests (incoming and outgoing),
                      and NDA-related records. Click &quot;Export my data&quot; and your browser will save the file—same as
                      any other download.
                    </span>
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-primary inline-flex w-fit shrink-0 items-center gap-2 self-start bg-destructive text-destructive-foreground hover:opacity-90 sm:self-center"
                  onClick={triggerDeleteAccount}
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
                                STATUS_COLORS[p.status] || 'bg-muted text-muted-foreground'
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
                            {p.expiry_date && (
                              <span>
                                · {p.status === 'expired' ? 'Expired' : 'Expires'} {p.expiry_date}
                              </span>
                            )}
                            <ArrowUpRight
                              size={14}
                              className="inline opacity-0 transition-opacity group-hover:opacity-100 sm:ml-1"
                            />
                          </div>
                        </Link>
                        <div className="flex shrink-0 gap-2 sm:flex-col sm:items-stretch">
                          {p.status === 'meeting_scheduled' && (
                            <button
                              type="button"
                              onClick={() => triggerMarkPartnerFound(p.id)}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 px-3 py-2 text-xs font-medium text-purple-700 dark:text-purple-400 transition-colors hover:bg-purple-500/20"
                            >
                              <Users size={14} /> Mark as Partner Found
                            </button>
                          )}
                          <Link
                            to={`/post/${p.id}/edit`}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                          >
                            <Pencil size={14} /> Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => triggerDeletePost(p.id)}
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

        <div className="profile-side">
          <div className="side-card">
            <h3>At a glance</h3>
            <div>
              <div className="stat-row"><span className="k">Email Address</span><span className="v">{profile?.email || '—'}</span></div>
              <div className="stat-row"><span className="k">Active posts</span><span className="v">{posts.filter((p) => p.status === 'active').length}</span></div>
              <div className="stat-row"><span className="k">Total projects</span><span className="v">{posts.length}</span></div>
              <div className="stat-row"><span className="k">Member since</span><span className="v">{profile?.createdAt ? new Date(profile.createdAt).getFullYear() : '—'}</span></div>
            </div>
          </div>

          <div className="side-card">
            <h3>Recent publications</h3>
            <div>
              {publications.map((item, idx) => (
                <div key={item} className="pub">
                  <div className="pub-title">{item}</div>
                  <div className="pub-venue">Journal entry · {2025 - idx}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {modalConfig.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-50 w-full max-w-md overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-2xl"
            >
              <h3 className="mb-2 font-serif text-xl font-medium text-foreground">
                {modalConfig.title}
              </h3>
              <p className="mb-6 text-sm text-muted-foreground">
                {modalConfig.message}
              </p>
              
              {modalConfig.requiresInput && (
                <div className="mb-6">
                  <input
                    type="password"
                    placeholder="Enter your password..."
                    className={inputClass}
                    value={modalConfig.inputValue}
                    onChange={(e) => setModalConfig({ ...modalConfig, inputValue: e.target.value })}
                    autoFocus
                  />
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  className="rounded-full border border-border bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}
                >
                  {modalConfig.cancelText}
                </button>
                <button
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${modalConfig.confirmColor}`}
                  onClick={() => {
                    if (modalConfig.onConfirm) modalConfig.onConfirm(modalConfig.inputValue);
                    setModalConfig({ ...modalConfig, isOpen: false });
                  }}
                >
                  {modalConfig.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default Profile;
