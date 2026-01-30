'use client';

/**
 * DriftMirror Check-in Page
 * ============================================================
 * 
 * Award-winning design with:
 * - Smooth step-by-step animations
 * - Satisfying button interactions
 * - Visual feedback for selections
 */

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Zap, Loader2, Check, X, Sparkles, MessageSquare, ThumbsUp } from 'lucide-react';
import { api, Dashboard, ApiError } from '@/lib/api';
import { sanitizeText, INPUT_LIMITS } from '@/lib/validation';
import { useCelebration } from '@/components/CelebrationProvider';

function CheckinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const goalId = searchParams.get('goal');
  const { triggerCelebration } = useCelebration();
  
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Simplified form state - minimum action centered
  const [didMinimum, setDidMinimum] = useState<boolean | null>(null);
  const [progressNote, setProgressNote] = useState('');
  const [friction, setFriction] = useState(2);

  useEffect(() => {
    const loadDashboard = goalId 
      ? api.getDashboardForResolution(Number(goalId))
      : api.getDashboard();
      
    loadDashboard
      .then(setDashboard)
      .catch(() => router.push('/dashboard'));
  }, [router, goalId]);

  const handleSubmit = async () => {
    if (!dashboard?.resolution) {
      setError('Loading goal data... please wait.');
      return;
    }
    
    if (didMinimum === null) {
      setError('Please select Yes or No before saving.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await api.createCheckin({
        resolution_id: dashboard.resolution.id,
        did_minimum_action: didMinimum,
        extra_done: progressNote.trim() ? sanitizeText(progressNote) : undefined,
        friction: friction,
      });
      
      // Trigger water celebration animation immediately
      triggerCelebration();
      
      // Navigate right away - celebration overlay will follow
      const returnPath = goalId ? `/dashboard/${goalId}` : '/dashboard';
      router.push(returnPath);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to save check-in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (!dashboard?.resolution) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-subtle p-6 rounded-2xl animate-pulse-soft">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <p className="text-neutral-500 text-sm">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  const minimumAction = dashboard.resolution.minimum_action_text 
    || `${dashboard.resolution.min_minutes} min on your goal`;
  const frictionLabels = ['Effortless', 'Some effort', 'Challenging'];
  const frictionEmojis = ['😊', '💪', '🔥'];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  return (
    <div className="min-h-screen pb-8">
      <motion.div 
        className="max-w-lg mx-auto px-4 py-8 space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        
        {/* Header */}
        <motion.header variants={itemVariants} className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(goalId ? `/dashboard/${goalId}` : '/dashboard')}
            className="p-3 glass-subtle rounded-xl text-neutral-500 hover:text-teal-600 transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <h1 className="text-xl font-semibold text-neutral-800">
              Quick Check-in
            </h1>
            <p className="text-sm text-neutral-500">
              {dashboard.resolution.title}
            </p>
          </div>
        </motion.header>

        {/* Main Card: Your Minimum Action */}
        <motion.div variants={itemVariants} className="glass-strong rounded-2xl p-6 space-y-5">
          
          {/* Minimum action display */}
          <motion.div 
            className="flex items-start gap-3 p-4 glass-quiet rounded-xl"
            whileHover={{ scale: 1.01 }}
          >
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 shadow-lg shadow-amber-200/50">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
                Your Minimum Action
              </p>
              <p className="text-neutral-800 font-medium text-lg">
                {minimumAction}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Just {dashboard.resolution.min_minutes} minutes
              </p>
            </div>
          </motion.div>

          {/* The main question */}
          <div className="text-center py-2">
            <p className="text-xl font-semibold text-neutral-800">
              Did you do it today?
            </p>
          </div>

          {/* Yes / No buttons with spring animations */}
          <div className="grid grid-cols-2 gap-4">
            <motion.button
              type="button"
              onClick={() => setDidMinimum(true)}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              animate={didMinimum === true ? { 
                scale: [1, 1.05, 1],
                transition: { duration: 0.3 }
              } : {}}
              className={`relative flex flex-col items-center justify-center gap-2 p-5 rounded-2xl font-medium transition-all overflow-hidden ${
                didMinimum === true
                  ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-xl shadow-teal-500/30'
                  : 'glass-subtle text-neutral-600 hover:bg-teal-50 hover:text-teal-600'
              }`}
            >
              {didMinimum === true && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 bg-white/10"
                />
              )}
              <Check className="w-8 h-8" />
              <span className="text-lg">Yes!</span>
              {didMinimum === true && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute top-2 right-2"
                >
                  <Sparkles className="w-5 h-5" />
                </motion.div>
              )}
            </motion.button>
            <motion.button
              type="button"
              onClick={() => setDidMinimum(false)}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl font-medium transition-all ${
                didMinimum === false
                  ? 'bg-gradient-to-br from-neutral-500 to-neutral-600 text-white shadow-xl shadow-neutral-500/30'
                  : 'glass-subtle text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <X className="w-8 h-8" />
              <span className="text-lg">Not today</span>
            </motion.button>
          </div>

          {/* Error display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Tell us more - animated appearance */}
        <AnimatePresence>
          {didMinimum !== null && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="glass-strong rounded-2xl p-6 space-y-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-teal-500" />
                <label className="text-sm font-medium text-neutral-700">
                  Tell us about it
                </label>
              </div>
              <motion.textarea
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                value={progressNote}
                onChange={(e) => setProgressNote(e.target.value)}
                placeholder={didMinimum 
                  ? "e.g., Practiced for 30 min, focused on chord transitions..." 
                  : "e.g., Got busy with work but did 2 min of stretching..."}
                maxLength={INPUT_LIMITS.ACTUAL_MAX_LENGTH}
                className="w-full h-28 bg-white/60 border border-white/60 rounded-xl p-4 text-neutral-800 placeholder:text-neutral-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none transition-all"
                required
              />
              <p className="text-xs text-neutral-400 flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" />
                This builds your 90-day habit story
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Friction slider with animated circles */}
        <AnimatePresence>
          {didMinimum !== null && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.05 }}
              className="glass-strong rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <label className="text-sm font-medium text-neutral-700">
                  How did it feel?
                </label>
                <motion.span 
                  key={friction}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-2xl"
                >
                  {frictionEmojis[friction - 1]}
                </motion.span>
              </div>
              
              {/* Custom friction selector */}
              <div className="flex justify-between gap-3">
                {[1, 2, 3].map((level) => (
                  <motion.button
                    key={level}
                    type="button"
                    onClick={() => setFriction(level)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex-1 py-4 px-3 rounded-xl font-medium transition-all ${
                      friction === level
                        ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/30'
                        : 'glass-subtle text-neutral-600 hover:bg-teal-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">{frictionEmojis[level - 1]}</div>
                      <div className="text-xs">{frictionLabels[level - 1]}</div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit button with spring animation */}
        <AnimatePresence>
          {didMinimum !== null && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
            >
              <motion.button
                onClick={handleSubmit}
                disabled={loading || !progressNote.trim()}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  w-full py-4 px-6 rounded-2xl font-semibold text-lg
                  transition-all duration-200
                  ${loading || !progressNote.trim()
                    ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-xl shadow-teal-500/30 hover:shadow-2xl hover:shadow-teal-500/40'
                  }
                `}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Check className="w-5 h-5" />
                    Save Check-in
                  </span>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function CheckinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    }>
      <CheckinContent />
    </Suspense>
  );
}
