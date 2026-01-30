'use client';

/**
 * DriftMirror Goal Detail Page
 * ============================================================
 * 
 * Award-winning design with:
 * - Smooth staggered animations
 * - Interactive card hover effects
 * - Spring physics for transitions
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { MetricPills } from '@/components/MetricPills';
import { Timeline } from '@/components/Timeline';
import { InsightCard } from '@/components/InsightCard';
import { 
  ArrowLeft, Plus, ArrowRight, Sparkles, Target, 
  Trash2, Calendar, Clock, Flag, Zap, TrendingUp, X, Loader2, Check
} from 'lucide-react';
import { api, Dashboard, ProgressSummaryResponse, ApiError, Checkin } from '@/lib/api';

export default function GoalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const goalId = Number(params.id);
  
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  
  // Checkin detail modal state
  const [selectedCheckin, setSelectedCheckin] = useState<Checkin | null>(null);
  
  // Minimum action editing state
  const [isEditingMinAction, setIsEditingMinAction] = useState(false);
  const [minActionText, setMinActionText] = useState('');
  const [savingMinAction, setSavingMinAction] = useState(false);
  
  // Progress summary state
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<ProgressSummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const loadGoalDetails = useCallback(async () => {
    if (!goalId || isNaN(goalId)) {
      router.push('/dashboard');
      return;
    }
    
    try {
      const data = await api.getDashboardForResolution(goalId);
      if (!data.resolution) {
        router.push('/dashboard');
        return;
      }
      setDashboard(data);
      setMinActionText(data.resolution.minimum_action_text || '');
    } catch {
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [goalId, router]);

  useEffect(() => {
    loadGoalDetails();
  }, [loadGoalDetails]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this goal? All check-ins and data will be lost.')) {
      return;
    }
    
    setDeleting(true);
    try {
      await api.deleteResolution(goalId);
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.message);
      }
      setDeleting(false);
    }
  };

  const handleCheckProgress = async () => {
    // Show message if no check-ins yet
    if (metrics.total_checkins === 0) {
      setShowSummary(true);
      setSummaryLoading(false);
      setSummary({
        overall_progress: 'Please check in to see progress.',
        key_wins: [],
        growth_observed: '',
        encouragement: 'Start your first check-in to begin tracking your journey!',
        days_to_habit: 90
      });
      return;
    }
    
    setShowSummary(true);
    setSummaryLoading(true);
    try {
      const data = await api.getProgressSummary(goalId);
      setSummary(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setSummary({
          overall_progress: 'Unable to generate summary at this time.',
          key_wins: [],
          growth_observed: '',
          encouragement: 'Keep going!',
          days_to_habit: 90
        });
      }
    } finally {
      setSummaryLoading(false);
    }
  };
const handleSaveMinAction = async () => {
    if (!minActionText.trim()) {
      alert('Minimum action cannot be empty');
      return;
    }
    
    setSavingMinAction(true);
    try {
      await api.updateMinimumAction(goalId, minActionText.trim());
      
      setIsEditingMinAction(false);
      await loadGoalDetails();
    } catch {
      alert('Failed to update minimum action. Please try again.');
    } finally {
      setSavingMinAction(false);
    }
  };

  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-subtle p-6 rounded-2xl animate-pulse-soft">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <p className="text-neutral-500 text-sm">Loading goal details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboard?.resolution) return null;

  const { resolution, current_plan, metrics, recent_checkins, latest_mirror, drift_triggered } = dashboard;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
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
    <div className="min-h-screen pb-40 overflow-y-auto">
      <motion.div 
        className="max-w-lg mx-auto px-4 py-8 space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        
        {/* Back Navigation */}
        <motion.nav variants={itemVariants}>
          <motion.button
            whileHover={{ x: -3 }}
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-neutral-500 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">All Goals</span>
          </motion.button>
        </motion.nav>

        {/* Goal Header - Clear statement */}
        <motion.header variants={itemVariants} className="glass-strong rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <motion.div 
              whileHover={{ rotate: 5, scale: 1.05 }}
              className="glass-subtle p-3 rounded-xl glow-teal shrink-0"
            >
              <Target className="w-6 h-6 text-teal-600" />
            </motion.div>
            <div className="flex-1">
              <p className="text-xs text-teal-600 uppercase tracking-wider font-medium mb-1">Goal</p>
              <h1 className="text-2xl font-semibold text-neutral-800">
                {resolution.title}
              </h1>
            </div>
          </div>
          
          {/* Purpose / Why */}
          {resolution.why && (
            <div className="mt-6 pt-5 border-t border-white/30">
              <div className="flex items-start gap-3">
                <Flag className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-teal-600 uppercase tracking-wider font-medium mb-1">Purpose</p>
                  <p className="text-neutral-700">{resolution.why}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Goal Settings - always show current plan values */}
          <div className="flex items-center gap-4 mt-5 pt-4 border-t border-white/20">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Calendar className="w-4 h-4 text-teal-500" />
              <span>{current_plan?.frequency_per_week ?? resolution.frequency_per_week}x per week</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Clock className="w-4 h-4 text-teal-500" />
              <span>{current_plan?.min_minutes ?? resolution.min_minutes} min minimum</span>
            </div>
          </div>
          
          {/* Minimum Action */}
          {resolution.minimum_action_text && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-teal-500/10 rounded-lg shrink-0">
                  <Zap className="w-4 h-4 text-teal-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-teal-600 uppercase tracking-wider font-medium">
                      Minimum Action
                    </p>
                    <button
                      onClick={() => {
                        if (isEditingMinAction) {
                          setIsEditingMinAction(false);
                          setMinActionText(resolution.minimum_action_text || '');
                        } else {
                          setIsEditingMinAction(true);
                        }
                      }}
                      className="text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors"
                    >
                      {isEditingMinAction ? 'Cancel' : 'Edit'}
                    </button>
                  </div>
                  {isEditingMinAction ? (
                    <div className="space-y-2">
                      <textarea
                        value={minActionText}
                        onChange={(e) => setMinActionText(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg glass-subtle text-neutral-800 focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none"
                        rows={2}
                        placeholder="Describe your minimum action..."
                      />
                      <button
                        onClick={handleSaveMinAction}
                        disabled={savingMinAction || !minActionText.trim()}
                        className="px-3 py-1.5 bg-teal-500 text-white text-sm rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingMinAction ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-neutral-700">{resolution.minimum_action_text}</p>
                      <p className="text-xs text-neutral-500 mt-1">{current_plan?.min_minutes ?? resolution.min_minutes} min</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.header>

        {/* Metrics */}
        <motion.section variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-medium text-teal-600 uppercase tracking-wider">
              Progress
            </h2>
          </div>
          <MetricPills metrics={metrics} />
        </motion.section>

        {/* Progress Summary Modal */}
        <AnimatePresence>
          {showSummary && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="glass-strong rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      initial={{ rotate: -10 }}
                      animate={{ rotate: 0 }}
                      className="p-2 bg-teal-500/10 rounded-lg"
                    >
                      <TrendingUp className="w-5 h-5 text-teal-600" />
                    </motion.div>
                    <h3 className="text-lg font-semibold text-neutral-800">Your Progress</h3>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowSummary(false)}
                    className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-neutral-500" />
                  </motion.button>
                </div>

                {summaryLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                    <p className="text-sm text-neutral-500 mt-3">Analyzing your progress...</p>
                  </div>
                ) : summary ? (
                  <div className="space-y-6">
                    {/* Overall Progress */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <p className="text-neutral-700 leading-relaxed">{summary.overall_progress}</p>
                    </motion.div>

                    {/* Key Wins */}
                    {summary.key_wins.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <h4 className="text-xs font-medium text-teal-600 uppercase tracking-wider mb-3">
                          Key Wins
                        </h4>
                        <ul className="space-y-2">
                          {summary.key_wins.map((win, i) => (
                            <motion.li 
                              key={i} 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.15 + i * 0.05 }}
                              className="flex items-start gap-2 text-sm text-neutral-700"
                            >
                              <span className="text-teal-500 mt-0.5">✓</span>
                              {win}
                            </motion.li>
                          ))}
                      </ul>
                    </motion.div>
                  )}

                  {/* Growth Observed */}
                  {summary.growth_observed && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <h4 className="text-xs font-medium text-teal-600 uppercase tracking-wider mb-2">
                        Growth Observed
                      </h4>
                      <p className="text-sm text-neutral-600">{summary.growth_observed}</p>
                    </motion.div>
                  )}

                  {/* Days to Habit */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="glass-subtle rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">Days to habit formation</span>
                      <span className="text-lg font-semibold text-teal-600">{summary.days_to_habit}</span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2 mt-2 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, ((90 - summary.days_to_habit) / 90) * 100)}%` }}
                        transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                        className="bg-gradient-to-r from-teal-400 to-teal-600 h-2 rounded-full"
                      />
                    </div>
                    <p className="text-xs text-neutral-500 mt-2">Based on 90-day habit research</p>
                  </motion.div>

                  {/* Encouragement */}
                  {summary.encouragement && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.35 }}
                      className="pt-4 border-t border-white/30"
                    >
                      <p className="text-neutral-700 italic">&ldquo;{summary.encouragement}&rdquo;</p>
                    </motion.div>
                  )}
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>

        {/* Drift Alert */}
        {drift_triggered && latest_mirror && (
          <motion.div 
            variants={itemVariants}
            className="glass-strong rounded-2xl p-5 glow-teal"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <motion.div 
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="p-2 bg-teal-500/10 rounded-lg"
                >
                  <Sparkles className="w-5 h-5 text-teal-600" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-700">Pattern detected</p>
                  {/* Show first finding preview */}
                  {latest_mirror.findings?.[0] ? (
                    <p className="text-sm text-neutral-600 mt-0.5 line-clamp-2">
                      {latest_mirror.findings[0].finding}
                    </p>
                  ) : (
                    <p className="text-sm text-neutral-500 mt-0.5">The system noticed some drift</p>
                  )}
                </div>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => router.push(`/mirror?goal=${goalId}`)}
                  variant="glass"
                  size="sm"
                  className="shrink-0 gap-1"
                >
                  Details <ArrowRight className="w-3 h-3" />
                </Button>
              </motion.div>
            </div>
            {/* Show strength pattern if available */}
            {latest_mirror.strength_pattern && (
              <div className="mt-3 pt-3 border-t border-white/20">
                <p className="text-xs text-teal-600 font-medium">What&apos;s working</p>
                <p className="text-sm text-neutral-600 mt-1">{latest_mirror.strength_pattern}</p>
              </div>
            )}
            {/* Drift explanation */}
            <p className="text-xs text-neutral-500 mt-3 pt-3 border-t border-white/20">
              Drift doesn&apos;t mean failure. It just means the plan and real life are out of sync.
            </p>
          </motion.div>
        )}

        {/* Actionable Suggestions from Latest Mirror */}
        {latest_mirror?.actionable_suggestions && latest_mirror.actionable_suggestions.length > 0 && (
          <motion.div variants={itemVariants} className="space-y-4">
            {latest_mirror.actionable_suggestions.slice(0, 2).map((suggestion, idx) => (
              <InsightCard
                key={idx}
                suggestion={suggestion}
                resolutionId={goalId}
                mirrorReportId={latest_mirror.id}
                onActionComplete={loadGoalDetails}
              />
            ))}
            {latest_mirror.actionable_suggestions.length > 2 && (
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button
                  onClick={() => router.push(`/mirror?goal=${goalId}`)}
                  variant="glass"
                  className="w-full gap-2"
                >
                  View all {latest_mirror.actionable_suggestions.length} suggestions
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Plan Adjusted Notice - only show when plan differs from original */}
        {current_plan && current_plan.version > 1 && (
          resolution.frequency_per_week !== current_plan.frequency_per_week ||
          resolution.min_minutes !== current_plan.min_minutes
        ) && (
          <motion.section variants={itemVariants} className="glass-subtle rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="p-1.5 bg-amber-500/10 rounded-lg"
                >
                  <Sparkles className="w-4 h-4 text-amber-600" />
                </motion.div>
                <div>
                  <p className="text-sm font-medium text-neutral-700">Plan adjusted from original</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {resolution.frequency_per_week !== current_plan.frequency_per_week && 
                      `${resolution.frequency_per_week}x → ${current_plan.frequency_per_week}x/week`}
                    {resolution.frequency_per_week !== current_plan.frequency_per_week && 
                     resolution.min_minutes !== current_plan.min_minutes && ' • '}
                    {resolution.min_minutes !== current_plan.min_minutes && 
                      `${resolution.min_minutes} → ${current_plan.min_minutes} min`}
                  </p>
                </div>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      await api.revertPlan(goalId);
                      await loadGoalDetails();
                    } catch {
                      alert('Failed to revert plan. Please try again.');
                    }
                  }}
                className="text-neutral-500 hover:text-neutral-700 shrink-0"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Revert
              </Button>
              </motion.div>
            </div>
          </motion.section>
        )}

        {/* Recent Check-ins */}
        <motion.section variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-medium text-teal-600 uppercase tracking-wider">
              Recent Check-ins
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCheckProgress}
              className="flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Check Progress
            </motion.button>
          </div>
          {recent_checkins.length > 0 ? (
            <Timeline checkins={recent_checkins} onCheckinClick={setSelectedCheckin} />
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-subtle rounded-2xl p-8 text-center"
            >
              <p className="text-neutral-500">No check-ins recorded yet.</p>
              <p className="text-sm text-neutral-400 mt-1">Start tracking your progress below.</p>
            </motion.div>
          )}
        </motion.section>

        {/* Danger Zone */}
        <motion.section variants={itemVariants}>
          <div className="glass-subtle rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-700">Delete Goal</p>
                <p className="text-xs text-neutral-500 mt-0.5">This cannot be undone</p>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleDelete}
                  variant="ghost"
                  size="sm"
                  disabled={deleting}
                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleting ? 'Deleting...' : 'Delete'}
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.section>
      </motion.div>

      {/* Fixed bottom action */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.3 }}
        className="fixed bottom-0 left-0 right-0 p-4 glass-strong border-t border-white/20"
      >
        <div className="max-w-lg mx-auto">
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(`/checkin?goal=${goalId}`)}
            className="w-full py-4 px-6 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold text-lg rounded-2xl shadow-xl shadow-teal-500/30 flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Record Check-in
          </motion.button>
          
          {latest_mirror && !drift_triggered && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => router.push(`/mirror?goal=${goalId}`)}
              className="w-full mt-3 py-2 text-sm text-neutral-500 hover:text-teal-600 transition-colors"
            >
              View latest analysis
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Checkin Detail Modal - Fixed Center */}
      <AnimatePresence>
        {selectedCheckin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="glass-strong rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-neutral-800">Check-in Details</h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedCheckin(null)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-500" />
                </motion.button>
              </div>

            <div className="space-y-4">
              {/* Date */}
              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
                  Date
                </p>
                <p className="text-neutral-800">
                  {new Date(selectedCheckin.created_at).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <div className={`
                  w-6 h-6 rounded-full flex items-center justify-center
                  ${selectedCheckin.did_minimum_action ?? selectedCheckin.completed
                    ? 'bg-teal-100 text-teal-600' 
                    : 'bg-neutral-100 text-neutral-400'}
                `}>
                  {(selectedCheckin.did_minimum_action ?? selectedCheckin.completed) ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                </div>
                <span className="text-neutral-800 font-medium">
                  {(selectedCheckin.did_minimum_action ?? selectedCheckin.completed) ? 'Completed' : 'Missed'}
                </span>
              </div>

              {/* Planned vs Actual */}
              <div className="border-t border-white/20 pt-4">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
                  Planned
                </p>
                <div 
                  contentEditable
                  suppressContentEditableWarning
                  className="text-neutral-800 text-sm p-2 rounded border border-neutral-200 bg-white/30 hover:bg-white/50 focus:bg-white/50 focus:outline-none focus:ring-2 focus:ring-teal-400 transition-colors cursor-text"
                >
                  {selectedCheckin.planned}
                </div>
              </div>

              <div className="border-t border-white/20 pt-4">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
                  What Happened
                </p>
                <div 
                  contentEditable
                  suppressContentEditableWarning
                  className="text-neutral-800 text-sm p-2 rounded border border-neutral-200 bg-white/30 hover:bg-white/50 focus:bg-white/50 focus:outline-none focus:ring-2 focus:ring-teal-400 transition-colors cursor-text"
                >
                  {selectedCheckin.actual}
                </div>
              </div>

              {/* Grid Details */}
              <div className="grid grid-cols-2 gap-4 border-t border-white/20 pt-4">
                <div>
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
                    How It Felt
                  </p>
                  <p className="text-neutral-800 font-medium">
                    {selectedCheckin.friction === 1 ? 'Easy' : selectedCheckin.friction === 2 ? 'Medium' : 'Hard'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
                    Minimum Action
                  </p>
                  <p className="text-neutral-800 font-medium">
                    {(selectedCheckin.did_minimum_action ?? selectedCheckin.completed) ? 'Done ✓' : 'Skipped'}
                  </p>
                </div>
              </div>

              {/* Blocker */}
              {selectedCheckin.blocker && (
                <div className="border-t border-white/20 pt-4">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
                    What Got in the Way
                  </p>
                  <div 
                    contentEditable
                    suppressContentEditableWarning
                    className="text-neutral-800 text-sm p-2 rounded border border-neutral-200 bg-white/30 hover:bg-white/50 focus:bg-white/50 focus:outline-none focus:ring-2 focus:ring-teal-400 transition-colors cursor-text"
                  >
                    {selectedCheckin.blocker}
                  </div>
                </div>
              )}

              {/* Extra Done */}
              {selectedCheckin.extra_done && (
                <div className="border-t border-white/20 pt-4">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
                    Extra Work
                  </p>
                  <div 
                    contentEditable
                    suppressContentEditableWarning
                    className="text-neutral-800 text-sm p-2 rounded border border-neutral-200 bg-white/30 hover:bg-white/50 focus:bg-white/50 focus:outline-none focus:ring-2 focus:ring-teal-400 transition-colors cursor-text"
                  >
                    {selectedCheckin.extra_done}
                  </div>
                </div>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedCheckin(null)}
              className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-medium shadow-lg shadow-teal-500/30"
            >
              Close
            </motion.button>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
