'use client';

/**
 * DriftMirror Check-in Page
 * ============================================================
 * 
 * Minimum-action-centered check-in flow:
 * 1. "Did you do your minimum?" (prominently displayed)
 * 2. "Did you do more?" (optional)
 * 3. Friction slider
 */

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Slider } from '@/components/ui/Slider';
import { ArrowLeft, Zap, Loader2, Check, X } from 'lucide-react';
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
      : api.getLatestDashboard();
      
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
  const frictionLabels = ['Easy', 'Some effort', 'Hard'];

  return (
    <div className="min-h-screen pb-8">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        
        {/* Header */}
        <header className="flex items-center gap-4 animate-fade-in-up">
          <button
            onClick={() => router.push(goalId ? `/dashboard/${goalId}` : '/dashboard')}
            className="p-3 glass-subtle rounded-xl text-neutral-500 hover:text-teal-600 transition-all hover:-translate-y-0.5"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-neutral-800">
              Quick Check-in
            </h1>
            <p className="text-sm text-neutral-500">
              {dashboard.resolution.title}
            </p>
          </div>
        </header>

        {/* Main Card: Your Minimum Action */}
        <div className="glass-strong rounded-2xl p-6 space-y-5 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          
          {/* Minimum action display */}
          <div className="flex items-start gap-3 p-4 glass-quiet rounded-xl">
            <div className="p-2 rounded-lg bg-amber-100">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
                Your Minimum Action
              </p>
              <p className="text-neutral-800 font-medium">
                {minimumAction}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                {dashboard.resolution.min_minutes} minutes
              </p>
            </div>
          </div>

          {/* The main question */}
          <div className="text-center py-2">
            <p className="text-lg font-medium text-neutral-700">
              Did you do your minimum action today?
            </p>
          </div>

          {/* Yes / No buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDidMinimum(true)}
              className={`flex items-center justify-center gap-2 p-4 rounded-xl font-medium transition-all ${
                didMinimum === true
                  ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25'
                  : 'glass-subtle text-neutral-600 hover:bg-teal-50 hover:text-teal-600'
              }`}
            >
              <Check className="w-5 h-5" />
              Yes, I did!
            </button>
            <button
              type="button"
              onClick={() => setDidMinimum(false)}
              className={`flex items-center justify-center gap-2 p-4 rounded-xl font-medium transition-all ${
                didMinimum === false
                  ? 'bg-neutral-500 text-white shadow-lg shadow-neutral-500/25'
                  : 'glass-subtle text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <X className="w-5 h-5" />
              Not today
            </button>
          </div>

          {/* Error display */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Tell us more - required field for tracking progress over 90 days */}
        {didMinimum !== null && (
          <div className="glass-strong rounded-2xl p-6 space-y-4 animate-fade-in-up">
            <label className="block text-sm font-medium text-neutral-700">
              Tell us more about what you did
            </label>
            <textarea
              value={progressNote}
              onChange={(e) => setProgressNote(e.target.value)}
              placeholder={didMinimum 
                ? "e.g., Practiced for 30 min, focused on chord transitions..." 
                : "e.g., Got busy with work but did 2 min of stretching..."}
              maxLength={INPUT_LIMITS.ACTUAL_MAX_LENGTH}
              className="w-full h-24 bg-white/50 border border-white/60 rounded-xl p-3 text-neutral-800 placeholder:text-neutral-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              required
            />
            <p className="text-xs text-neutral-400">
              📝 This helps track your progress over 90 days and builds your habit story.
            </p>
          </div>
        )}

        {/* Friction slider - show once they've answered */}
        {didMinimum !== null && (
          <div className="glass-strong rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-neutral-700">
                How did it feel?
              </label>
              <span className="text-sm font-medium text-teal-600">
                {frictionLabels[friction - 1]}
              </span>
            </div>
            <Slider
              min={1}
              max={3}
              value={friction}
              onChange={setFriction}
              label="Friction level"
            />
            <div className="flex justify-between mt-3 text-xs text-neutral-400">
              <span>Easy</span>
              <span>Hard</span>
            </div>
          </div>
        )}

        {/* Submit button */}
        {didMinimum !== null && (
          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Button 
              onClick={handleSubmit}
              size="lg" 
              className="w-full"
              disabled={loading || !progressNote.trim()}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                'Save Check-in'
              )}
            </Button>
          </div>
        )}
      </div>
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
