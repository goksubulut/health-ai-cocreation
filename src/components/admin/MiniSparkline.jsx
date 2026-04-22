import React, { useMemo } from 'react';

function toPoints(data, width, height, padding) {
  if (!Array.isArray(data) || data.length === 0) return [];

  const safe = data.map((n) => (Number.isFinite(Number(n)) ? Number(n) : 0));
  const min = Math.min(...safe);
  const max = Math.max(...safe);
  const range = max - min || 1;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  return safe.map((value, index) => {
    const x = padding + (index / Math.max(1, safe.length - 1)) * innerW;
    const y = padding + ((max - value) / range) * innerH;
    return { x, y };
  });
}

export default function MiniSparkline({
  data,
  stroke = '#4ADE80',
  gradientFrom = 'rgba(74, 222, 128, 0.28)',
  gradientTo = 'rgba(74, 222, 128, 0.02)',
  width = 240,
  height = 72,
}) {
  const id = useMemo(
    () => `spark-${Math.random().toString(36).slice(2, 10)}`,
    []
  );
  const points = useMemo(() => toPoints(data, width, height, 5), [data, width, height]);

  if (points.length === 0) {
    return <div className="h-[72px] w-full rounded-lg bg-muted/40" />;
  }

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${(height - 4).toFixed(
    2
  )} L ${points[0].x.toFixed(2)} ${(height - 4).toFixed(2)} Z`;
  const last = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-[72px] w-full" role="img" aria-label="7 day trend chart">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={gradientFrom} />
          <stop offset="100%" stopColor={gradientTo} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${id})`} />
      <path d={linePath} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <circle cx={last.x} cy={last.y} r="2.75" fill={stroke} />
    </svg>
  );
}
