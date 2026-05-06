import React from 'react';

/* ─── Base shimmer ──────────────────────────────────────────── */
function Shimmer({ style = {}, className = '' }) {
  return (
    <div
      className={className}
      style={{
        borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-elev-2)',
        overflow: 'hidden',
        position: 'relative',
        ...style,
      }}
    >
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--fg) 5%, transparent) 50%, transparent 100%)',
        animation: 'shimmer 1.6s infinite',
        transform: 'translateX(-100%)',
      }} />
      <style>{`
        @keyframes shimmer { to { transform: translateX(200%); } }
      `}</style>
    </div>
  );
}

/* ─── Post Card Skeleton ────────────────────────────────────── */
export function PostCardSkeleton() {
  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      background: 'var(--bg-elev-1)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
    }}>
      {/* Image placeholder */}
      <Shimmer style={{ height: '140px', borderRadius: 'var(--radius-md)' }} />
      {/* Tag row */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <Shimmer style={{ height: '22px', width: '70px', borderRadius: '999px' }} />
        <Shimmer style={{ height: '22px', width: '55px', borderRadius: '999px' }} />
      </div>
      {/* Title */}
      <Shimmer style={{ height: '20px', width: '85%' }} />
      <Shimmer style={{ height: '16px', width: '60%' }} />
      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
        <Shimmer style={{ height: '14px', width: '90px' }} />
        <Shimmer style={{ height: '32px', width: '100px', borderRadius: '999px' }} />
      </div>
    </div>
  );
}

/* ─── Board Grid Skeleton (N cards) ────────────────────────── */
export function BoardGridSkeleton({ count = 6 }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '20px',
    }}>
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ─── Meeting Row Skeleton ──────────────────────────────────── */
export function MeetingRowSkeleton() {
  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      background: 'var(--bg-elev-1)',
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    }}>
      <Shimmer style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Shimmer style={{ height: '16px', width: '55%' }} />
        <Shimmer style={{ height: '13px', width: '35%' }} />
      </div>
      <Shimmer style={{ height: '26px', width: '80px', borderRadius: '999px', flexShrink: 0 }} />
    </div>
  );
}

/* ─── Dashboard Stats Skeleton ──────────────────────────────── */
export function DashboardStatsSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-elev-1)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <Shimmer style={{ height: '28px', width: '28px', borderRadius: 'var(--radius-sm)' }} />
          <Shimmer style={{ height: '32px', width: '60%' }} />
          <Shimmer style={{ height: '13px', width: '80%' }} />
        </div>
      ))}
    </div>
  );
}

/* ─── Profile Skeleton ──────────────────────────────────────── */
export function ProfileSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <Shimmer style={{ width: '72px', height: '72px', borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Shimmer style={{ height: '22px', width: '45%' }} />
          <Shimmer style={{ height: '15px', width: '60%' }} />
        </div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Shimmer style={{ height: '12px', width: '25%' }} />
          <Shimmer style={{ height: '42px', width: '100%', borderRadius: 'var(--radius-md)' }} />
        </div>
      ))}
    </div>
  );
}
