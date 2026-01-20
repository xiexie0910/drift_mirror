'use client';

/**
 * DriftMirror Check-in Page
 * ============================================================
 * 
 * Calm Futurism Design with Glass Materials
 * Security: Input validation, sanitization, error handling
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Slider } from '@/components/ui/Slider';
import { Toggle } from '@/components/ui/Toggle';
import { ArrowLeft, PenLine } from 'lucide-react';
import { api, Dashboard, ApiError } from '@/lib/api';
import { sanitizeText, validateCheckinForm, INPUT_LIMITS } from '@/lib/validation';

export default function CheckinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const goalId = searchParams.get('goal');
  
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    planned: '',
    actual: '',
    blocker: '',
    completed: false,
    friction: 2,
  });

  useEffect(() => {
    // If goal ID is provided, load that specific goal's dashboard
    // Otherwise, fall back to latest resolution
    const loadDashboard = goalId 
      ? api.getDashboardForResolution(Number(goalId))
      : api.getDashboard();
      
    loadDashboard
      .then(setDashboard)
      .catch(() => router.push('/dashboard'));
  }, [router, goalId]);

  // Sanitize input on change
  const handleInputChange = useCallback((field: 'planned' | 'actual' | 'blocker', value: string) => {
    // Only sanitize on submit, allow typing freely
    setForm(prev => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashboard?.resolution) return;

    // Validate and sanitize
    const sanitizedForm = {
      planned: sanitizeText(form.planned),
      actual: sanitizeText(form.actual),
      blocker: sanitizeText(form.blocker),
      friction: form.friction,
    };

    const validation = validateCheckinForm(sanitizedForm);
    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0];
      setError(firstError);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await api.createCheckin({
        resolution_id: dashboard.resolution.id,
        planned: sanitizedForm.planned,
        actual: sanitizedForm.actual,
        blocker: sanitizedForm.blocker || undefined,
        completed: form.completed,
        friction: form.friction,
      });
      // Navigate back to goal detail if we have a goal ID, otherwise dashboard
      const returnPath = goalId ? `/dashboard/${goalId}` : '/dashboard';
      router.push(returnPath);
    } catch (err) {
      // Show user-friendly error, don't expose internals
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

  const frictionLabels = ['Low', 'Medium', 'High'];

  return (
    <div className="min-h-screen pb-8">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-8">
        
        {/* Header with back navigation */}
        <header className="flex items-center gap-4 animate-fade-in-up">
          <button
            onClick={() => router.push(goalId ? `/dashboard/${goalId}` : '/dashboard')}
            className="p-3 glass-subtle rounded-xl text-neutral-500 hover:text-teal-600 transition-all hover:-translate-y-0.5"
            aria-label="Back to goal"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="glass-subtle p-2.5 rounded-xl glow-teal">
              <PenLine className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-neutral-800">
                Check-in
              </h1>
              <p className="text-sm text-neutral-500">
                {dashboard.resolution.title}
              </p>
            </div>
          </div>
        </header>

        {/* Check-in form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* What happened section */}
          <div className="glass-strong rounded-2xl p-6 space-y-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div>
              <label 
                htmlFor="planned"
                className="block text-sm font-medium text-teal-600 mb-3"
              >
                What did you plan to do?
              </label>
              <Input
                id="planned"
                value={form.planned}
                onChange={(e) => handleInputChange('planned', e.target.value)}
                placeholder="e.g., Complete one lesson"
                maxLength={INPUT_LIMITS.PLANNED_MAX_LENGTH}
                required
                autoFocus
              />
            </div>

            <div>
              <label 
                htmlFor="actual"
                className="block text-sm font-medium text-teal-600 mb-3"
              >
                What actually happened?
              </label>
              <Input
                id="actual"
                value={form.actual}
                onChange={(e) => handleInputChange('actual', e.target.value)}
                placeholder="e.g., Did half, then stopped"
                maxLength={INPUT_LIMITS.ACTUAL_MAX_LENGTH}
                required
              />
            </div>

            <div>
              <label 
                htmlFor="blocker"
                className="block text-sm font-medium text-neutral-500 mb-3"
              >
                Any blockers? <span className="text-neutral-400 font-normal">(optional)</span>
              </label>
              <Input
                id="blocker"
                value={form.blocker}
                onChange={(e) => handleInputChange('blocker', e.target.value)}
                placeholder="e.g., Was interrupted"
                maxLength={INPUT_LIMITS.BLOCKER_MAX_LENGTH}
                variant="glass"
              />
            </div>
            
            {/* Error display */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Completion and friction */}
          <div className="glass-strong rounded-2xl p-6 space-y-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between glass-quiet rounded-xl p-4">
              <label 
                htmlFor="completed"
                className="text-sm font-medium text-neutral-700"
              >
                Did you complete it?
              </label>
              <Toggle
                checked={form.completed}
                onChange={(v) => setForm({ ...form, completed: v })}
                label="Completed"
              />
            </div>

            <div className="glass-quiet rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-neutral-700">
                  How much friction did you feel?
                </label>
                <span className="text-sm font-medium text-teal-600 tabular-nums">
                  {frictionLabels[form.friction - 1]}
                </span>
              </div>
              <Slider
                min={1}
                max={3}
                value={form.friction}
                onChange={(v) => setForm({ ...form, friction: v })}
                label="Friction level"
              />
              <div className="flex justify-between mt-3 text-xs text-neutral-400">
                <span>Easy</span>
                <span>Challenging</span>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Button 
              type="submit" 
              size="lg" 
              className="w-full"
              disabled={loading || !form.planned || !form.actual}
            >
              {loading ? 'Saving...' : 'Save Check-in'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
