import React from 'react';
import { motion } from 'framer-motion';
import { Send, ShieldCheck, Clock, CalendarCheck, XCircle, CheckCircle2 } from 'lucide-react';

/*
 * MeetingTimeline
 * Toplantı sürecinin adım adım görsel takibi.
 *
 * Props:
 *  meeting — serializeMeeting() çıktısı (status, nda_accepted, time_slots, confirmed_slot, created_at, updated_at)
 *  side    — 'requester' | 'owner'  (hangi taraf görüntülüyor)
 */

const STEP_DEFS = [
  {
    id: 'requested',
    label: 'Toplantı İsteği Gönderildi',
    icon: <Send size={14} />,
    activeStatuses: ['pending', 'accepted', 'declined', 'scheduled', 'cancelled'],
  },
  {
    id: 'nda',
    label: 'NDA Kabul Edildi',
    icon: <ShieldCheck size={14} />,
    activeStatuses: ['pending', 'accepted', 'declined', 'scheduled', 'cancelled'],
    condition: (m) => m.nda_accepted,
    optional: true,
  },
  {
    id: 'accepted',
    label: 'İstek Kabul Edildi',
    icon: <CheckCircle2 size={14} />,
    activeStatuses: ['accepted', 'scheduled'],
    errorStatuses: ['declined'],
    errorLabel: 'İstek Reddedildi',
    errorIcon: <XCircle size={14} />,
  },
  {
    id: 'slots',
    label: 'Zaman Dilimi Önerildi',
    icon: <Clock size={14} />,
    activeStatuses: ['accepted', 'scheduled'],
    condition: (m) => (m.time_slots?.length ?? 0) > 0,
  },
  {
    id: 'scheduled',
    label: 'Toplantı Zamanlandı',
    icon: <CalendarCheck size={14} />,
    activeStatuses: ['scheduled'],
  },
];

function getStepState(step, meeting) {
  const s = meeting.status;

  // Error state
  if (step.errorStatuses?.includes(s) && step.id === 'accepted') return 'error';

  // Cancelled — everything after requested is grey
  if (s === 'cancelled' && step.id !== 'requested') return 'inactive';

  // Optional step (NDA) — only show if condition met
  if (step.optional && !step.condition?.(meeting)) return 'skip';

  // Condition-gated step
  if (step.condition && !step.condition(meeting)) return 'inactive';

  if (step.activeStatuses.includes(s)) return 'completed';

  return 'inactive';
}

function StepDot({ state }) {
  const colors = {
    completed: { bg: 'var(--accent-emerald)', border: 'var(--accent-emerald)', icon: '#fff' },
    error:     { bg: 'var(--status-danger)',  border: 'var(--status-danger)',  icon: '#fff' },
    active:    { bg: 'var(--accent-violet)',  border: 'var(--accent-violet)',  icon: '#fff' },
    inactive:  { bg: 'var(--bg-elev-2)',      border: 'var(--border-strong)',  icon: 'var(--fg-subtle)' },
    skip:      null,
  };
  const c = colors[state];
  if (!c) return null;
  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
      style={{
        width: '28px', height: '28px', borderRadius: '50%',
        background: c.bg, border: `2px solid ${c.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, color: c.icon,
        boxShadow: state === 'completed' || state === 'active' ? `0 0 0 4px color-mix(in srgb, ${c.bg} 18%, transparent)` : 'none',
      }}
    />
  );
}

export default function MeetingTimeline({ meeting, className = '' }) {
  if (!meeting) return null;

  const visibleSteps = STEP_DEFS.filter(step => {
    const state = getStepState(step, meeting);
    return state !== 'skip';
  });

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {visibleSteps.map((step, idx) => {
        const state = getStepState(step, meeting);
        const isLast = idx === visibleSteps.length - 1;
        const isError = state === 'error';
        const label = isError ? (step.errorLabel ?? step.label) : step.label;
        const icon = isError ? (step.errorIcon ?? step.icon) : step.icon;
        const isCompleted = state === 'completed' || state === 'error';

        // Timestamp hint
        let hint = null;
        if (step.id === 'requested' && meeting.created_at) {
          hint = new Date(meeting.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
        }
        if (step.id === 'scheduled' && meeting.confirmed_slot) {
          hint = new Date(meeting.confirmed_slot).toLocaleString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        }

        return (
          <div key={step.id} style={{ display: 'flex', gap: '14px' }}>
            {/* Left: dot + connector */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '28px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: isError ? 'var(--status-danger)' : isCompleted ? 'var(--accent-emerald)' : 'var(--fg-subtle)' }}>
                <StepDot state={state} />
              </div>
              {!isLast && (
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  style={{
                    flex: 1, width: '2px', minHeight: '28px',
                    background: isCompleted ? 'var(--accent-emerald)' : 'var(--border)',
                    transformOrigin: 'top',
                    margin: '4px 0',
                  }}
                />
              )}
            </div>

            {/* Right: label + hint */}
            <div style={{ paddingBottom: isLast ? 0 : '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '28px' }}>
              <motion.p
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.07 }}
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  fontWeight: isCompleted ? 600 : 400,
                  color: state === 'inactive' ? 'var(--fg-subtle)' : isError ? 'var(--status-danger)' : 'var(--fg)',
                }}
              >
                {label}
              </motion.p>
              {hint && (
                <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--fg-subtle)' }}>
                  {hint}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
