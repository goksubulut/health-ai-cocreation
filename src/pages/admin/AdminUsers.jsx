import React, { useCallback, useEffect, useState } from 'react';
import { Search, UserX, UserCheck, Shield, Loader2, Eye, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAuth } from '@/lib/auth';

function nameOf(u) {
  return [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.email || `User #${u.id}`;
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [profileUser, setProfileUser] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [actionId, setActionId] = useState(null);

  const load = useCallback(async () => {
    const a = getAuth();
    if (!a?.accessToken) return;
    setLoading(true);
    setErr('');
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter === 'active') params.set('status', 'active');
      if (statusFilter === 'suspended') params.set('status', 'suspended');

      const res = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${a.accessToken}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to load users.');
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = users.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const blob = `${nameOf(u)} ${u.email ?? ''}`.toLowerCase();
    return blob.includes(q);
  });

  const toggleUserStatus = async (id) => {
    const a = getAuth();
    if (!a?.accessToken) return;
    setActionId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}/suspend`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${a.accessToken}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Action failed.');
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setActionId(null);
    }
  };

  const openProfile = async (id) => {
    const a = getAuth();
    if (!a?.accessToken) return;
    setProfileLoading(true);
    setProfileUser(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${a.accessToken}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not load user.');
      setProfileUser(data.user);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not load user.');
    } finally {
      setProfileLoading(false);
    }
  };

  const fmtReg = (d) => {
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
          <h1 className="text-3xl font-serif mb-2">User Management</h1>
          <p className="text-muted-foreground">Manage platform access, roles, and account statuses.</p>
        </div>
      </div>

      {err && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {err}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 p-4 bg-card/40 border border-border/50 rounded-2xl backdrop-blur-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email…"
            className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex gap-4 flex-wrap">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none min-w-[140px]"
          >
            <option value="">All Roles</option>
            <option value="engineer">Engineer</option>
            <option value="healthcare">Healthcare</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none min-w-[140px]"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      <div className="bg-card/40 border border-border/50 rounded-2xl backdrop-blur-sm overflow-x-auto">
        {loading ? (
          <div className="p-8 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="animate-spin" size={18} /> Loading users…
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b border-border/50 text-xs uppercase tracking-wider text-muted-foreground bg-accent/20">
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">Role</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Registered</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map((user) => {
                const suspended = user.isActive === false;
                const busy = actionId === user.id;
                return (
                  <tr key={user.id} className="hover:bg-accent/30 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-foreground flex items-center gap-2">
                        {nameOf(user)}
                        {user.role === 'admin' && <Shield size={14} className="text-primary" />}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{user.email}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          user.role === 'healthcare'
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : user.role === 'admin'
                              ? 'bg-primary/15 text-primary'
                              : 'bg-blue-500/15 text-blue-500'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          !suspended ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500/15 text-amber-500'
                        }`}
                      >
                        {!suspended ? 'active' : 'suspended'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{fmtReg(user.createdAt)}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => openProfile(user.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-background hover:bg-accent transition-colors"
                        >
                          <Eye size={14} /> View
                        </button>
                        {!suspended ? (
                          <button
                            type="button"
                            disabled={busy || user.role === 'admin'}
                            onClick={() => toggleUserStatus(user.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-amber-500 hover:bg-amber-500/10 transition-colors disabled:opacity-40"
                          >
                            <UserX size={14} /> {busy ? '…' : 'Suspend'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={busy || user.role === 'admin'}
                            onClick={() => toggleUserStatus(user.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-colors disabled:opacity-40"
                          >
                            <UserCheck size={14} /> {busy ? '…' : 'Reactivate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {(profileUser || profileLoading) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !profileLoading && setProfileUser(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start gap-4 mb-4">
                <h3 className="text-xl font-serif font-semibold">User profile</h3>
                <button
                  type="button"
                  aria-label="Close"
                  className="p-1 rounded-lg hover:bg-accent"
                  onClick={() => setProfileUser(null)}
                >
                  <X size={20} />
                </button>
              </div>
              {profileLoading ? (
                <p className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="animate-spin" size={16} /> Loading…
                </p>
              ) : profileUser ? (
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">Name</dt>
                    <dd className="font-medium">{nameOf(profileUser)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">Email</dt>
                    <dd>{profileUser.email}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">Role</dt>
                    <dd>{profileUser.role}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">Status</dt>
                    <dd>{profileUser.isActive === false ? 'Suspended' : 'Active'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">Institution</dt>
                    <dd>{profileUser.institution ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">City / Country</dt>
                    <dd>
                      {[profileUser.city, profileUser.country].filter(Boolean).join(', ') || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">Expertise</dt>
                    <dd>{profileUser.expertise ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">Registered</dt>
                    <dd>{fmtReg(profileUser.createdAt)}</dd>
                  </div>
                </dl>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
