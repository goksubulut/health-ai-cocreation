"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Plus, ArrowUpRight } from 'lucide-react';

const drawVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 2.5, ease: [0.43, 0.13, 0.23, 0.96] },
      opacity: { duration: 0.5 },
    },
  },
};

function HandWrittenTitle({
  title = "Hand Written",
  subtitle = "Optional subtitle",
}) {
  return (
    <div className="relative w-full max-w-4xl mx-auto py-24">
      <div className="absolute inset-0">
        <motion.svg
          width="100%"
          height="100%"
          viewBox="0 0 1200 600"
          initial="hidden"
          animate="visible"
          className="w-full h-full"
        >
          <title>HandWrittenTitle</title>
          <motion.path
            d="M 950 90
               C 1250 300, 1050 480, 600 520
               C 250 520, 150 480, 150 300
               C 150 120, 350 80, 600 80
               C 850 80, 950 180, 950 180"
            fill="none"
            strokeWidth="12"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={drawVariants}
            className="text-black dark:text-white opacity-90"
          />
        </motion.svg>
      </div>
      <div className="relative text-center z-10 flex flex-col items-center justify-center">
        <motion.h1
          className="text-4xl md:text-6xl text-black dark:text-white tracking-tighter flex items-center gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            className="text-xl text-black/80 dark:text-white/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            {subtitle}
          </motion.p>
        )}
      </div>
    </div>
  );
}

const ctaDrawVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 1.8, ease: [0.43, 0.13, 0.23, 0.96] },
      opacity: { duration: 0.25 },
    },
  },
};

/**
 * An animated CTA where a hand-drawn SVG loop draws itself around the label.
 * Designed for use on dark/black backgrounds (white stroke).
 * variant="plus"  → shows a + icon (default, for Create Post)
 * variant="arrow" → shows an ↗ icon (for navigation CTAs like Open Requests)
 */
function CreatePostCTA({ to, label = "Create Post", variant = "plus" }) {
  const Icon = variant === "arrow" ? ArrowUpRight : Plus;

  return (
    <Link to={to} className="relative inline-flex items-center justify-center group shrink-0">
      {/* Hand-drawn oval SVG */}
      <div className="absolute inset-x-0 inset-y-0 pointer-events-none">
        <motion.svg
          width="100%"
          height="100%"
          viewBox="0 0 230 64"
          initial="hidden"
          animate="visible"
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          {/* Organic loop path that spirals around the text area */}
          <motion.path
            d="M 200 20
               C 218 6, 178 1, 115 2
               C 52 3, 12 12, 12 32
               C 12 52, 52 61, 115 60
               C 178 59, 220 50, 218 34
               C 216 20, 196 14, 183 20"
            fill="none"
            strokeWidth="2.2"
            stroke="white"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={ctaDrawVariants}
            style={{ opacity: 0.65 }}
          />
        </motion.svg>
      </div>

      {/* Label */}
      <motion.span
        className="relative z-10 flex items-center gap-2 text-white font-semibold text-[15px] px-9 py-4 transition-opacity duration-200 group-hover:opacity-75"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.85, duration: 0.55 }}
      >
        <Icon size={15} strokeWidth={2.5} />
        {label}
      </motion.span>
    </Link>
  );
}

export { HandWrittenTitle, CreatePostCTA };
