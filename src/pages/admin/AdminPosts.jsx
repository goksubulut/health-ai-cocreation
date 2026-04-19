import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trash2, Calendar, Loader2, Eye } from 'lucide-react';
import { getAuth } from '@/lib/auth';

const STATUS_COLORS = {
  draft: 'bg-gray-500/15 text-gray-700 dark:text-gray-400',
  active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  meeting_scheduled: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  partner_found: 'bg-purple-500/15 text-purple-700 dark:text-purple-400',
  expired: 'bg-red-500/15 text-red-700 dark:text-red-400',
  removed_by_admin: 'bg-red-900/30 text-red-700 dark:text-red-500',
};

const STATUS_LABELS = {
  draft: 'Draft',
  active: 'Active',
  meeting_scheduled: 'Meeting Scheduled',
  partner_found: 'Partner Found',
  expired: 'Expired',
  removed_by_admin: 'Removed by Admin',
};

function ownerLabel(owner) {
  if (!owner) return '—';
  const n = [owner.firstName, owner.lastName].filter(Boolean).join(' ').trim();
  return n || owner.email || `User #${owner.id}`;
}

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [postToRemove, setPostToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');

  const load = useCallback(async () => {
    const a = getAuth();
    if (!a?.accessToken) return;
    setLoading(true);
    setErr('');
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (statusFilter) params.set('status', statusFilter);
      if (domainFilter.trim()) params.set('domain', domainFilter.trim());
      if (createdFrom) params.set('createdFrom', createdFrom);
      if (createdTo) params.set('createdTo', createdTo);

      const res = await fetch(`/api/admin/posts?${params}`, {
        headers: { Authorization: `Bearer ${a.accessToken}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to load posts.');
      const rows = Array.isArray(data.posts) ? data.posts : [];
      setPosts(rows);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, domainFilter, createdFrom, createdTo]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredPosts = posts.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const title = (p.title || '').toLowerCase();
    const owner = ownerLabel(p.owner).toLowerCase();
    const dom = (p.domain || '').toLowerCase();
    return title.includes(q) || owner.includes(q) || dom.includes(q);
  });

  const handleRemoveConfirm = async () => {
    if (!postToRemove) return;
    const a = getAuth();
    if (!a?.accessToken) return;
    setRemoving(true);
    try {
      const res = await fetch(`/api/admin/posts/${postToRemove.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${a.accessToken}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Remove failed.');
      setPostToRemove(null);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Remove failed.');
    } finally {
      setRemoving(false);
    }
  };

  const fmtDate = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif mb-2">Post Management</h1>
          <p className="text-muted-foreground">Monitor and moderate all collaboration posts on the platform.</p>
        </div>
      </div>

      {err && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {err}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 p-4 bg-card/40 border border-border/50 rounded-2xl backdrop-blur-sm">
        <div className="flex-1 relative min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search loaded posts by title, owner, or domain…"
            className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none min-w-[160px]"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="meeting_scheduled">Meeting Scheduled</option>
            <option value="partner_found">Partner Found</option>
            <option value="expired">Expired</option>
            <option value="removed_by_admin">Removed by Admin</option>
          </select>
          <input
            type="text"
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            placeholder="Domain contains…"
            className="h-10 px-3 min-w-[140px] bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-muted-foreground shrink-0" />
            <input
              type="date"
              value={createdFrom}
              onChange={(e) => setCreatedFrom(e.target.value)}
              className="h-10 px-2 bg-background border border-border rounded-lg text-sm"
            />
            <span className="text-muted-foreground text-xs">to</span>
            <input
              type="date"
              value={createdTo}
              onChange={(e) => setCreatedTo(e.target.value)}
              className="h-10 px-2 bg-background border border-border rounded-lg text-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => load()}
            className="h-10 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
          >
            Apply filters
          </button>
        </div>
      </div>

      <div className="bg-card/40 border border-border/50 rounded-2xl backdrop-blur-sm overflow-x-auto">
        {loading ? (
          <div className="p-8 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="animate-spin" size={18} /> Loading posts…
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[860px]">
            <thead>
              <tr className="border-b border-border/50 text-xs uppercase tracking-wider text-muted-foreground bg-accent/20">
                <th className="p-4 font-semibold">Title</th>
                <th className="p-4 font-semibold">Owner</th>
                <th className="p-4 font-semibold">Domain</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Created</th>
                <th className="p-4 font-semibold">Expires</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredPosts.map((post) => (
                <tr key={post.id} className="hover:bg-accent/30 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-foreground">{post.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">ID #{post.id}</div>
                  </td>
                  <td className="p-4 text-sm">{ownerLabel(post.owner)}</td>
                  <td className="p-4 text-sm text-muted-foreground">{post.domain}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        STATUS_COLORS[post.status] ?? 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {STATUS_LABELS[post.status] ?? post.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{fmtDate(post.createdAt)}</td>
                  <td className="p-4 text-sm text-muted-foreground">{fmtDate(post.expiryDate)}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 flex-wrap">
                      <Link
                        to={`/post/${post.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-background hover:bg-accent transition-colors"
                      >
                        <Eye size={14} /> View
                      </Link>
                      <button
                        type="button"
                        onClick={() => setPostToRemove(post)}
                        disabled={post.status === 'removed_by_admin'}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {postToRemove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !removing && setPostToRemove(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
                  <Trash2 size={24} />
                </div>
                <h3 className="text-xl font-serif font-bold mb-2">Remove Post?</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  Are you sure you want to remove the post <strong>&quot;{postToRemove.title}&quot;</strong>? It will be
                  marked as <strong>Removed by Admin</strong> and hidden from the public board.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="flex-1 btn-secondary py-2.5"
                    disabled={removing}
                    onClick={() => setPostToRemove(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md font-medium text-sm transition-colors disabled:opacity-60 py-2.5"
                    disabled={removing}
                    onClick={handleRemoveConfirm}
                  >
                    {removing ? 'Removing…' : 'Yes, Remove'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
