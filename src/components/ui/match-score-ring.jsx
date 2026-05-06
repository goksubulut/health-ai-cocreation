import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Sparkles, Target, Zap } from 'lucide-react';

const SIZE = 64;
const STROKE = 5;
const R = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

function scoreToColor(score) {
  // 0–40 red, 41–69 amber, 70–89 lime, 90–100 emerald
  if (score >= 90) return 'var(--accent-emerald)';
  if (score >= 70) return '#84cc16';
  if (score >= 41) return 'var(--status-warning)';
  return 'var(--status-danger)';
}

function scoreToLabel(score) {
  if (score >= 90) return 'Mükemmel';
  if (score >= 70) return 'İyi';
  if (score >= 41) return 'Orta';
  return 'Düşük';
}

const SIGNAL_META = {
  expertiseMatched: { label: 'Uzmanlık',  Icon: Target  },
  cityMatched:      { label: 'Şehir',     Icon: MapPin  },
  isPrototype:      { label: 'Prototip',  Icon: Zap     },
  isFresh:          { label: 'Yeni ilan', Icon: Sparkles },
};

/**
 * @param {{ score: number, signals?: Record<string, boolean>, size?: number }} props
 */
export default function MatchScoreRing({ score = 0, signals = {}, size = SIZE }) {
  const [animated, setAnimated] = useState(0);
  const [hovered, setHovered] = useState(false);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = performance.now();
    const duration = 900;
    const from = 0;
    const to = Math.min(100, Math.max(0, score));

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimated(Math.round(from + (to - from) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [score]);

  const strokeDashoffset = CIRCUMFERENCE * (1 - animated / 100);
  const color = scoreToColor(animated);
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const scale = size / SIZE;

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* SVG Ring */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ transform: 'rotate(-90deg)', cursor: 'default' }}
        aria-label={`Eşleşme skoru ${score}%`}
      >
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={R}
          fill="none"
          stroke="var(--bg-elev-2)"
          strokeWidth={STROKE}
        />
        {/* Progress */}
        <circle
          cx={cx} cy={cy} r={R}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.05s linear, stroke 0.3s' }}
        />
      </svg>

      {/* Center text */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-sans)',
      }}>
        <span style={{ fontSize: `${11 * scale}px`, fontWeight: 700, color, lineHeight: 1 }}>
          {animated}%
        </span>
        <span style={{ fontSize: `${8 * scale}px`, color: 'var(--fg-subtle)', lineHeight: 1, marginTop: '1px' }}>
          {scoreToLabel(animated)}
        </span>
      </div>

      {/* Hover tooltip — signals breakdown */}
      {hovered && Object.keys(signals).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'absolute',
            bottom: `calc(100% + 10px)`,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--bg-elev-1)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            padding: '10px 12px',
            minWidth: '160px',
            zIndex: 50,
            pointerEvents: 'none',
          }}
        >
          <p style={{ margin: '0 0 8px', fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fg-subtle)' }}>
            Eşleşme Sinyalleri
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Object.entries(SIGNAL_META).map(([key, { label, Icon }]) => {
              const active = Boolean(signals[key]);
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <Icon size={12} style={{ color: active ? color : 'var(--fg-subtle)', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: active ? 'var(--fg)' : 'var(--fg-subtle)', textDecoration: active ? 'none' : 'line-through' }}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Arrow */}
          <div style={{
            position: 'absolute', bottom: '-5px', left: '50%', transform: 'translateX(-50%) rotate(45deg)',
            width: '10px', height: '10px', background: 'var(--bg-elev-1)', border: '1px solid var(--border)',
            borderTop: 'none', borderLeft: 'none',
          }} />
        </motion.div>
      )}
    </div>
  );
}
