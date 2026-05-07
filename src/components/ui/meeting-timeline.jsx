import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Send, ShieldCheck, Clock, CalendarCheck, XCircle, CheckCircle2 } from 'lucide-react';
import { useLocale } from '@/contexts/locale-context';

/*
 * MeetingTimeline
 * Toplantı sürecinin adım adım görsel takibi.
 *
 * Props:
 *  meeting — serializeMeeting() çıktısı (status, nda_accepted, time_slots, confirmed_slot, created_at, updated_at)
 *  side    — 'requester' | 'owner'  (hangi taraf görüntülüyor)
 */

function dateLocaleTag(loc) {
  if (loc === 'tr') return 'tr-TR';
  if (loc === 'pt') return 'pt-BR';
  if (loc === 'es') return 'es-ES';
  return 'en-US';
}

function buildStepDefs(t) {
  return [
    {
      id: 'requested',
      label: t('meetingStepRequested', 'Meeting request sent'),
      icon: <Send size={14} />,
      activeStatuses: ['pending', 'accepted', 'declined', 'scheduled', 'cancelled'],
    },
    {
      id: 'nda',
      label: t('meetingStepNda', 'NDA accepted'),
      icon: <ShieldCheck size={14} />,
      activeStatuses: ['pending', 'accepted', 'declined', 'scheduled', 'cancelled'],
      condition: (m) => m.nda_accepted,
      optional: true,
    },
    {
      id: 'accepted',
      label: t('meetingStepAccepted', 'Request accepted'),
      icon: <CheckCircle2 size={14} />,
      activeStatuses: ['accepted', 'scheduled'],
      errorStatuses: ['declined'],
      errorLabel: t('meetingStepRequestDeclined', 'Request declined'),
      errorIcon: <XCircle size={14} />,
    },
    {
      id: 'slots',
      label: t('meetingStepSlots', 'Time slots suggested'),
      icon: <Clock size={14} />,
      activeStatuses: ['accepted', 'scheduled'],
      condition: (m) => (m.time_slots?.length ?? 0) > 0,
    },
    {
      id: 'scheduled',
      label: t('meetingStepScheduled', 'Meeting scheduled'),
      icon: <CalendarCheck size={14} />,
      activeStatuses: ['scheduled'],
    },
  ];
}

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

export default function MeetingTimeline({ meeting, className = '' }) {
  const { locale, t } = useLocale();
  const STEP_DEFS = useMemo(() => buildStepDefs(t), [locale, t]);

  if (!meeting) return null;

  const intlLocale = dateLocaleTag(locale);

  const visibleSteps = STEP_DEFS.filter(step => {
    const state = getStepState(step, meeting);
    return state !== 'skip';
  });

  const completedCount = visibleSteps.filter((step) => {
    const state = getStepState(step, meeting);
    return state === 'completed' || state === 'error';
  }).length;
  const progressPercent = visibleSteps.length ? Math.round((completedCount / visibleSteps.length) * 100) : 0;

  return (
    <div className={className}>
      <div className="mb-5 rounded-xl border border-border/60 bg-background/70 p-3">
        <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          <span>Flow completion</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.45 }}
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, var(--accent-violet), var(--accent-emerald))',
            }}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {visibleSteps.map((step, idx) => {
          const state = getStepState(step, meeting);
          const isError = state === 'error';
          const label = isError ? (step.errorLabel ?? step.label) : step.label;
          const icon = isError ? (step.errorIcon ?? step.icon) : step.icon;
          const isDone = state === 'completed' || state === 'error';

          let hint = null;
          if (step.id === 'requested' && meeting.created_at) {
            hint = new Date(meeting.created_at).toLocaleDateString(intlLocale, {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });
          }
          if (step.id === 'scheduled' && meeting.confirmed_slot) {
            hint = new Date(meeting.confirmed_slot).toLocaleString(intlLocale, {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
          }

          const stateStyles = isError
            ? 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-300'
            : isDone
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'border-border/60 bg-background/70 text-muted-foreground';

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`rounded-xl border p-3 ${stateStyles}`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full border ${
                    isError
                      ? 'border-red-500/40 bg-red-500/20'
                      : isDone
                        ? 'border-emerald-500/40 bg-emerald-500/20'
                        : 'border-border/60 bg-muted/70'
                  }`}
                >
                  {icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight">{label}</p>
                  {hint && (
                    <p className="mt-1 text-xs opacity-80">{hint}</p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
