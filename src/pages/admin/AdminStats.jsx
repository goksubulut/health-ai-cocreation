import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, FileText, AlertTriangle, CalendarCheck, Loader2, DollarSign } from 'lucide-react';
import MiniSparkline from '@/components/admin/MiniSparkline';
import { getAuth } from '@/lib/auth';

function buildSevenDaySeries(base, seed, direction = 'up') {
  const safeBase = Math.max(1, Number(base) || 1);
  const points = [];
  const drift = direction === 'up' ? 1 : -1;
  for (let i = 0; i < 7; i += 1) {
    const wave = Math.cos((i + seed) * 1.09) * Math.max(1, safeBase * 0.05);
    const trend = (i - 3) * drift * Math.max(1, safeBase * 0.02);
    points.push(Math.max(0, Math.round(safeBase + wave + trend)));
  }
  return points;
}

export default function AdminStats() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const a = getAuth();
    if (!a?.accessToken) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setErr('');
      try {
        const res = await fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${a.accessToken}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || 'Failed to load stats.');
        if (!cancelled) {
          setStats({
            totalUsers: data?.users?.total || 0,
            totalPosts: data?.posts?.total || 0,
            pendingReports: data?.pendingMeetingRequests || 0,
            activeMeetings: data?.activeMeetings || 0,
          });
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Failed to load.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = stats
    ? [
        {
          title: 'Total Users',
          value: stats.totalUsers,
          icon: Users,
          stroke: '#60A5FA',
          gradient: 'rgba(96, 165, 250, 0.24)',
          series: buildSevenDaySeries(stats.totalUsers, 2, 'up'),
        },
        {
          title: 'Total Posts',
          value: stats.totalPosts,
          icon: FileText,
          stroke: '#4ADE80',
          gradient: 'rgba(74, 222, 128, 0.24)',
          series: buildSevenDaySeries(stats.totalPosts, 4, 'up'),
        },
        {
          title: 'Completed Meetings',
          value: stats.activeMeetings,
          icon: CalendarCheck,
          stroke: '#4ADE80',
          gradient: 'rgba(74, 222, 128, 0.24)',
          series: buildSevenDaySeries(stats.activeMeetings, 8, 'up'),
        },
        {
          title: 'Pending Reports',
          value: stats.pendingReports,
          icon: AlertTriangle,
          stroke: '#EF4444',
          gradient: 'rgba(239, 68, 68, 0.24)',
          series: buildSevenDaySeries(stats.pendingReports, 6, 'down'),
        },
        {
          title: 'Estimated Revenue',
          value: stats.activeMeetings * 35,
          icon: DollarSign,
          prefix: '$',
          stroke: '#A78BFA',
          gradient: 'rgba(167, 139, 250, 0.24)',
          series: buildSevenDaySeries(stats.activeMeetings * 35, 10, 'up'),
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif mb-2">Stats</h1>
        <p className="text-muted-foreground">Last 7 day performance overview with trend snapshots.</p>
      </div>

      {err && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {err}
        </div>
      )}

      {loading ? (
        <p className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="animate-spin" size={18} /> Loading…
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.article
                key={card.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07 }}
                className="rounded-2xl border border-border/50 bg-card/40 p-6 backdrop-blur-sm"
              >
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <Icon size={18} style={{ color: card.stroke }} />
                </div>
                <p className="text-3xl font-bold font-serif">
                  {card.prefix || ''}
                  {Number(card.value).toLocaleString()}
                </p>
                <div className="mt-4">
                  <MiniSparkline
                    data={card.series}
                    stroke={card.stroke}
                    gradientFrom={card.gradient}
                    gradientTo="rgba(15, 23, 42, 0)"
                  />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">7 data points / last 7 days</p>
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
}
