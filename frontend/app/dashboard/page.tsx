'use client';

/**
 * DriftMirror Unified Dashboard
 * ============================================================
 * 
 * Shows all goals in a unified view.
 * Users can click into any goal to see details.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Plus, Target, Trash2, Calendar, ChevronRight, Play } from 'lucide-react';
import { api, Resolution, ApiError } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<Resolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const loadGoals = useCallback(async () => {
    try {
      const resolutions = await api.getResolutions();
      setGoals(resolutions);
    } catch {
      // If API fails, just show empty state
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const handleDelete = async (e: React.MouseEvent, goalId: number) => {
    e.stopPropagation(); // Prevent navigation to detail page
    
    if (!confirm('Are you sure you want to delete this goal? All check-ins and data will be lost.')) {
      return;
    }
    
    setDeletingId(goalId);
    try {
      await api.deleteResolution(goalId);
      setGoals(prev => prev.filter(g => g.id !== goalId));
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.message);
      }
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-subtle p-6 rounded-2xl animate-pulse-soft">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <p className="text-neutral-500 text-sm">Loading goals...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 overflow-y-auto">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        
        {/* Header */}
        <header className="animate-fade-in-up">
          <h1 className="text-2xl font-semibold text-neutral-800">Your Goals</h1>
          <p className="text-neutral-500 mt-1">
            {goals.length === 0 
              ? 'Start by creating your first goal'
              : `${goals.length} goal${goals.length === 1 ? '' : 's'} tracked`
            }
          </p>
        </header>

        {/* Goals Grid */}
        {goals.length > 0 ? (
          <div className="space-y-4">
            {goals.map((goal, index) => (
              <div
                key={goal.id}
                onClick={() => router.push(`/dashboard/${goal.id}`)}
                className="glass-strong rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.02] hover:glow-teal animate-fade-in-up group"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="glass-subtle p-3 rounded-xl shrink-0 group-hover:glow-teal transition-all">
                    <Target className="w-5 h-5 text-teal-600" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-neutral-800 truncate">
                      {goal.title}
                    </h3>
                    {goal.why && (
                      <p className="text-sm text-neutral-500 mt-1 line-clamp-2">
                        {goal.why}
                      </p>
                    )}
                    
                    {/* Meta */}
                    <div className="flex items-center gap-3 mt-3 text-xs text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {goal.frequency_per_week}x/week
                      </span>
                      <span>•</span>
                      <span>{goal.min_minutes} min</span>
                      <span>•</span>
                      <span>Created {formatDate(goal.created_at)}</span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => handleDelete(e, goal.id)}
                      disabled={deletingId === goal.id}
                      className="p-2 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                      aria-label="Delete goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-teal-500 transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="glass-strong rounded-2xl p-10 text-center animate-fade-in-up">
            <div className="flex justify-center mb-6">
              <div className="glass-subtle p-4 rounded-2xl">
                <Target className="w-8 h-8 text-neutral-400" />
              </div>
            </div>
            <p className="text-neutral-700 mb-2">No goals yet</p>
            <p className="text-sm text-neutral-500 mb-6">
              Create your first goal to start tracking your progress.
            </p>
            <div className="flex flex-col gap-3 items-center">
              <Button onClick={() => router.push('/onboarding')} className="gap-2">
                <Plus className="w-4 h-4" />
                Create First Goal
              </Button>
              <button
                onClick={async () => {
                  setIsDemoLoading(true);
                  try {
                    const result = await api.seedDemo();
                    router.push(`/dashboard/${result.resolution_id}`);
                  } catch (err) {
                    console.error('Demo seed failed:', err);
                    setIsDemoLoading(false);
                  }
                }}
                disabled={isDemoLoading}
                className="px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 text-teal-600 hover:bg-teal-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDemoLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                    <span>Loading demo...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>or try a demo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom action - only show if goals exist */}
      {goals.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 glass-strong border-t border-white/20">
          <div className="max-w-lg mx-auto flex gap-3">
            <Button 
              onClick={() => router.push('/onboarding')} 
              size="lg" 
              className="flex-1 gap-2"
            >
              <Plus className="w-5 h-5" />
              New Goal
            </Button>
            <button
              onClick={async () => {
                setIsDemoLoading(true);
                try {
                  const result = await api.seedDemo();
                  router.push(`/dashboard/${result.resolution_id}`);
                } catch (err) {
                  console.error('Demo seed failed:', err);
                  setIsDemoLoading(false);
                }
              }}
              disabled={isDemoLoading}
              className="px-4 rounded-xl font-medium text-sm flex items-center gap-2 glass-subtle text-teal-700 hover:bg-teal-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDemoLoading ? (
                <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>Demo</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
