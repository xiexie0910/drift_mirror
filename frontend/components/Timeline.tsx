'use client';

/**
 * Timeline Component - Award-Winning Version
 * 
 * A visual journey of check-ins with:
 * - Animated entrance for each item
 * - Connecting path between entries
 * - Smooth hover effects
 * - Visual streak indicators
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Checkin } from '@/lib/api';
import { Check, X, Flame, Zap } from 'lucide-react';

interface TimelineProps {
  checkins: Checkin[];
  onCheckinClick?: (checkin: Checkin) => void;
}

export function Timeline({ checkins, onCheckinClick }: TimelineProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getFrictionLabel = (friction: number) => {
    if (friction === 1) return { label: 'Easy', color: 'text-emerald-500' };
    if (friction === 2) return { label: 'Medium', color: 'text-amber-500' };
    return { label: 'Hard', color: 'text-rose-500' };
  };

  // Calculate current streak
  const calculateStreak = () => {
    let streak = 0;
    for (const checkin of checkins) {
      if (checkin.did_minimum_action ?? checkin.completed) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const currentStreak = calculateStreak();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      x: 0, 
      scale: 1,
      transition: { type: 'spring', stiffness: 300, damping: 20 },
    },
  };

  if (checkins.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-subtle rounded-xl p-6 text-center"
      >
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Zap className="w-8 h-8 text-teal-400 mx-auto mb-2" />
        </motion.div>
        <p className="text-sm text-neutral-500">
          No check-ins yet. Start your journey!
        </p>
      </motion.div>
    );
  }

  return (
    <div className="relative">
      {/* Streak indicator */}
      {currentStreak >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-4 px-3 py-2 rounded-full glass-strong w-fit"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            <Flame className="w-4 h-4 text-orange-500" />
          </motion.div>
          <span className="text-sm font-medium text-neutral-700">
            {currentStreak} day streak!
          </span>
        </motion.div>
      )}

      {/* Timeline path - geometrically centered with status icons */}
      <div className={`absolute left-[17px] w-0.5 bg-gradient-to-b from-teal-400 via-teal-300 to-transparent ${currentStreak >= 2 ? 'top-[64px]' : 'top-[12px]'}`} style={{ bottom: checkins.length > 0 ? `calc(100% - ${checkins.length * 88}px + 20px)` : '0' }} />

      <motion.div
        className="space-y-3 relative"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {checkins.map((checkin, index) => {
            const didMinimum = checkin.did_minimum_action ?? checkin.completed;
            const friction = getFrictionLabel(checkin.friction);
            const isStreakPart = index < currentStreak;
            
            return (
              <motion.div
                key={checkin.id}
                variants={itemVariants}
                layout
                onClick={() => onCheckinClick?.(checkin)}
                className="relative pl-10 cursor-pointer group"
              >
                {/* Timeline node */}
                <motion.div
                  className={`
                    absolute left-2 top-3 w-5 h-5 rounded-full flex items-center justify-center
                    border-2 transition-all duration-200
                    ${didMinimum 
                      ? 'bg-teal-500 border-teal-500 text-white' 
                      : 'bg-white border-neutral-300 text-neutral-400'}
                    ${isStreakPart && didMinimum ? 'ring-2 ring-teal-300 ring-offset-2' : ''}
                  `}
                  whileHover={{ scale: 1.2 }}
                >
                  {didMinimum ? (
                    <Check className="w-3 h-3" strokeWidth={3} />
                  ) : (
                    <X className="w-3 h-3" strokeWidth={3} />
                  )}
                </motion.div>

                {/* Card */}
                <motion.div 
                  className="glass-subtle rounded-xl p-4 transition-all group-hover:shadow-lg group-hover:bg-white/60"
                  whileHover={{ x: 4 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-neutral-700">
                          {didMinimum ? 'Completed minimum' : 'Missed'}
                        </p>
                        {checkin.extra_done && (
                          <motion.span 
                            className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 text-xs font-medium"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.2 }}
                          >
                            +extra
                          </motion.span>
                        )}
                      </div>
                      
                      {/* Progress note preview */}
                      {checkin.extra_done && (
                        <p className="text-xs text-neutral-500 mt-1 line-clamp-1">
                          {checkin.extra_done}
                        </p>
                      )}
                      
                      {/* Friction indicator */}
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-xs font-medium ${friction.color}`}>
                          {friction.label}
                        </span>
                        
                        {/* Friction dots */}
                        <div className="flex gap-1">
                          {[1, 2, 3].map((level) => (
                            <motion.div
                              key={level}
                              className={`w-1.5 h-1.5 rounded-full ${
                                level <= checkin.friction 
                                  ? 'bg-neutral-400' 
                                  : 'bg-neutral-200'
                              }`}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.1 * level }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <span className="text-xs text-neutral-400 shrink-0 font-medium">
                      {formatDate(checkin.created_at)}
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
