import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { NoMeetings } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import {
  Inbox,
  Send,
  ArrowUpRight,
  Shield,
  Loader2,
  CalendarClock,
  Sparkles,
  Clock3,
  CheckCircle2,
  CircleDashed,
} from 'lucide-react';
import { getAuth, getAuthChangedEventName } from '@/lib/auth';
import { useLocale } from '@/contexts/locale-context';

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
  const { t } = useLocale();
  const initialTab = tabParam === 'outgoing' || tabParam === 'sent' ? 'outgoing' : 'incoming';
  const [tab, setTab] = useState(initialTab);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (tabParam === 'outgoing' || tabParam === 'sent') setTab('outgoing');
    else if (tabParam === 'incoming' || tabParam === 'received') setTab('incoming');
  }, [tabParam]);

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

  const visibleRows = tab === 'incoming' ? rows.filter((meeting) => meeting.status !== 'cancelled') : rows;
  const pendingCount = visibleRows.filter((meeting) => meeting.status === 'pending').length;
  const scheduledCount = visibleRows.filter((meeting) => meeting.status === 'scheduled').length;
  const ndaCount = visibleRows.filter((meeting) => meeting.nda_accepted).length;

  return (
    <div className="min-h-[100dvh] pt-28 pb-16 px-6 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[28px] border border-white/15 bg-black/45 p-7 shadow-[0_20px_80px_rgba(15,8,36,0.35)] backdrop-blur-xl lg:p-10"
        >
          <div className="pointer-events-none absolute -left-14 -top-14 h-48 w-48 rounded-full bg-violet-400/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-16 h-56 w-56 rounded-full bg-emerald-300/10 blur-3xl" />
          <p className="hero-eyebrow">{t('meetingsWorkspaceEyebrow', 'Requests workspace')}</p>
          <h1 className="mt-2 font-serif text-4xl text-white lg:text-5xl">
            {t('meetingsWorkspaceTitle1', 'Meetings and intros,')}
            <br />
            <em className="text-[#cab8ff]">{t('meetingsWorkspaceTitleEm', 'organized in one flow.')}</em>
          </h1>
          <p className="mt-4 max-w-3xl text-sm text-white/80 lg:text-base">
            {t(
              'meetingsWorkspaceDesc',
              'Incoming requests on your listings, and outgoing requests you sent. Propose time slots from Discovery when you express interest; here you can open a request to accept or decline and confirm a time once the post owner has accepted.'
            )}
          </p>
        </motion.header>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-card/75 p-4 backdrop-blur-md">
            <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t('meetingsPendingNow', 'Pending now')}</div>
            <div className="mt-2 flex items-center gap-2 text-3xl font-serif text-foreground">
              <Clock3 size={20} className="text-amber-500" /> {pendingCount}
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/75 p-4 backdrop-blur-md">
            <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t('statusScheduled', 'Scheduled')}</div>
            <div className="mt-2 flex items-center gap-2 text-3xl font-serif text-foreground">
              <CheckCircle2 size={20} className="text-emerald-500" /> {scheduledCount}
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/75 p-4 backdrop-blur-md">
            <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t('ndaAccepted', 'NDA / accepted')}</div>
            <div className="mt-2 flex items-center gap-2 text-3xl font-serif text-foreground">
              <Shield size={20} className="text-violet-500" /> {ndaCount}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/70 p-3 backdrop-blur-md">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTab('incoming')}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                tab === 'incoming'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <Inbox size={16} /> {t('meetingsIncoming', 'Incoming')}
            </button>
            <button
              type="button"
              onClick={() => setTab('outgoing')}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                tab === 'outgoing'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <Send size={16} /> {t('meetingsOutgoing', 'Outgoing')}
            </button>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs text-muted-foreground">
            <Sparkles size={13} /> {visibleRows.length} {t('meetingsVisibleRequests', 'visible requests')}
          </div>
        </div>

        {err && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {err}
          </div>
        )}

        <div className="rounded-2xl border border-border/60 bg-card/50 p-4 backdrop-blur-md sm:p-6">
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="animate-spin" size={16} /> {t('meetingsLoading', 'Loading…')}
            </p>
          ) : visibleRows.length === 0 ? (
            <NoMeetings />
          ) : (
            <ul className="space-y-3">
              {visibleRows.map((m) => (
                <li key={m.id}>
                  <Link
                    to={`/meetings/${m.id}`}
                    className="group flex items-start justify-between gap-4 rounded-xl border border-border/50 bg-background/55 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:bg-background/70"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                          {m.status === 'pending'
                            ? t('statusPending', 'Pending')
                            : m.status === 'accepted'
                              ? t('statusAccepted', 'Accepted')
                              : m.status === 'declined'
                                ? t('statusDeclined', 'Declined')
                                : m.status === 'scheduled'
                                  ? t('statusScheduled', 'Scheduled')
                                  : m.status === 'cancelled'
                                    ? t('statusCancelled', 'Cancelled')
                                    : m.status}
                        </span>
                        {m.post?.confidentiality === 'meeting_only' && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Shield size={12} /> NDA post
                          </span>
                        )}
                        {m.nda_accepted && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400">{t('ndaAccepted', 'NDA / accepted')}</span>
                        )}
                        {m.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                            <CircleDashed size={12} /> {t('awaitingResponse', 'Awaiting response')}
                          </span>
                        )}
                        {m.post?.status === 'expired' && m.status === 'cancelled' && (
                          <span className="text-xs font-medium text-red-600 dark:text-red-400">
                            {t('meetingClosedListingExpired', 'Closed (listing expired)')}
                          </span>
                        )}
                      </div>
                      <p className="truncate font-medium">{m.post?.title || `Post #${m.post_id}`}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
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
                    <ArrowUpRight
                      size={18}
                      className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
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
