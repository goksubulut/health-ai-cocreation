import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [editingSlotId, setEditingSlotId] = useState(null);
  const [editSlotValue, setEditSlotValue] = useState('');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

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

  const toDatetimeLocalValue = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const submitProposedSlots = async (e) => {
    e.preventDefault();
    if (!token || !id || !isRequester) return;
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

  const saveEditedSlot = async (slotId) => {
    if (!token || !id) return;
    const dt = new Date(editSlotValue);
    if (Number.isNaN(dt.getTime())) {
      setErr('Invalid date and time.');
      return;
    }
    setActionBusy(true);
    setErr('');
    try {
      const res = await fetch(`/api/meetings/${id}/slots/${slotId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ slot_datetime: dt.toISOString() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.message || 'Could not update slot.');
      setM(json.data);
      setEditingSlotId(null);
      setEditSlotValue('');
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Could not update slot.');
    } finally {
      setActionBusy(false);
    }
  };

  const removeSlot = async (slotId) => {
    if (!token || !id) return;
    if (!window.confirm('Remove this time slot?')) return;
    setActionBusy(true);
    setErr('');
    try {
      const res = await fetch(`/api/meetings/${id}/slots/${slotId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.message || 'Could not remove slot.');
      setM(json.data);
      if (editingSlotId === slotId) {
        setEditingSlotId(null);
        setEditSlotValue('');
      }
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Could not remove slot.');
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

            {['pending', 'accepted'].includes(m.status) && (
              <section className="space-y-4 rounded-2xl border border-border/60 bg-card/50 p-6">
                <h2 className="font-serif text-xl">Time slots</h2>
                {isOwner && (
                  <p className="text-sm text-muted-foreground">
                    The requester proposes times (up to five). After you accept this request, you can confirm
                    one slot to schedule the meeting. You do not propose new slots here.
                  </p>
                )}
                {isRequester && (
                  <p className="text-sm text-muted-foreground">
                    Propose up to five slots in total. The post owner confirms one after accepting your
                    request. You can edit or remove your proposed slots below while the meeting is still
                    pending or accepted.
                  </p>
                )}

                {slots.length > 0 && (
                  <ul className="space-y-2">
                    {slots.map((s) => {
                      const canConfirm =
                        isOwner &&
                        uid != null &&
                        s.proposed_by !== uid &&
                        m.status === 'accepted';
                      const requesterCanEdit =
                        isRequester &&
                        uid != null &&
                        s.proposed_by === uid &&
                        ['pending', 'accepted'].includes(m.status);
                      return (
                        <li
                          key={s.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/70 px-4 py-3"
                        >
                          {editingSlotId === s.id ? (
                            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[200px]">
                              <input
                                type="datetime-local"
                                value={editSlotValue}
                                onChange={(e) => setEditSlotValue(e.target.value)}
                                className="flex h-11 flex-1 min-w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                              />
                              <button
                                type="button"
                                disabled={actionBusy}
                                onClick={() => saveEditedSlot(s.id)}
                                className="text-sm font-medium text-primary hover:underline"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                disabled={actionBusy}
                                onClick={() => {
                                  setEditingSlotId(null);
                                  setEditSlotValue('');
                                }}
                                className="text-sm text-muted-foreground hover:text-foreground"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="text-sm">
                                {new Date(s.slot_datetime).toLocaleString()}
                                <span className="text-muted-foreground ml-2">
                                  (proposed by{' '}
                                  {s.proposed_by === m.requester_id ? 'requester' : 'owner'})
                                </span>
                              </span>
                              <div className="flex flex-wrap items-center gap-2">
                                {s.is_selected && (
                                  <span className="text-xs text-emerald-600 dark:text-emerald-400">
                                    Selected
                                  </span>
                                )}
                                {requesterCanEdit && (
                                  <>
                                    <button
                                      type="button"
                                      disabled={actionBusy}
                                      onClick={() => {
                                        setEditingSlotId(s.id);
                                        setEditSlotValue(toDatetimeLocalValue(s.slot_datetime));
                                      }}
                                      className="text-sm font-medium text-primary hover:underline"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      disabled={actionBusy}
                                      onClick={() => removeSlot(s.id)}
                                      className="text-sm text-destructive hover:underline"
                                    >
                                      Remove
                                    </button>
                                  </>
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
                              </div>
                            </>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {isRequester &&
                  ['pending', 'accepted'].includes(m.status) &&
                  slots.length + slotInputs.filter(Boolean).length < 5 && (
                    <form
                      onSubmit={submitProposedSlots}
                      className={`space-y-3 pt-2 ${slots.length > 0 ? 'border-t border-border/40' : ''}`}
                    >
                      <p className="text-xs uppercase tracking-wider text-muted-foreground pt-2">
                        {slots.length > 0 ? 'Add more slots' : 'Propose time slots'}
                      </p>
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
                      <div className="flex flex-wrap items-center gap-4 pt-1">
                        {slots.length + slotInputs.filter(Boolean).length < 5 && (
                          <button
                            type="button"
                            className="text-sm text-primary hover:underline text-left shrink-0"
                            onClick={() => setSlotInputs([...slotInputs, ''])}
                          >
                            + Add another slot
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={actionBusy}
                          className="btn-primary shrink-0 ml-auto pl-6 pr-7"
                        >
                          Propose {slotInputs.filter(Boolean).length || ''} slot(s)
                        </button>
                      </div>
                    </form>
                  )}
              </section>
            )}

            {canCancel && (
              <div className="pt-4 border-t border-border/50">
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => setCancelModalOpen(true)}
                  className="inline-flex items-center gap-2 text-sm text-destructive hover:underline"
                >
                  <Trash2 size={16} /> Cancel meeting request
                </button>
              </div>
            )}
          </>
        ) : null}
      </div>

      <AnimatePresence>
        {cancelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !actionBusy && setCancelModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-50 w-full max-w-md overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-2xl"
            >
              <h3 className="mb-2 font-serif text-xl font-medium text-foreground">
                Cancel Meeting Request
              </h3>
              <p className="mb-6 text-sm text-muted-foreground">
                Are you sure you want to cancel this meeting request? This action cannot be undone.
              </p>

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  disabled={actionBusy}
                  className="rounded-full border border-border bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60"
                  onClick={() => setCancelModalOpen(false)}
                >
                  Keep Request
                </button>
                <button
                  type="button"
                  disabled={actionBusy}
                  className="rounded-full px-4 py-2 text-sm font-medium transition-colors bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60"
                  onClick={async () => {
                    await cancelMeeting();
                    setCancelModalOpen(false);
                  }}
                >
                  {actionBusy ? 'Cancelling…' : 'Cancel Request'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MeetingDetail;
