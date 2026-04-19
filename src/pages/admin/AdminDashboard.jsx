import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, FileText, AlertTriangle, CalendarCheck, Clock, Activity, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getAuth } from '@/lib/auth';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const a = getAuth();
    if (!a?.accessToken) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        const res = await fetch('/api/admin/dashboard', {
          headers: { Authorization: `Bearer ${a.accessToken}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || 'Failed to load dashboard.');
        if (!cancelled) {
          setStats(data.stats);
          setRecentActivity(Array.isArray(data.recentActivity) ? data.recentActivity : []);
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Failed to load.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const statCards = stats
    ? [
        { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500' },
        { title: 'Total Posts', value: stats.totalPosts, icon: FileText, color: 'text-emerald-500' },
        {
          title: 'Pending Reports',
          value: stats.pendingReports,
          icon: AlertTriangle,
          color: 'text-amber-500',
          hint: 'Pending meeting requests',
        },
        {
          title: 'Active Meetings',
          value: stats.activeMeetings,
          icon: CalendarCheck,
          color: 'text-purple-500',
          hint: 'Accepted or scheduled',
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and recent system activity.</p>
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
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-card/40 border border-border/50 rounded-2xl p-6 backdrop-blur-sm"
                  title={stat.hint}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-muted-foreground">{stat.title}</span>
                    <Icon size={20} className={stat.color} />
                  </div>
                  <h3 className="text-3xl font-bold font-serif">{Number(stat.value).toLocaleString()}</h3>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card/40 border border-border/50 rounded-2xl backdrop-blur-sm overflow-hidden"
          >
            <div className="p-6 border-b border-border/50 flex items-center gap-3">
              <Activity size={20} className="text-primary" />
              <h2 className="text-xl font-serif">Recent Activity</h2>
            </div>
            <div className="divide-y divide-border/50">
              {recentActivity.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">No activity logged yet.</div>
              ) : (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex flex-col gap-1">
                      <p className="text-sm text-muted-foreground">{activity.summary}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                      <Clock size={14} />
                      <span>{activity.timeLabel}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 bg-accent/30 text-center border-t border-border/50">
              <Link
                to="/admin/logs"
                className="text-sm text-primary hover:underline font-medium inline-block"
              >
                View all activity
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
