import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Calendar, DownloadCloud, Loader2 } from 'lucide-react';
import { getAuth } from '@/lib/auth';

const ACTION_OPTIONS = [
  '',
  'LOGIN',
  'FAILED_LOGIN',
  'LOGOUT',
  'REGISTER',
  'EMAIL_VERIFIED',
  'PASSWORD_RESET',
  'POST_CREATE',
  'POST_CLOSE',
  'POST_ADMIN_REMOVE',
  'MEETING_REQUEST',
  'MEETING_ACCEPT',
  'MEETING_DECLINE',
  'SLOT_CONFIRMED',
  'MEETING_CANCEL',
  'ACCOUNT_SUSPEND',
  'ACCOUNT_REACTIVATE',
];

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [search, setSearch] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [actionType, setActionType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const userIdFilterRef = useRef(userIdFilter);
  userIdFilterRef.current = userIdFilter;

  const load = useCallback(async () => {
    const a = getAuth();
    if (!a?.accessToken) return;
    setLoading(true);
    setErr('');
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (actionType) params.set('actionType', actionType);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const uidRaw = userIdFilterRef.current.trim();
      if (uidRaw && /^\d+$/.test(uidRaw)) {
        params.set('userId', uidRaw);
      }

      const res = await fetch(`/api/admin/logs?${params}`, {
        headers: { Authorization: `Bearer ${a.accessToken}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to load logs.');
      setLogs(Array.isArray(data.logs) ? data.logs : []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [actionType, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = logs.filter((log) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const blob = `${log.userEmail} ${log.actionType} ${log.targetLabel}`.toLowerCase();
    return blob.includes(q);
  });

  const exportCsv = () => {
    const a = getAuth();
    if (!a?.accessToken) return;
    const params = new URLSearchParams();
    if (actionType) params.set('actionType', actionType);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const uidRaw = userIdFilterRef.current.trim();
    if (uidRaw && /^\d+$/.test(uidRaw)) {
      params.set('userId', uidRaw);
    }
    const url = `/api/admin/logs/export?${params.toString()}`;
    fetch(url, { headers: { Authorization: `Bearer ${a.accessToken}` } })
      .then((r) => {
        if (!r.ok) throw new Error('Export failed');
        return r.blob();
      })
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = `activity_logs_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(objectUrl);
      })
      .catch(() => alert('Could not export CSV.'));
  };

  const fmtTs = (ts) => {
    if (!ts) return '—';
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return '—';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif mb-2">Activity Logs</h1>
          <p className="text-muted-foreground">
            Audit trail of registrations, posts, meetings, admin actions, and security events.
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="h-10 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-bold uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg"
        >
          <DownloadCloud size={16} /> Export CSV
        </button>
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
            placeholder="Filter current page by text…"
            className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <input
          type="text"
          inputMode="numeric"
          placeholder="User ID"
          value={userIdFilter}
          onChange={(e) => setUserIdFilter(e.target.value)}
          className="h-10 px-3 w-28 bg-background border border-border rounded-lg text-sm"
        />
        <select
          value={actionType}
          onChange={(e) => setActionType(e.target.value)}
          className="h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none min-w-[200px]"
        >
          {ACTION_OPTIONS.map((opt) => (
            <option key={opt || 'all'} value={opt}>
              {opt ? opt : 'All actions'}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar size={16} className="text-muted-foreground shrink-0" />
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-10 px-2 bg-background border border-border rounded-lg text-sm"
          />
          <span className="text-muted-foreground text-xs">to</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-10 px-2 bg-background border border-border rounded-lg text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="h-10 px-4 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium"
        >
          Apply
        </button>
      </div>

      <div className="bg-card/40 border border-border/50 rounded-2xl backdrop-blur-sm overflow-x-auto">
        {loading ? (
          <div className="p-8 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="animate-spin" size={18} /> Loading logs…
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-border/50 text-xs uppercase tracking-wider text-muted-foreground bg-accent/20">
                <th className="p-4 font-semibold">Timestamp</th>
                <th className="p-4 font-semibold">User</th>
                <th className="p-4 font-semibold">Action</th>
                <th className="p-4 font-semibold">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 font-mono text-sm tracking-tight">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-accent/30 transition-colors">
                  <td className="p-4 text-muted-foreground whitespace-nowrap">{fmtTs(log.timestamp)}</td>
                  <td className="p-4">
                    <span
                      className={
                        log.userEmail?.includes('admin') ? 'text-primary font-sans' : 'text-foreground font-sans'
                      }
                    >
                      {log.userEmail}
                    </span>
                  </td>
                  <td className="p-4 font-sans">
                    <span className="px-2 py-1 bg-accent/50 rounded border border-border/50 text-xs font-bold text-muted-foreground">
                      {log.actionType}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground font-sans">{log.targetLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
