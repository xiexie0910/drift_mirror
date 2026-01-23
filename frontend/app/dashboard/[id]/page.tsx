'use client';

/**
 * DriftMirror Goal Detail Page
 * ============================================================
 * 
 * Shows specific goal details with:
 * - Clear goal statement and purpose
 * - Current metrics
 * - Recent check-ins
 * - Plan details
 * - Progress summary button
 * - Actions (check-in, view analysis, delete)
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { MetricPills } from '@/components/MetricPills';
import { Timeline } from '@/components/Timeline';
import { 
  ArrowLeft, Plus, ArrowRight, Sparkles, Target, 
  Trash2, Calendar, Clock, Flag, Zap, TrendingUp, X, Loader2
} from 'lucide-react';
import { api, Dashboard, ProgressSummaryResponse, ApiError } from '@/lib/api';

export default function GoalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const goalId = Number(params.id);
  
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  
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

  return (
    <div className="min-h-screen pb-40 overflow-y-auto">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-8">
        
        {/* Back Navigation */}
        <nav className="animate-fade-in-up">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-neutral-500 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">All Goals</span>
          </button>
        </nav>

        {/* Goal Header - Clear statement */}
        <header className="glass-strong rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-start gap-4">
            <div className="glass-subtle p-3 rounded-xl glow-teal shrink-0">
              <Target className="w-6 h-6 text-teal-600" />
            </div>
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
          
          {/* Goal Settings */}
          <div className="flex items-center gap-4 mt-5 pt-4 border-t border-white/20">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Calendar className="w-4 h-4 text-teal-500" />
              <span>{resolution.frequency_per_week}x per week</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Clock className="w-4 h-4 text-teal-500" />
              <span>{resolution.min_minutes} min minimum</span>
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
                  <p className="text-xs text-teal-600 uppercase tracking-wider font-medium mb-1">
                    Base Minimum <span className="text-neutral-400 normal-case">(always counts)</span>
                  </p>
                  <p className="text-neutral-700">{resolution.minimum_action_text}</p>
                  <p className="text-xs text-neutral-500 mt-1">{resolution.min_minutes} min</p>
                  
                  {/* Momentum Minimum Suggestion */}
                  {metrics.suggest_momentum_minimum && metrics.momentum_suggestion_text && (
                    <div className="mt-3 p-3 bg-amber-50/50 rounded-xl border border-amber-200/50">
                      <p className="text-xs text-amber-600 uppercase tracking-wider font-medium mb-1">
                        Momentum Minimum <span className="text-amber-400 normal-case">(optional)</span>
                      </p>
                      <p className="text-sm text-amber-700">{metrics.momentum_suggestion_text}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Metrics */}
        <section className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-medium text-teal-600 uppercase tracking-wider">
              Progress
            </h2>
          </div>
          <MetricPills metrics={metrics} />
        </section>

        {/* Progress Summary Modal */}
        {showSummary && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <div className="glass-strong rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto animate-fade-in-up">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-500/10 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-teal-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-800">Your Progress</h3>
                </div>
                <button
                  onClick={() => setShowSummary(false)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>

              {summaryLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                  <p className="text-sm text-neutral-500 mt-3">Analyzing your progress...</p>
                </div>
              ) : summary ? (
                <div className="space-y-6">
                  {/* Overall Progress */}
                  <div>
                    <p className="text-neutral-700 leading-relaxed">{summary.overall_progress}</p>
                  </div>

                  {/* Key Wins */}
                  {summary.key_wins.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-teal-600 uppercase tracking-wider mb-3">
                        Key Wins
                      </h4>
                      <ul className="space-y-2">
                        {summary.key_wins.map((win, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                            <span className="text-teal-500 mt-0.5">✓</span>
                            {win}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Growth Observed */}
                  {summary.growth_observed && (
                    <div>
                      <h4 className="text-xs font-medium text-teal-600 uppercase tracking-wider mb-2">
                        Growth Observed
                      </h4>
                      <p className="text-sm text-neutral-600">{summary.growth_observed}</p>
                    </div>
                  )}

                  {/* Days to Habit */}
                  <div className="glass-subtle rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">Days to habit formation</span>
                      <span className="text-lg font-semibold text-teal-600">{summary.days_to_habit}</span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-teal-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, ((90 - summary.days_to_habit) / 90) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-neutral-500 mt-2">Based on 90-day habit research</p>
                  </div>

                  {/* Encouragement */}
                  {summary.encouragement && (
                    <div className="pt-4 border-t border-white/30">
                      <p className="text-neutral-700 italic">&ldquo;{summary.encouragement}&rdquo;</p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Drift Alert */}
        {drift_triggered && latest_mirror && (
          <div className="glass-strong rounded-2xl p-5 animate-fade-in-up glow-teal" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-500/10 rounded-lg">
                  <Sparkles className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="font-medium text-neutral-700">Pattern detected</p>
                  <p className="text-sm text-neutral-500 mt-0.5">The system noticed some drift</p>
                </div>
              </div>
              <Button
                onClick={() => router.push(`/mirror?goal=${goalId}`)}
                variant="glass"
                size="sm"
                className="shrink-0 gap-1"
              >
                View <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
            {/* Drift explanation */}
            <p className="text-xs text-neutral-500 mt-3 pt-3 border-t border-white/20">
              Drift doesn&apos;t mean failure. It just means the plan and real life are out of sync.
            </p>
          </div>
        )}

        {/* Current Plan - unified view */}
        {current_plan && (
          <section className="glass-strong rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-medium text-teal-600 uppercase tracking-wider">
                {current_plan.version > 1 ? 'Adjusted Plan' : 'Current Plan'}
              </h2>
              {/* Weekly Progress Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 glass-subtle rounded-full">
                <Calendar className="w-3.5 h-3.5 text-teal-500" />
                <span className={`text-sm font-medium ${
                  metrics.this_week_count >= metrics.target_frequency 
                    ? 'text-teal-600' 
                    : 'text-neutral-600'
                }`}>
                  {metrics.this_week_count}/{metrics.target_frequency} this week
                </span>
                {metrics.this_week_count >= metrics.target_frequency && (
                  <span className="text-teal-500">✓</span>
                )}
              </div>
            </div>
            
            {/* Show changes inline if plan was adjusted */}
            {current_plan.version > 1 ? (
              <div className="space-y-3">
                {resolution.frequency_per_week !== current_plan.frequency_per_week && (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-neutral-500 w-20">Frequency</span>
                    <span className="text-neutral-400 line-through">{resolution.frequency_per_week}x/week</span>
                    <ArrowRight className="w-4 h-4 text-neutral-300" />
                    <span className="text-teal-600 font-medium">{current_plan.frequency_per_week}x/week</span>
                  </div>
                )}
                {resolution.min_minutes !== current_plan.min_minutes && (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-neutral-500 w-20">Duration</span>
                    <span className="text-neutral-400 line-through">{resolution.min_minutes} min</span>
                    <ArrowRight className="w-4 h-4 text-neutral-300" />
                    <span className="text-teal-600 font-medium">{current_plan.min_minutes} min</span>
                  </div>
                )}
                {resolution.time_window !== current_plan.time_window && (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-neutral-500 w-20">Time</span>
                    <span className="text-neutral-400 line-through">{resolution.time_window}</span>
                    <ArrowRight className="w-4 h-4 text-neutral-300" />
                    <span className="text-teal-600 font-medium">{current_plan.time_window}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <span className="px-4 py-2 glass-subtle rounded-xl text-neutral-700 font-medium text-sm">
                  {current_plan.frequency_per_week}x/week
                </span>
                <span className="px-4 py-2 glass-subtle rounded-xl text-neutral-700 font-medium text-sm">
                  {current_plan.min_minutes} min
                </span>
                <span className="px-4 py-2 glass-subtle rounded-xl text-neutral-700 font-medium text-sm">
                  {current_plan.time_window}
                </span>
              </div>
            )}
            
            {current_plan.recovery_step && (
              <div className="glass-quiet rounded-xl p-4 mt-4">
                <span className="text-teal-600 text-sm font-medium">Suggestion:</span>
                <p className="text-sm text-neutral-600 mt-1">{current_plan.recovery_step}</p>
              </div>
            )}
          </section>
        )}

        {/* Recent Check-ins */}
        <section className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-medium text-teal-600 uppercase tracking-wider">
              Recent Check-ins
            </h2>
            <button
              onClick={handleCheckProgress}
              className="flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Check Progress
            </button>
          </div>
          {recent_checkins.length > 0 ? (
            <Timeline checkins={recent_checkins} />
          ) : (
            <div className="glass-subtle rounded-2xl p-8 text-center">
              <p className="text-neutral-500">No check-ins recorded yet.</p>
              <p className="text-sm text-neutral-400 mt-1">Start tracking your progress below.</p>
            </div>
          )}
        </section>

        {/* Danger Zone */}
        <section className="animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
          <div className="glass-subtle rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-700">Delete Goal</p>
                <p className="text-xs text-neutral-500 mt-0.5">This cannot be undone</p>
              </div>
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
            </div>
          </div>
        </section>
      </div>

      {/* Fixed bottom action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 glass-strong border-t border-white/20">
        <div className="max-w-lg mx-auto">
          <Button 
            onClick={() => router.push(`/checkin?goal=${goalId}`)} 
            size="lg" 
            className="w-full gap-2"
          >
            <Plus className="w-5 h-5" />
            Record Check-in
          </Button>
          
          {latest_mirror && !drift_triggered && (
            <button
              onClick={() => router.push(`/mirror?goal=${goalId}`)}
              className="w-full mt-3 py-2 text-sm text-neutral-500 hover:text-teal-600 transition-colors"
            >
              View latest analysis
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
