import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, ShieldCheck, Sparkles, Target, Users, Workflow } from 'lucide-react';
import { Link } from 'react-router-dom';

const steps = [
  {
    icon: BrainCircuit,
    title: 'Profile intelligence',
    description:
      'Your role, expertise keywords, and posting behavior are parsed into a structured collaboration profile.',
  },
  {
    icon: Target,
    title: 'Semantic fit scoring',
    description:
      'Project goals and role requirements are compared against your profile using weighted relevance signals.',
  },
  {
    icon: ShieldCheck,
    title: 'Trust and readiness',
    description:
      'Confidentiality level, timeline realism, and collaboration readiness increase or decrease final match confidence.',
  },
  {
    icon: Workflow,
    title: 'Continuous learning',
    description:
      'When you save, open, or request meetings, the model calibrates future ranking quality for your feed.',
  },
];

const principles = [
  { label: 'Explainable matching', value: 'Transparent factors, not black-box randomness.' },
  { label: 'Context-aware', value: 'Different stages need different collaborator archetypes.' },
  { label: 'Human-first ranking', value: 'Scores guide discovery; your final decision leads.' },
];

function HowMatchingWorks() {
  return (
    <section className="page relative pb-16">
      <div className="relative overflow-hidden rounded-[28px] border border-white/15 bg-black/50 p-8 shadow-[0_20px_80px_rgba(20,12,40,0.35)] backdrop-blur-xl md:p-12">
        <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-violet-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-20 h-64 w-64 rounded-full bg-emerald-300/10 blur-3xl" />
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="hero-eyebrow"
        >
          Matching tutorial
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="mt-3 font-serif text-4xl leading-tight text-white md:text-5xl"
        >
          How the platform decides
          <br />
          <em className="text-[#cab8ff]">what is right for you</em>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.14 }}
          className="mt-5 max-w-3xl text-sm text-white/80 md:text-base"
        >
          Match score is a confidence signal that combines expertise alignment, project stage needs, collaboration intent,
          and quality-of-fit patterns from your interactions. It is optimized for discoverability and practical outcomes.
        </motion.p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <motion.article
              key={step.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.35, delay: idx * 0.06 }}
              className="group rounded-2xl border border-border/60 bg-card/75 p-6 shadow-sm backdrop-blur-md transition-all hover:-translate-y-1 hover:border-white/35 hover:shadow-xl"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white">
                <Icon size={18} />
              </div>
              <h3 className="font-serif text-2xl text-foreground">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
            </motion.article>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.4 }}
        className="mt-10 grid gap-4 rounded-2xl border border-border/70 bg-card/80 p-6 backdrop-blur-md md:grid-cols-3"
      >
        {principles.map((item) => (
          <div key={item.label}>
            <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <Sparkles size={12} /> {item.label}
            </div>
            <p className="text-sm text-foreground/90">{item.value}</p>
          </div>
        ))}
      </motion.div>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Link to="/board" className="btn btn-primary">
          <Users size={16} /> Go to Discover
        </Link>
        <Link to="/post/new" className="btn btn-ghost">
          Post a project
        </Link>
      </div>
    </section>
  );
}

export default HowMatchingWorks;
