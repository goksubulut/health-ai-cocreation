import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Inbox,
  Send,
  ArrowUpRight,
  Shield,
  Loader2,
  CalendarClock,
} from 'lucide-react';
import { getAuth, getAuthChangedEventName } from '@/lib/auth';

const MEETING_STATUS = {
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
  scheduled: 'Scheduled',
  cancelled: 'Cancelled',
};

function MeetingRequests() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialTab =
    tabParam === 'outgoing' || tabParam === 'sent' ? 'outgoing' : 'incoming';

  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    if (tabParam === 'outgoing' || tabParam === 'sent') setTab('outgoing');
    else if (tabParam === 'incoming' || tabParam === 'received') setTab('incoming');
  }, [tabParam]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    const a = getAuth();
    if (!a?.accessToken) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr('');
    try {
      const type = tab === 'incoming' ? 'received' : 'sent';
      const res = await fetch(`/api/meetings?type=${type}`, {
        headers: { Authorization: `Bearer ${a.accessToken}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load meetings.');
      setRows(Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
    const ev = getAuthChangedEventName();
    window.addEventListener(ev, load);
    return () => window.removeEventListener(ev, load);
  }, [load]);

  const visibleRows =
    tab === 'incoming' ? rows.filter((meeting) => meeting.status !== 'cancelled') : rows;

  return (
    <div className="min-h-[100dvh] pt-28 pb-16 px-6 lg:px-16 bg-background">
      <div className="max-w-4xl mx-auto space-y-8">
        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Matching
          </p>
          <h1 className="font-serif text-4xl lg:text-5xl">Meeting requests</h1>
          <p className="text-muted-foreground max-w-2xl">
            Incoming requests on your listings, and outgoing requests you sent. Propose time
            slots from Discovery when you express interest; here you can open a request to
            accept or decline and confirm a time once the post owner has accepted.
          </p>
        </motion.header>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab('incoming')}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'incoming'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <Inbox size={16} /> Incoming
          </button>
          <button
            type="button"
            onClick={() => setTab('outgoing')}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'outgoing'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <Send size={16} /> Outgoing
          </button>
        </div>

        {err && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {err}
          </div>
        )}

        <div className="rounded-2xl border border-border/60 bg-card/50 p-6">
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="animate-spin" size={16} /> Loading…
            </p>
          ) : visibleRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No {tab === 'incoming' ? 'incoming' : 'outgoing'} meeting requests yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {visibleRows.map((m) => (
                <li key={m.id}>
                  <Link
                    to={`/meetings/${m.id}`}
                    className="flex items-start justify-between gap-4 rounded-xl border border-border/50 bg-background/70 p-4 transition-colors hover:border-primary/35"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                          {MEETING_STATUS[m.status] || m.status}
                        </span>
                        {m.post?.confidentiality === 'meeting_only' && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Shield size={12} /> NDA post
                          </span>
                        )}
                        {m.nda_accepted && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400">
                            NDA accepted
                          </span>
                        )}
                        {m.post?.status === 'expired' && m.status === 'cancelled' && (
                          <span className="text-xs font-medium text-red-600 dark:text-red-400">
                            Closed (listing expired)
                          </span>
                        )}
                      </div>
                      <p className="font-medium truncate">
                        {m.post?.title || `Post #${m.post_id}`}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {tab === 'incoming' ? (
                          <>
                            From{' '}
                            <span className="text-foreground">
                              {m.requester
                                ? `${m.requester.first_name || ''} ${m.requester.last_name || ''}`.trim()
                                : 'Unknown'}
                            </span>
                          </>
                        ) : (
                          <>
                            To post owner{' '}
                            <span className="text-foreground">
                              {m.post_owner
                                ? `${m.post_owner.first_name || ''} ${m.post_owner.last_name || ''}`.trim()
                                : '—'}
                            </span>
                          </>
                        )}
                      </p>
                      {m.confirmed_slot && (
                        <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarClock size={12} />
                          {new Date(m.confirmed_slot).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <ArrowUpRight size={18} className="shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default MeetingRequests;
