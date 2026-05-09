import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useLocale } from '@/contexts/locale-context';

/*
 * ProfileCompletion
 *
 * Props:
 *  user         — user object (firstName, lastName, institution, city, country, expertise, role)
 *  onFieldClick — (fieldName: string) => void  (navigates/scrolls to that field)
 */

const FIELD_WEIGHTS = [
  { key: 'firstName', weight: 10 },
  { key: 'lastName', weight: 10 },
  { key: 'institution', weight: 20 },
  { key: 'city', weight: 20 },
  { key: 'country', weight: 10 },
  { key: 'expertise', weight: 30 },
];

const FIELD_LABEL_KEYS = {
  firstName: 'profileCompletionFieldFirstName',
  lastName: 'profileCompletionFieldLastName',
  institution: 'profileCompletionFieldInstitution',
  city: 'profileCompletionFieldCity',
  country: 'profileCompletionFieldCountry',
  expertise: 'profileCompletionFieldExpertise',
};

const SIZE = 80;
const STROKE = 6;
const R = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

export function calculateProfileCompletion(user) {
  if (!user) return { score: 0, missing: FIELD_WEIGHTS };
  let score = 0;
  const missing = [];
  FIELD_WEIGHTS.forEach((f) => {
    const val = user[f.key] ?? user[f.key.replace(/([A-Z])/g, '_$1').toLowerCase()];
    if (val && String(val).trim()) {
      score += f.weight;
    } else {
      missing.push(f);
    }
  });
  return { score, missing };
}

export default function ProfileCompletion({ user, onFieldClick }) {
  const { t } = useLocale();
  const { score, missing } = calculateProfileCompletion(user);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const rafRef = useRef(null);

  const labelForKey = (key) => {
    const lk = FIELD_LABEL_KEYS[key];
    const fallbacks = {
      profileCompletionFieldFirstName: 'First name',
      profileCompletionFieldLastName: 'Last name',
      profileCompletionFieldInstitution: 'Institution',
      profileCompletionFieldCity: 'City',
      profileCompletionFieldCountry: 'Country',
      profileCompletionFieldExpertise: 'Expertise area',
    };
    return lk ? t(lk, fallbacks[lk] ?? key) : key;
  };

  useEffect(() => {
    const start = performance.now();
    const duration = 800;
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setAnimatedScore(Math.round(score * eased));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [score]);

  const strokeDashoffset = CIRCUMFERENCE * (1 - animatedScore / 100);
  const color = score === 100 ? 'var(--accent-emerald)' : score >= 70 ? '#84cc16' : score >= 40 ? 'var(--status-warning)' : 'var(--status-danger)';
  const levelLabel =
    score === 100
      ? t('profileCompletionLevelFull', 'Complete')
      : score >= 70
        ? t('profileCompletionLevelGood', 'Good')
        : score >= 40
          ? t('profileCompletionLevelFair', 'Fair')
          : t('profileCompletionLevelLow', 'Incomplete');

  const missingSummary = t(
    'profileCompletionMissingSummary',
    '{count} fields missing — improve your match quality',
  ).replace('{count}', String(missing.length));

  if (score === 100) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--accent-emerald)' }}>
        <CheckCircle2 size={16} />
        {t('profileCompletionComplete', 'Profile 100% complete')}
      </div>
    );
  }

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      background: 'var(--bg-elev-1)',
      padding: '16px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Ring */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke="var(--bg-elev-2)" strokeWidth={STROKE} />
            <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke={color} strokeWidth={STROKE}
              strokeLinecap="round" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.05s linear' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 700, color, lineHeight: 1 }}>
              {animatedScore}%
            </span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '9px', color: 'var(--fg-subtle)', lineHeight: 1 }}>{levelLabel}</span>
          </div>
        </div>

        {/* Text */}
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 600, color: 'var(--fg)' }}>
            {t('profileCompletionTitle', 'Profile completion')}
          </p>
          <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--fg-muted)' }}>
            {missing.length > 0 ? missingSummary : t('profileCompletionAllFilled', 'All fields filled')}
          </p>
        </div>

        {/* Toggle */}
        {missing.length > 0 && (
          <button
            onClick={() => setExpanded(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-subtle)', padding: '4px' }}
            aria-label={t('profileCompletionToggleAria', 'Show or hide missing fields')}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>

      {/* Missing fields list */}
      <AnimatePresence>
        {expanded && missing.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ borderTop: '1px solid var(--border)', marginTop: '14px', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {missing.map(f => (
                <motion.button
                  key={f.key}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => onFieldClick?.(f.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', padding: '8px 12px',
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <AlertCircle size={13} style={{ color: color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--fg)' }}>
                    {labelForKey(f.key)}
                  </span>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--fg-subtle)' }}>
                    +{f.weight}%
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
