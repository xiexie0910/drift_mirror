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
 * - Actions (check-in, view analysis, delete)
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { MetricPills } from '@/components/MetricPills';
import { Timeline } from '@/components/Timeline';
import { PlanDiff } from '@/components/PlanDiff';
import { 
  ArrowLeft, Plus, ArrowRight, Sparkles, Target, 
  Trash2, Calendar, Clock, Flag 
} from 'lucide-react';
import { api, Dashboard, ApiError } from '@/lib/api';

export default function GoalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const goalId = Number(params.id);
  
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

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
        </header>

        {/* Metrics */}
        <section className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-xs font-medium text-teal-600 uppercase tracking-wider mb-4">
            Progress
          </h2>
          <MetricPills metrics={metrics} />
        </section>

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
                  <p className="text-sm text-neutral-500 mt-0.5">The system identified some drift</p>
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
          </div>
        )}

        {/* Current Plan */}
        {current_plan && (
          <section className="glass-strong rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-xs font-medium text-teal-600 uppercase tracking-wider mb-4">
              Current Plan {current_plan.version > 1 && `(v${current_plan.version})`}
            </h2>
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
            {current_plan.recovery_step && (
              <div className="glass-quiet rounded-xl p-4 mt-4">
                <span className="text-teal-600 text-sm font-medium">Suggestion:</span>
                <p className="text-sm text-neutral-600 mt-1">{current_plan.recovery_step}</p>
              </div>
            )}
          </section>
        )}

        {/* Plan Diff */}
        {current_plan && current_plan.version > 1 && (
          <div className="animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <PlanDiff
              oldPlan={{
                frequency_per_week: resolution.frequency_per_week,
                min_minutes: resolution.min_minutes,
                time_window: resolution.time_window,
              }}
              newPlan={current_plan}
            />
          </div>
        )}

        {/* Recent Check-ins */}
        <section className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-xs font-medium text-teal-600 uppercase tracking-wider mb-4">
            Recent Check-ins
          </h2>
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
