'use client';

import { Metrics } from '@/lib/api';
import { motion } from 'framer-motion';
import { AnimatedCounter } from './ui/AnimatedCounter';
import { Flame, Target, Zap, TrendingDown } from 'lucide-react';

/**
 * MetricPills Component
 * 
 * Award-Winning Design:
 * - Animated counters with spring physics
 * - Staggered entrance animations
 * - Icon indicators with semantic meaning
 * - Hover interactions with depth
 */

interface MetricPillsProps {
  metrics: Metrics;
}

export function MetricPills({ metrics }: MetricPillsProps) {
  // Drift level determines visual state
  const getDriftState = (score: number) => {
    if (score < 0.3) return {
      bg: 'bg-gradient-to-br from-emerald-500/15 to-emerald-500/5',
      text: 'text-emerald-600',
      border: 'border-emerald-500/30',
      glow: 'shadow-emerald-500/20',
      icon: 'text-emerald-500',
      label: 'On Track'
    };
    if (score < 0.5) return {
      bg: 'bg-gradient-to-br from-amber-500/15 to-amber-500/5',
      text: 'text-amber-600',
      border: 'border-amber-500/30',
      glow: 'shadow-amber-500/20',
      icon: 'text-amber-500',
      label: 'Drifting'
    };
    return {
      bg: 'bg-gradient-to-br from-rose-500/15 to-rose-500/5',
      text: 'text-rose-600',
      border: 'border-rose-500/30',
      glow: 'shadow-rose-500/20',
      icon: 'text-rose-500',
      label: 'Off Course'
    };
  };

  const driftStyle = getDriftState(metrics.drift_score);

  const pillVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.1,
        type: 'spring',
        stiffness: 300,
        damping: 24
      }
    })
  };

  const iconPulse = {
    animate: {
      scale: [1, 1.15, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* Completion Rate */}
      <motion.div
        custom={0}
        variants={pillVariants}
        initial="hidden"
        animate="visible"
        whileHover={{ scale: 1.03, y: -2 }}
        className="glass-subtle rounded-2xl p-4 cursor-default group"
      >
        <div className="flex items-center gap-2 mb-2">
          <motion.div {...iconPulse}>
            <Target className="w-4 h-4 text-teal-500" />
          </motion.div>
          <p className="text-[10px] text-teal-600 font-medium uppercase tracking-wider">Done</p>
        </div>
        <div className="flex items-baseline gap-1">
          <AnimatedCounter 
            value={Math.round(metrics.completion_rate * 100)} 
            className="text-2xl font-bold text-neutral-800"
          />
          <span className="text-sm text-neutral-400 group-hover:text-teal-500 transition-colors">%</span>
        </div>
      </motion.div>
      
      {/* Streak */}
      <motion.div
        custom={1}
        variants={pillVariants}
        initial="hidden"
        animate="visible"
        whileHover={{ scale: 1.03, y: -2 }}
        className="glass-subtle rounded-2xl p-4 cursor-default group"
      >
        <div className="flex items-center gap-2 mb-2">
          <motion.div {...iconPulse}>
            <Flame className="w-4 h-4 text-orange-500" />
          </motion.div>
          <p className="text-[10px] text-teal-600 font-medium uppercase tracking-wider">Streak</p>
        </div>
        <div className="flex items-baseline gap-1">
          <AnimatedCounter 
            value={metrics.streak} 
            className="text-2xl font-bold text-neutral-800"
          />
          <span className="text-sm text-neutral-400 group-hover:text-orange-500 transition-colors">days</span>
        </div>
      </motion.div>
      
      {/* Friction */}
      <motion.div
        custom={2}
        variants={pillVariants}
        initial="hidden"
        animate="visible"
        whileHover={{ scale: 1.03, y: -2 }}
        className="glass-subtle rounded-2xl p-4 cursor-default group"
      >
        <div className="flex items-center gap-2 mb-2">
          <motion.div {...iconPulse}>
            <Zap className="w-4 h-4 text-purple-500" />
          </motion.div>
          <p className="text-[10px] text-teal-600 font-medium uppercase tracking-wider">Effort</p>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-neutral-800 tabular-nums">
            {metrics.avg_friction.toFixed(1)}
          </span>
          <span className="text-sm text-neutral-400 group-hover:text-purple-500 transition-colors">/5</span>
        </div>
      </motion.div>
      
      {/* Drift Score */}
      <motion.div
        custom={3}
        variants={pillVariants}
        initial="hidden"
        animate="visible"
        whileHover={{ scale: 1.03, y: -2 }}
        className={`
          rounded-2xl p-4 cursor-default group
          backdrop-blur-md border 
          shadow-lg
          ${driftStyle.bg} ${driftStyle.border} ${driftStyle.glow}
        `}
      >
        <div className="flex items-center gap-2 mb-2">
          <motion.div {...iconPulse}>
            <TrendingDown className={`w-4 h-4 ${driftStyle.icon}`} />
          </motion.div>
          <p className={`text-[10px] font-medium uppercase tracking-wider ${driftStyle.text}`}>
            {driftStyle.label}
          </p>
        </div>
        <div className="flex items-baseline gap-1">
          <AnimatedCounter 
            value={Math.round(metrics.drift_score * 100)} 
            className={`text-2xl font-bold ${driftStyle.text}`}
          />
          <span className={`text-sm opacity-60 ${driftStyle.text}`}>%</span>
        </div>
      </motion.div>
    </div>
  );
}
