import React from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Bell,
  FileText,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
  Stethoscope,
  Cpu,
  ArrowUpRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { DemoDropdown } from '../components/demo';
import { getAuth } from '@/lib/auth';

function Dashboard() {
  const auth = getAuth();
  const role = auth?.user?.role;
  const isHealthcare = role === 'healthcare';
  const displayName = auth?.user?.firstName || 'User';

  return (
    <div className="min-h-[100dvh] pt-28 pb-16 px-6 lg:px-16 bg-background">
      <div className="max-w-[1400px] mx-auto space-y-8">
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-border/50 bg-gradient-to-br from-primary/10 via-background to-background p-6 lg:p-8 shadow-sm"
        >
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3 flex items-center gap-2">
                <Sparkles size={14} />
                Workspace Overview
              </p>
              <h1 className="font-serif text-4xl lg:text-5xl leading-tight">
                Welcome back, {displayName}
              </h1>
              <p className="mt-3 text-muted-foreground text-base lg:text-lg flex items-center gap-2">
                {isHealthcare ? <Stethoscope size={16} /> : <Cpu size={16} />}
                {isHealthcare ? 'Healthcare Dashboard' : 'Engineer Dashboard'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <DemoDropdown />
              <button className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-card text-foreground hover:bg-accent transition-colors">
                <Bell size={18} />
              </button>
              {isHealthcare && (
                <Link to="/post/new" className="btn-primary">
                  <Plus size={16} /> Create Post
                </Link>
              )}
            </div>
          </div>
        </motion.header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: isHealthcare ? 'Active Posts' : 'Active Collaborations', value: '3', icon: FileText },
            { title: 'Pending Meetings', value: '2', icon: Clock },
            { title: 'New Matches', value: '7', icon: Users },
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * idx }}
              className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{item.title}</p>
                <item.icon size={16} className="text-primary" />
              </div>
              <p className="mt-2 text-3xl font-semibold">{item.value}</p>
            </motion.div>
          ))}
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="xl:col-span-2 rounded-3xl border border-border/60 bg-card/50 backdrop-blur-md p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-3xl">
                {isHealthcare ? 'Your Active Posts' : 'Your Active Collaborations'}
              </h2>
              <Link to="/profile?tab=posts" className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1">
                View History <ArrowUpRight size={14} />
              </Link>
            </div>

            <article className="rounded-2xl border border-border/60 bg-background/70 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Active
                </span>
                <span className="text-sm text-muted-foreground">Expiring in 12 days</span>
              </div>

              <h3 className="text-xl font-semibold">AI-driven Cardiology Imaging Enhancer</h3>
              <p className="text-muted-foreground">
                Looking for a Machine Learning Engineer to help develop an algorithm that increases the
                resolution of legacy MRI scans.
              </p>

              <div className="flex flex-wrap gap-3 pt-1">
                <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-1.5 text-sm">
                  <FileText size={14} /> 3 Interests
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-1.5 text-sm">
                  <CheckCircle2 size={14} /> Pre-deployment
                </span>
              </div>
            </article>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-3xl border border-border/60 bg-card/50 backdrop-blur-md p-6"
          >
            <h2 className="font-serif text-2xl mb-5">Recent Notifications</h2>
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <p className="text-sm leading-relaxed">
                  <strong>Alex Chen</strong> expressed interest in your Cardiology Imaging post.
                </p>
                <span className="mt-2 inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock size={12} /> 2 hours ago
                </span>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <p className="text-sm leading-relaxed">
                  Meeting scheduled with <strong>Elena Rodriguez</strong> for tomorrow at 10 AM.
                </p>
                <span className="mt-2 inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock size={12} /> 1 day ago
                </span>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
