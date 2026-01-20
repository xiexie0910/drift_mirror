'use client';

/**
 * DriftMirror Dashboard
 * ============================================================
 * 
 * Calm Futurism Design with Glass Materials
 * Security: Error handling without console exposure
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MetricPills } from '@/components/MetricPills';
import { Timeline } from '@/components/Timeline';
import { PlanDiff } from '@/components/PlanDiff';
import { Plus, ArrowRight, Sparkles, Target } from 'lucide-react';
import { api, Dashboard } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      const data = await api.getDashboard();
      setDashboard(data);
      if (!data.resolution) {
        router.push('/');
      }
    } catch {
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Loading state - elegant glass
  if (loading) {
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

  if (!dashboard?.resolution) return null;

  const { resolution, current_plan, metrics, recent_checkins, latest_mirror, drift_triggered } = dashboard;

  return (
    <div className="min-h-screen pb-40 overflow-y-auto">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-8">
        
        {/* Header with glass accent */}
        <header className="animate-fade-in-up">
          <div className="flex items-start gap-4">
            <div className="glass-subtle p-3 rounded-xl glow-teal">
              <Target className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-neutral-800">
                {resolution.title}
              </h1>
              {resolution.why && (
                <p className="text-neutral-500 mt-1">
                  {resolution.why}
                </p>
              )}
            </div>
          </div>
        </header>

        {/* Metrics - glass pills */}
        <section className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <MetricPills metrics={metrics} />
        </section>

        {/* Drift Alert - strong glass for system observation */}
        {drift_triggered && latest_mirror && (
          <div className="glass-strong rounded-2xl p-5 animate-fade-in-up glow-teal" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-500/10 rounded-lg">
                  <Sparkles className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="font-medium text-neutral-700">
                    Pattern detected
                  </p>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    The system identified some drift
                  </p>
                </div>
              </div>
              <Button
                onClick={() => router.push('/mirror')}
                variant="glass"
                size="sm"
                className="shrink-0 gap-1"
              >
                View <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Current Plan - glass surface */}
        {current_plan && (
          <div className="glass-strong rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
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
          </div>
        )}

        {/* Plan Diff - glass for system adaptation insight */}
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
              <p className="text-neutral-500">
                No check-ins recorded yet.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Fixed bottom action - glass footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 glass-strong border-t border-white/20">
        <div className="max-w-lg mx-auto">
          <Button 
            onClick={() => router.push('/checkin')} 
            size="lg" 
            className="w-full gap-2"
          >
            <Plus className="w-5 h-5" />
            Record Check-in
          </Button>
          
          {/* Secondary action */}
          {latest_mirror && !drift_triggered && (
            <button
              onClick={() => router.push('/mirror')}
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
