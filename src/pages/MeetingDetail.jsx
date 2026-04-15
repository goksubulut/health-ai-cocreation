import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Loader2,
  Shield,
  CalendarClock,
  Check,
  X,
  Trash2,
} from 'lucide-react';
import { getAuth, getAuthChangedEventName } from '@/lib/auth';

const STATUS_LABEL = {
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
  scheduled: 'Scheduled',
  cancelled: 'Cancelled',
};

function MeetingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [m, setM] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [slotInputs, setSlotInputs] = useState(['']);

  const auth = getAuth();
  const token = auth?.accessToken;
  const uid = auth?.user?.id;

  const load = useCallback(async () => {
    if (!token || !id) {
      setM(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr('');
    try {
      const res = await fetch(`/api/meetings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load meeting.');
      setM(json.data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load.');
      setM(null);
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    load();
    const ev = getAuthChangedEventName();
    window.addEventListener(ev, load);
    return () => window.removeEventListener(ev, load);
  }, [load]);

  const isOwner = m && uid != null && m.post_owner_id === uid;
  const isRequester = m && uid != null && m.requester_id === uid;
  const canCancel =
    m && ['pending', 'accepted', 'scheduled'].includes(m.status);

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const accept = async () => {
    if (!token || !id) return;
    setActionBusy(true);
    setErr('');
    try {
      const res = await fetch(`/api/meetings/${id}/accept`, {
        method: 'PATCH',
        headers,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.message || 'Accept failed.');
      setM(json.data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Accept failed.');
    } finally {
      setActionBusy(false);
    }
  };

  const decline = async () => {
    if (!token || !id) return;
    setActionBusy(true);
    setErr('');
    try {
      const res = await fetch(`/api/meetings/${id}/decline`, {
        method: 'PATCH',
        headers,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.message || 'Decline failed.');
      setM(json.data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Decline failed.');
    } finally {
      setActionBusy(false);
    }
  };

  const submitProposedSlots = async (e) => {
    e.preventDefault();
    if (!token || !id) return;
    const slots = slotInputs
      .map((s) => s.trim())
      .filter(Boolean)
      .map((raw) => {
        const dt = new Date(raw);
        if (Number.isNaN(dt.getTime())) return null;
        return { slot_datetime: dt.toISOString() };
      })
      .filter(Boolean);
    if (slots.length === 0) {
      setErr('Add at least one valid datetime.');
      return;
    }
    setActionBusy(true);
    setErr('');
    try {
      const res = await fetch(`/api/meetings/${id}/slots`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ slots }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.message || 'Could not propose slots.');
      setSlotInputs(['']);
      await load();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Could not propose slots.');
    } finally {
      setActionBusy(false);
    }
  };

  const confirmSlot = async (slotId) => {
    if (!token || !id) return;
    setActionBusy(true);
    setErr('');
    try {
      const res = await fetch(`/api/meetings/${id}/slots/${slotId}/confirm`, {
        method: 'PATCH',
        headers,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.message || 'Confirm failed.');
      setM(json.data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Confirm failed.');
    } finally {
      setActionBusy(false);
    }
  };

  const cancelMeeting = async () => {
    if (!token || !id || !canCancel) return;
    if (!window.confirm('Cancel this meeting request?')) return;
    setActionBusy(true);
    setErr('');
    try {
      const res = await fetch(`/api/meetings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      let message = '';
      try {
        const json = await res.json();
        message = json.message || '';
      } catch {
        /* empty body */
      }
      if (!res.ok) throw new Error(message || 'Cancel failed.');
      navigate('/meetings');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Cancel failed.');
    } finally {
      setActionBusy(false);
    }
  };

  const slots = Array.isArray(m?.time_slots) ? m.time_slots : [];

  return (
    <div className="min-h-[100dvh] pt-28 pb-16 px-6 lg:px-16 bg-background">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link
          to="/meetings"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} /> Back to meeting requests
        </Link>

        {loading ? (
          <p className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="animate-spin" size={18} /> Loading…
          </p>
        ) : err && !m ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {err}
          </div>
        ) : m ? (
          <>
            <motion.header
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                  {STATUS_LABEL[m.status] || m.status}
                </span>
                {m.post?.confidentiality === 'meeting_only' && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Shield size={12} /> NDA post
                  </span>
                )}
                {m.nda_accepted && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">
                    NDA accepted
                    {m.nda_accepted_at &&
                      ` · ${new Date(m.nda_accepted_at).toLocaleString()}`}
                  </span>
                )}
              </div>
              <h1 className="font-serif text-3xl lg:text-4xl">
                {m.post?.title || `Post #${m.post_id}`}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isOwner && (
                  <>
                    Request from{' '}
                    <span className="text-foreground">
                      {m.requester
                        ? `${m.requester.first_name || ''} ${m.requester.last_name || ''}`.trim()
                        : '—'}
                    </span>
                  </>
                )}
                {isRequester && !isOwner && (
                  <>
                    Your request to{' '}
                    <span className="text-foreground">
                      {m.post_owner
                        ? `${m.post_owner.first_name || ''} ${m.post_owner.last_name || ''}`.trim()
                        : '—'}
                    </span>
                  </>
                )}
              </p>
              {m.message && (
                <div className="rounded-xl border border-border/60 bg-card/50 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Message
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                </div>
              )}
            </motion.header>

            {err && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {err}
              </div>
            )}

            {isOwner && m.status === 'pending' && (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={accept}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Check size={16} /> Accept
                </button>
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={decline}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  <X size={16} /> Decline
                </button>
              </div>
            )}

            {isOwner && m.status === 'accepted' && (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={decline}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  <X size={16} /> Decline
                </button>
              </div>
            )}

            {m.status === 'scheduled' && m.confirmed_slot && (
              <div className="rounded-2xl border border-border/60 bg-card/50 p-5 flex items-start gap-3">
                <CalendarClock className="shrink-0 text-primary mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-medium">Scheduled meeting</p>
                  <p className="text-lg">
                    {new Date(m.confirmed_slot).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {m.status === 'accepted' && (
              <section className="space-y-4 rounded-2xl border border-border/60 bg-card/50 p-6">
                <h2 className="font-serif text-xl">Time slots</h2>
                <p className="text-sm text-muted-foreground">
                  Propose up to five slots in total. The other party picks one to confirm.
                  You cannot confirm a slot you proposed.
                </p>

                {slots.length > 0 && (
                  <ul className="space-y-2">
                    {slots.map((s) => {
                      const canConfirm =
                        uid != null &&
                        s.proposed_by !== uid &&
                        m.status === 'accepted';
                      return (
                        <li
                          key={s.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/70 px-4 py-3"
                        >
                          <span className="text-sm">
                            {new Date(s.slot_datetime).toLocaleString()}
                            <span className="text-muted-foreground ml-2">
                              (proposed by{' '}
                              {s.proposed_by === m.requester_id
                                ? 'requester'
                                : 'owner'}
                              )
                            </span>
                          </span>
                          {s.is_selected && (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400">
                              Selected
                            </span>
                          )}
                          {canConfirm && !s.is_selected && (
                            <button
                              type="button"
                              disabled={actionBusy}
                              onClick={() => confirmSlot(s.id)}
                              className="text-sm font-medium text-primary hover:underline"
                            >
                              Confirm this slot
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                <form onSubmit={submitProposedSlots} className="space-y-3 pt-2">
                  {slotInputs.map((val, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="datetime-local"
                        value={val}
                        onChange={(e) => {
                          const next = [...slotInputs];
                          next[i] = e.target.value;
                          setSlotInputs(next);
                        }}
                        className="flex h-11 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                      {slotInputs.length > 1 && (
                        <button
                          type="button"
                          className="px-3 text-muted-foreground hover:text-foreground"
                          onClick={() =>
                            setSlotInputs(slotInputs.filter((_, j) => j !== i))
                          }
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  {slots.length + slotInputs.filter(Boolean).length < 5 && (
                    <button
                      type="button"
                      className="text-sm text-primary hover:underline"
                      onClick={() => setSlotInputs([...slotInputs, ''])}
                    >
                      + Add another slot
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={actionBusy}
                    className="btn-primary"
                  >
                    Propose {slotInputs.filter(Boolean).length || ''} slot(s)
                  </button>
                </form>
              </section>
            )}

            {canCancel && (
              <div className="pt-4 border-t border-border/50">
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={cancelMeeting}
                  className="inline-flex items-center gap-2 text-sm text-destructive hover:underline"
                >
                  <Trash2 size={16} /> Cancel meeting request
                </button>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

export default MeetingDetail;
