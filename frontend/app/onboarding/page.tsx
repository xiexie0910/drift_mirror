'use client';

/**
 * DriftMirror Onboarding
 * ============================================================
 * 
 * Calm Futurism Design with Glass Materials
 * Security: Input validation, sanitization, error handling
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Slider } from '@/components/ui/Slider';
import { ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { api, RealityCheckResponse, GoalContractSoFar, ApiError } from '@/lib/api';
import { 
  sanitizeText, 
  validateGoal, 
  validateWhy, 
  validateMinimumAction,
  validateBoundaries,
  INPUT_LIMITS 
} from '@/lib/validation';

// ============================================================
// Types
// ============================================================
type Step = 'goal' | 'why' | 'boundaries' | 'minimum_action' | 'review';

interface GoalContract {
  goal: string;
  why: string;
  boundaries: { chips: string[]; custom: string };
  minimum_action: { text: string; minutes: number };
}

const BOUNDARY_OPTIONS = [
  'No burnout',
  'No 80-hour weeks',
  'No debt',
  'No sacrificing relationships',
  'No losing sleep',
  'No constant stress',
];

const STEP_CONFIG: Record<Exclude<Step, 'review'>, { 
  title: string; 
  description: string;
  placeholder?: string;
}> = {
  goal: {
    title: 'What do you want to achieve?',
    description: 'State it as an outcome, not a feeling.',
    placeholder: 'e.g., Run a 5K, Read 12 books this year',
  },
  why: {
    title: 'Why does this matter?',
    description: 'One honest reason. This is for you, not the system.',
    placeholder: 'e.g., To have more energy for my family',
  },
  boundaries: {
    title: 'What should this goal NOT cost you?',
    description: 'Select your non-negotiables.',
  },
  minimum_action: {
    title: 'What is the smallest action you can do on a bad day?',
    description: '2-10 minutes is ideal. The system will adapt from here.',
    placeholder: 'e.g., Put on running shoes and step outside',
  },
};

// ============================================================
// Reality Check Panel (Glass - system observation)
// ============================================================
function RealityCheckPanel({
  response,
  loading,
  onSelectSuggestion,
  onKeepMine,
  onContinue,
}: {
  response: RealityCheckResponse | null;
  loading: boolean;
  onSelectSuggestion: (text: string) => void;
  onKeepMine: () => void;
  onContinue: () => void;
}) {
  if (loading) {
    return (
      <div className="glass-subtle rounded-xl p-5 mt-6 animate-pulse-soft">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          <p className="text-sm text-neutral-500">Analyzing your input...</p>
        </div>
      </div>
    );
  }

  if (!response) return null;

  if (response.status === 'ok') {
    return (
      <div className="glass-strong rounded-xl p-5 mt-6 space-y-4 animate-fade-in-up">
        <div className="flex items-center gap-3 text-teal-600">
          <div className="p-2 bg-teal-500/10 rounded-lg">
            <Check className="w-5 h-5" />
          </div>
          <span className="font-medium">Clear and actionable</span>
        </div>
        <Button onClick={onContinue} className="w-full gap-2">
          Continue <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="glass-strong rounded-xl p-5 mt-6 space-y-5 animate-fade-in-up">
      {/* Issues */}
      {response.issues.length > 0 && (
        <div>
          <p className="text-sm text-neutral-600 mb-3 font-medium">Consider:</p>
          <ul className="space-y-2">
            {response.issues.map((issue, i) => (
              <li key={i} className="text-sm text-neutral-700 flex items-start gap-3 glass-quiet p-3 rounded-lg">
                <span className="text-teal-500 mt-0.5">•</span>
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {response.rewrite_options.length > 0 && (
        <div>
          <p className="text-sm text-neutral-600 mb-3 font-medium">Alternatives:</p>
          <div className="space-y-2">
            {response.rewrite_options.map((option, i) => (
              <button
                key={i}
                onClick={() => onSelectSuggestion(option)}
                className="w-full text-left p-4 rounded-xl glass-subtle
                           hover:bg-white/60 hover:border-teal-200 
                           transition-all duration-300 text-sm
                           hover:shadow-lg hover:-translate-y-0.5"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onKeepMine}
        className="text-sm text-neutral-500 hover:text-teal-600 transition-colors"
      >
        Keep my original →
      </button>
    </div>
  );
}

// ============================================================
// Progress Indicator - Glass dots
// ============================================================
function ProgressIndicator({ steps, currentIndex }: { steps: string[]; currentIndex: number }) {
  return (
    <div className="flex justify-center gap-3">
      {steps.slice(0, -1).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-500 ${
            i === currentIndex
              ? 'w-10 bg-gradient-to-r from-teal-400 to-teal-500 shadow-lg shadow-teal-500/30'
              : i < currentIndex
              ? 'w-2 bg-teal-400'
              : 'w-2 bg-white/50'
          }`}
        />
      ))}
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('goal');
  const [loading, setLoading] = useState(false);
  const [checkLoading, setCheckLoading] = useState(false);
  const [realityResponse, setRealityResponse] = useState<RealityCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [contract, setContract] = useState<GoalContract>({
    goal: '',
    why: '',
    boundaries: { chips: [], custom: '' },
    minimum_action: { text: '', minutes: 10 },
  });

  const steps: Step[] = ['goal', 'why', 'boundaries', 'minimum_action', 'review'];
  const currentStepIndex = steps.indexOf(step);

  // Build context for API
  const buildContext = useCallback((): GoalContractSoFar => ({
    goal: contract.goal || null,
    why: contract.why || null,
    boundaries: contract.boundaries.chips.length > 0 || contract.boundaries.custom 
      ? { chips: contract.boundaries.chips, custom: contract.boundaries.custom || null }
      : null,
    minimum_action: contract.minimum_action.text 
      ? { text: contract.minimum_action.text, minutes: contract.minimum_action.minutes }
      : null,
  }), [contract]);

  // Get current step input
  const getUserInput = useCallback(() => {
    switch (step) {
      case 'goal': return { goal: contract.goal };
      case 'why': return { why: contract.why };
      case 'boundaries': return { chips: contract.boundaries.chips, custom: contract.boundaries.custom };
      case 'minimum_action': return { text: contract.minimum_action.text, minutes: contract.minimum_action.minutes };
      default: return {};
    }
  }, [step, contract]);

  // Go to next step
  const goNext = useCallback(() => {
    setRealityResponse(null);
    setError(null);
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) {
      setStep(steps[idx + 1]);
    }
  }, [step, steps]);

  // Go back
  const goBack = useCallback(() => {
    setRealityResponse(null);
    setError(null);
    const idx = steps.indexOf(step);
    if (idx > 0) {
      setStep(steps[idx - 1]);
    }
  }, [step, steps]);

  // Run reality check
  const runCheck = useCallback(async () => {
    if (step === 'review' || step === 'boundaries') {
      goNext();
      return;
    }
    
    setCheckLoading(true);
    setRealityResponse(null);
    
    try {
      const response = await api.realityCheck({
        step: step as 'goal' | 'why' | 'boundaries' | 'minimum_action',
        goal_contract_so_far: buildContext(),
        user_input: getUserInput(),
      });
      setRealityResponse(response);
    } catch {
      // Continue on error
      goNext();
    } finally {
      setCheckLoading(false);
    }
  }, [step, buildContext, getUserInput, goNext]);

  // Handle suggestion
  const handleSuggestion = useCallback((text: string) => {
    switch (step) {
      case 'goal':
        setContract(c => ({ ...c, goal: text }));
        break;
      case 'why':
        setContract(c => ({ ...c, why: text }));
        break;
      case 'minimum_action':
        setContract(c => ({ ...c, minimum_action: { ...c.minimum_action, text } }));
        break;
    }
    goNext();
  }, [step, goNext]);

  // Toggle boundary
  const toggleBoundary = useCallback((chip: string) => {
    setContract(c => ({
      ...c,
      boundaries: {
        ...c.boundaries,
        chips: c.boundaries.chips.includes(chip)
          ? c.boundaries.chips.filter(ch => ch !== chip)
          : [...c.boundaries.chips, chip],
      },
    }));
  }, []);

  // Create resolution - with validation and sanitization
  const handleCreate = useCallback(async () => {
    // Validate all fields before submission
    const goalValidation = validateGoal(contract.goal);
    if (!goalValidation.valid) {
      setError(goalValidation.error || 'Invalid goal');
      return;
    }

    const whyValidation = validateWhy(contract.why);
    if (!whyValidation.valid) {
      setError(whyValidation.error || 'Invalid reason');
      return;
    }

    const boundariesValidation = validateBoundaries(
      contract.boundaries.chips,
      contract.boundaries.custom
    );
    if (!boundariesValidation.valid) {
      setError(boundariesValidation.error || 'Invalid boundaries');
      return;
    }

    const actionValidation = validateMinimumAction(
      contract.minimum_action.text,
      contract.minimum_action.minutes
    );
    if (!actionValidation.valid) {
      setError(actionValidation.error || 'Invalid minimum action');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await api.createResolution({
        title: sanitizeText(contract.goal),
        why: sanitizeText(contract.why) || null,
        mode: 'personal_growth',
        frequency_per_week: 3,
        min_minutes: contract.minimum_action.minutes || 10,
        time_window: 'morning',
      });
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to create goal. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [contract, router]);

  // Check validity
  const isValid = useCallback(() => {
    switch (step) {
      case 'goal': return contract.goal.trim().length > 0;
      case 'why': return contract.why.trim().length > 0;
      case 'boundaries': return contract.boundaries.chips.length > 0 || contract.boundaries.custom.trim().length > 0;
      case 'minimum_action': return contract.minimum_action.text.trim().length > 0;
      default: return true;
    }
  }, [step, contract]);

  // Render step content
  const renderStep = () => {
    if (step === 'review') {
      return (
        <div className="space-y-8 animate-fade-in-up">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="glass-subtle p-3 rounded-xl glow-teal">
                <Sparkles className="w-6 h-6 text-teal-600" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-neutral-800">Review your setup</h1>
            <p className="text-neutral-500 mt-2">Confirm these details to begin.</p>
          </div>

          <div className="glass-strong rounded-2xl p-6 space-y-5">
            <div className="glass-quiet rounded-xl p-4">
              <p className="text-xs text-teal-600 uppercase tracking-wider font-medium">Goal</p>
              <p className="text-neutral-800 mt-2 font-medium">{contract.goal}</p>
            </div>
            
            {contract.why && (
              <div className="glass-quiet rounded-xl p-4">
                <p className="text-xs text-teal-600 uppercase tracking-wider font-medium">Why</p>
                <p className="text-neutral-700 mt-2">{contract.why}</p>
              </div>
            )}
            
            <div className="glass-quiet rounded-xl p-4">
              <p className="text-xs text-teal-600 uppercase tracking-wider font-medium">Boundaries</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {contract.boundaries.chips.map(chip => (
                  <span key={chip} className="text-sm px-3 py-1.5 glass-subtle rounded-lg text-neutral-700">
                    {chip}
                  </span>
                ))}
                {contract.boundaries.custom && (
                  <span className="text-sm px-3 py-1.5 glass-subtle rounded-lg text-neutral-700">
                    {contract.boundaries.custom}
                  </span>
                )}
              </div>
            </div>
            
            <div className="glass-quiet rounded-xl p-4">
              <p className="text-xs text-teal-600 uppercase tracking-wider font-medium">Minimum action</p>
              <p className="text-neutral-700 mt-2">
                {contract.minimum_action.text} 
                <span className="text-teal-600 ml-2 font-medium">({contract.minimum_action.minutes} min)</span>
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm">
                {error}
              </div>
            )}
            <Button onClick={handleCreate} size="lg" className="w-full" disabled={loading}>
              {loading ? 'Creating...' : 'Begin tracking'}
            </Button>
            <button
              onClick={goBack}
              className="w-full py-3 text-sm text-neutral-500 hover:text-teal-600 transition-colors"
            >
              Go back and edit
            </button>
          </div>
        </div>
      );
    }

    const config = STEP_CONFIG[step];

    return (
      <div className="space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-neutral-800">{config.title}</h1>
          <p className="text-neutral-500 mt-2">{config.description}</p>
        </div>

        {/* Input area */}
        {step === 'boundaries' ? (
          <div className="glass-strong rounded-2xl p-6 space-y-5">
            <div className="flex flex-wrap gap-2">
              {BOUNDARY_OPTIONS.map(chip => (
                <button
                  key={chip}
                  onClick={() => toggleBoundary(chip)}
                  className={`
                    px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
                    ${contract.boundaries.chips.includes(chip)
                      ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/25'
                      : 'glass-subtle text-neutral-600 hover:bg-white/60 hover:-translate-y-0.5'
                    }
                  `}
                >
                  {chip}
                </button>
              ))}
            </div>
            <Input
              value={contract.boundaries.custom}
              onChange={(e) => setContract(c => ({ 
                ...c, 
                boundaries: { ...c.boundaries, custom: e.target.value }
              }))}
              placeholder="Or add your own..."
              maxLength={INPUT_LIMITS.CUSTOM_BOUNDARY_MAX_LENGTH}
            />
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm">
                {error}
              </div>
            )}
          </div>
        ) : step === 'minimum_action' ? (
          <div className="glass-strong rounded-2xl p-6 space-y-5">
            <Input
              value={contract.minimum_action.text}
              onChange={(e) => setContract(c => ({ 
                ...c, 
                minimum_action: { ...c.minimum_action, text: e.target.value }
              }))}
              placeholder={config.placeholder}
              maxLength={INPUT_LIMITS.MINIMUM_ACTION_MAX_LENGTH}
              autoFocus
            />
            <div className="glass-quiet rounded-xl p-4">
              <div className="flex justify-between mb-3">
                <span className="text-sm text-neutral-600">Duration</span>
                <span className="text-sm font-medium text-teal-600 tabular-nums">
                  {contract.minimum_action.minutes} min
                </span>
              </div>
              <Slider
                min={2}
                max={30}
                value={contract.minimum_action.minutes}
                onChange={(v) => setContract(c => ({ 
                  ...c, 
                  minimum_action: { ...c.minimum_action, minutes: v }
                }))}
                label="Duration in minutes"
              />
            </div>
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm">
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="glass-strong rounded-2xl p-6 space-y-4">
            <Input
              value={step === 'goal' ? contract.goal : contract.why}
              onChange={(e) => setContract(c => ({ 
                ...c, 
                [step]: e.target.value 
              }))}
              placeholder={config.placeholder}
              maxLength={step === 'goal' ? INPUT_LIMITS.GOAL_MAX_LENGTH : INPUT_LIMITS.WHY_MAX_LENGTH}
              autoFocus
            />
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Reality check feedback */}
        <RealityCheckPanel
          response={realityResponse}
          loading={checkLoading}
          onSelectSuggestion={handleSuggestion}
          onKeepMine={goNext}
          onContinue={goNext}
        />

        {/* Actions */}
        {!realityResponse && !checkLoading && (
          <div className="flex gap-3">
            {currentStepIndex > 0 && (
              <Button onClick={goBack} variant="glass" className="gap-1 px-4">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <Button 
              onClick={runCheck} 
              className="flex-1 gap-2" 
              disabled={!isValid()}
            >
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full space-y-10">
        {/* Progress */}
        <ProgressIndicator steps={steps} currentIndex={currentStepIndex} />
        
        {/* Content */}
        {renderStep()}
      </div>
    </div>
  );
}
