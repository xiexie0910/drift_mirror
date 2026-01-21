'use client';
/**
 * Onboarding Page - Single-Screen Intent Capture
 * ============================================================
 * Phase 1: Capture goal, why, boundaries, and optional minimum action
 * in one uninterrupted flow. Submit for full-payload assessment.
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, Loader2, ChevronDown, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Slider } from '@/components/ui/Slider';
import { api, ApiError } from '@/lib/api';
import { 
  sanitizeText, 
  validateGoal, 
  validateWhy, 
  INPUT_LIMITS 
} from '@/lib/validation';
import type { 
  AssessmentResponse, 
  RewriteOption, 
  QuestionnairePayload,
  ResourceDiscoveryResponse,
  CandidateAction,
} from '@/lib/api';

// ============================================================
// Boundary Chips
// ============================================================

const BOUNDARY_OPTIONS = [
  'No burnout',
  'No losing sleep',
  'No skipping family time',
  'No expensive equipment',
  'Under 30 min/day',
  'No guilt after missed days',
  'More than 10 minutes a day',
  'No major lifestyle changes',
];

// ============================================================
// Types
// ============================================================

interface FormState {
  goal: string;
  why: string;
  boundaryChips: string[];
  customBoundary: string;
  minimumAction: string;
  minimumMinutes: number;
  frequencyPerWeek: number;
}

type Phase = 'input' | 'assessing' | 'refinement' | 'discovering' | 'action_picker' | 'creating';

// ============================================================
// Assessment Feedback Panel
// ============================================================

function AssessmentPanel({
  response,
  onApplyRewrite,
  onContinue,
  onEdit,
}: {
  response: AssessmentResponse;
  onApplyRewrite: (rewrite: RewriteOption) => void;
  onContinue: () => void;
  onEdit: () => void;
}) {
  const hasIssues = response.issues.length > 0;
  const hasRewrites = response.rewrite_options.length > 0;

  // Show different UI based on status
  if (response.status === 'ok') {
    return (
      <div className="glass-strong rounded-2xl p-6 space-y-4 animate-fade-in-up">
        <div className="flex items-start gap-3">
          <div className="glass-subtle p-2 rounded-lg glow-teal">
            <Check className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h3 className="font-medium text-neutral-800">Looking good</h3>
            <p className="text-sm text-neutral-500 mt-1">
              Your goal is clear and actionable.
            </p>
          </div>
        </div>

        {/* Clarity Signals */}
        <div className="glass-quiet rounded-xl p-4 space-y-3">
          <p className="text-xs text-neutral-500 uppercase tracking-wider">Clarity Signals</p>
          <div className="grid grid-cols-2 gap-3">
            <SignalBar label="Clarity" value={response.signals.clarity} />
            <SignalBar label="Scope" value={response.signals.scope} />
            <SignalBar label="Actionability" value={response.signals.actionability} />
            <SignalBar label="Boundaries" value={response.signals.boundaries} />
          </div>
        </div>

        {response.needs_resource_discovery && (
          <div className="glass-quiet rounded-xl p-4 border border-teal-200">
            <p className="text-sm text-teal-700">
              <span className="font-medium">Next up:</span> We&apos;ll help you discover resources and find your first step.
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button onClick={onEdit} variant="glass" className="flex-1">
            Edit
          </Button>
          <Button onClick={onContinue} className="flex-1 gap-2">
            Continue <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Needs refinement
  return (
    <div className="glass-strong rounded-2xl p-6 space-y-5 animate-fade-in-up">
      <div className="flex items-start gap-3">
        <div className="glass-subtle p-2 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h3 className="font-medium text-neutral-800">Let&apos;s sharpen this</h3>
          <p className="text-sm text-neutral-500 mt-1">
            A few adjustments will help you stay on track.
          </p>
        </div>
      </div>

      {/* Issues */}
      {hasIssues && (
        <div className="space-y-2">
          {response.issues.map((issue, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-neutral-600">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              {issue}
            </div>
          ))}
        </div>
      )}

      {/* Rewrite suggestions */}
      {hasRewrites && (
        <div className="space-y-3">
          <p className="text-xs text-neutral-500 uppercase tracking-wider">Suggested refinement</p>
          {response.rewrite_options.map((rewrite, i) => (
            <button
              key={i}
              onClick={() => onApplyRewrite(rewrite)}
              className="w-full text-left glass-quiet rounded-xl p-4 hover:bg-white/60 transition-all duration-300 group"
            >
              <p className="text-xs text-teal-600 uppercase tracking-wider mb-1">
                {rewrite.field === 'goal' ? 'Goal' : rewrite.field === 'why' ? 'Why' : 'First Step'}
              </p>
              <p className="text-neutral-800 font-medium group-hover:text-teal-700 transition-colors">
                {rewrite.text}
              </p>
              {rewrite.rationale && (
                <p className="text-xs text-neutral-500 mt-2">{rewrite.rationale}</p>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Clarity Signals */}
      <div className="glass-quiet rounded-xl p-4 space-y-3">
        <p className="text-xs text-neutral-500 uppercase tracking-wider">Clarity Signals</p>
        <div className="grid grid-cols-2 gap-3">
          <SignalBar label="Clarity" value={response.signals.clarity} />
          <SignalBar label="Scope" value={response.signals.scope} />
          <SignalBar label="Actionability" value={response.signals.actionability} />
          <SignalBar label="Boundaries" value={response.signals.boundaries} />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={onEdit} variant="glass" className="flex-1">
          Edit myself
        </Button>
        <Button onClick={onContinue} className="flex-1 gap-2">
          Continue anyway <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// Signal Bar Component
// ============================================================

function SignalBar({ label, value }: { label: string; value: number }) {
  const percentage = Math.round(value * 100);
  const color = value >= 0.7 ? 'bg-teal-500' : value >= 0.4 ? 'bg-amber-400' : 'bg-rose-400';
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-neutral-600">{label}</span>
        <span className="text-neutral-400">{percentage}%</span>
      </div>
      <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================
// Action Picker Component
// ============================================================

function ActionPicker({
  discovery,
  selectedAction,
  goalTitle,
  onSelectAction,
  onContinue,
  onSkip,
}: {
  discovery: ResourceDiscoveryResponse;
  selectedAction: CandidateAction | null;
  goalTitle: string;
  onSelectAction: (action: CandidateAction) => void;
  onContinue: () => void;
  onSkip: () => void;
}) {
  const difficultyColor = (d: string) => {
    switch (d) {
      case 'easy': return 'bg-teal-100 text-teal-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'hard': return 'bg-rose-100 text-rose-700';
      default: return 'bg-neutral-100 text-neutral-700';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="glass-subtle p-3 rounded-xl glow-teal">
            <Sparkles className="w-6 h-6 text-teal-600" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-neutral-800">
          Pick your first step
        </h2>
        <p className="text-neutral-500 mt-2">
          Choose something you can do even on a bad day.
        </p>
        {/* Show the goal */}
        <div className="mt-4 glass-quiet rounded-xl px-4 py-3 inline-block">
          <p className="text-xs text-neutral-500 uppercase tracking-wider">Your Goal</p>
          <p className="text-neutral-800 font-medium mt-1">{goalTitle}</p>
        </div>
      </div>

      {/* Candidate Actions */}
      <div className="glass-strong rounded-2xl p-5 space-y-3">
        <p className="text-xs text-teal-600 uppercase tracking-wider font-medium">
          Minimum Actions
        </p>
        <div className="space-y-2">
          {discovery.candidate_actions.map((action, i) => (
            <button
              key={i}
              onClick={() => onSelectAction(action)}
              className={`
                w-full text-left p-4 rounded-xl transition-all duration-300
                ${selectedAction?.text === action.text
                  ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg'
                  : 'glass-quiet hover:bg-white/60 hover:-translate-y-0.5'
                }
              `}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className={`font-medium ${selectedAction?.text === action.text ? 'text-white' : 'text-neutral-800'}`}>
                    {action.text}
                  </p>
                  {action.rationale && (
                    <p className={`text-xs mt-1 ${selectedAction?.text === action.text ? 'text-white/80' : 'text-neutral-500'}`}>
                      {action.rationale}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    selectedAction?.text === action.text ? 'bg-white/20 text-white' : difficultyColor(action.difficulty)
                  }`}>
                    {action.difficulty}
                  </span>
                  <span className={`text-xs font-medium tabular-nums ${
                    selectedAction?.text === action.text ? 'text-white' : 'text-teal-600'
                  }`}>
                    {action.minutes}m
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={onSkip} variant="glass" className="flex-1">
          Skip for now
        </Button>
        <Button 
          onClick={onContinue} 
          className="flex-1 gap-2"
          disabled={!selectedAction}
        >
          Continue <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function OnboardingPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('input');
  const [assessment, setAssessment] = useState<AssessmentResponse | null>(null);
  const [discovery, setDiscovery] = useState<ResourceDiscoveryResponse | null>(null);
  const [selectedAction, setSelectedAction] = useState<CandidateAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showOptionalSection, setShowOptionalSection] = useState(false);

  const [form, setForm] = useState<FormState>({
    goal: '',
    why: '',
    boundaryChips: [],
    customBoundary: '',
    minimumAction: '',
    minimumMinutes: 10,
    frequencyPerWeek: 3,
  });

  // Toggle boundary chip
  const toggleBoundary = useCallback((chip: string) => {
    setForm(f => ({
      ...f,
      boundaryChips: f.boundaryChips.includes(chip)
        ? f.boundaryChips.filter(c => c !== chip)
        : [...f.boundaryChips, chip],
    }));
  }, []);

  // Build payload for assessment
  const buildPayload = useCallback((): QuestionnairePayload => ({
    goal: sanitizeText(form.goal),
    why: sanitizeText(form.why),
    boundaries: {
      chips: form.boundaryChips,
      custom: form.customBoundary.trim() || null,
    },
    minimum_action: form.minimumAction.trim()
      ? { text: sanitizeText(form.minimumAction), minutes: form.minimumMinutes }
      : null,
  }), [form]);

  // Check if form is valid for submission
  const isFormValid = useCallback(() => {
    const goalValid = validateGoal(form.goal).valid;
    const whyValid = validateWhy(form.why).valid;
    const hasBoundary = form.boundaryChips.length > 0 || form.customBoundary.trim().length > 0;
    return goalValid && whyValid && hasBoundary;
  }, [form]);

  // Submit for assessment
  const handleSubmit = useCallback(async () => {
    // Validate
    const goalValidation = validateGoal(form.goal);
    if (!goalValidation.valid) {
      setError(goalValidation.error || 'Invalid goal');
      return;
    }
    const whyValidation = validateWhy(form.why);
    if (!whyValidation.valid) {
      setError(whyValidation.error || 'Invalid reason');
      return;
    }
    if (form.boundaryChips.length === 0 && !form.customBoundary.trim()) {
      setError('Select at least one boundary');
      return;
    }

    setPhase('assessing');
    setError(null);

    try {
      const response = await api.assessQuestionnaire({
        payload: buildPayload(),
      });
      setAssessment(response);
      setPhase('refinement');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Assessment failed. Please try again.');
      }
      setPhase('input');
    }
  }, [form, buildPayload]);

  // Create the resolution - defined early so other callbacks can use it
  const createResolution = useCallback(async () => {
    setPhase('creating');
    setError(null);

    try {
      // Use selected action if available, otherwise use form values
      const actionMinutes = selectedAction?.minutes || form.minimumMinutes || 10;
      
      await api.createResolution({
        title: sanitizeText(form.goal),
        why: sanitizeText(form.why) || null,
        mode: 'personal_growth',
        frequency_per_week: form.frequencyPerWeek,
        min_minutes: actionMinutes,
        time_window: 'morning',
      });
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to create goal. Please try again.');
      }
      setPhase(discovery ? 'action_picker' : 'refinement');
    }
  }, [form, router, selectedAction, discovery]);

  // Apply a suggested rewrite and continue directly (skip back to edit)
  const applyRewrite = useCallback(async (rewrite: RewriteOption) => {
    // Update form with the refined value
    const updatedForm = { ...form };
    if (rewrite.field === 'goal') {
      updatedForm.goal = rewrite.text;
    } else if (rewrite.field === 'why') {
      updatedForm.why = rewrite.text;
    } else if (rewrite.field === 'minimum_action') {
      updatedForm.minimumAction = rewrite.text;
    }
    setForm(updatedForm);
    
    // The refinement should give us better clarity - proceed directly
    // Check if we need resource discovery
    if (assessment?.needs_resource_discovery && !discovery && !updatedForm.minimumAction.trim()) {
      setPhase('discovering');
      setError(null);
      
      try {
        const payload: QuestionnairePayload = {
          goal: sanitizeText(updatedForm.goal),
          why: sanitizeText(updatedForm.why),
          boundaries: {
            chips: updatedForm.boundaryChips,
            custom: updatedForm.customBoundary.trim() || null,
          },
          minimum_action: updatedForm.minimumAction.trim()
            ? { text: sanitizeText(updatedForm.minimumAction), minutes: updatedForm.minimumMinutes }
            : null,
        };
        
        const discoveryResponse = await api.discoverResources({
          payload,
          goal_type: assessment.goal_type,
        });
        setDiscovery(discoveryResponse);
        if (discoveryResponse.recommended_action) {
          setSelectedAction(discoveryResponse.recommended_action);
        }
        setPhase('action_picker');
      } catch (err) {
        // If discovery fails, go straight to create
        await createResolution();
      }
    } else {
      // No discovery needed, create directly
      await createResolution();
    }
  }, [form, assessment, discovery, createResolution]);

  // Continue from assessment - check if resource discovery needed
  const handleContinue = useCallback(async () => {
    // If resource discovery is needed and we haven't done it yet
    if (assessment?.needs_resource_discovery && !discovery && !form.minimumAction.trim()) {
      setPhase('discovering');
      setError(null);
      
      try {
        const discoveryResponse = await api.discoverResources({
          payload: buildPayload(),
          goal_type: assessment.goal_type,
        });
        setDiscovery(discoveryResponse);
        // Pre-select recommended action if available
        if (discoveryResponse.recommended_action) {
          setSelectedAction(discoveryResponse.recommended_action);
        }
        setPhase('action_picker');
      } catch (err) {
        // If discovery fails, just continue to create
        await createResolution();
      }
      return;
    }
    
    // Otherwise, go straight to creation
    await createResolution();
  }, [assessment, discovery, form, buildPayload, createResolution]);

  // Skip action picker and create without minimum action
  const handleSkipActionPicker = useCallback(async () => {
    await createResolution();
  }, [createResolution]);

  // Go back to editing
  const handleEdit = useCallback(() => {
    setPhase('input');
    setAssessment(null);
    setDiscovery(null);
    setSelectedAction(null);
  }, []);

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full space-y-8">
        
        {/* Header - only show during input phase */}
        {phase === 'input' && (
          <div className="text-center animate-fade-in-up">
            <div className="flex justify-center mb-4">
              <div className="glass-subtle p-3 rounded-xl glow-teal">
                <Sparkles className="w-6 h-6 text-teal-600" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-neutral-800">
              Set your intention
            </h1>
            <p className="text-neutral-500 mt-2">
              Answer a few questions to clarify what you want.
            </p>
          </div>
        )}

        {/* Assessment Phase */}
        {phase === 'assessing' && (
          <div className="glass-strong rounded-2xl p-8 flex items-center justify-center animate-fade-in-up">
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
              <p className="text-neutral-600">Analyzing your goal...</p>
            </div>
          </div>
        )}

        {/* Refinement Phase */}
        {phase === 'refinement' && assessment && (
          <AssessmentPanel
            response={assessment}
            onApplyRewrite={applyRewrite}
            onContinue={handleContinue}
            onEdit={handleEdit}
          />
        )}

        {/* Discovering Phase */}
        {phase === 'discovering' && (
          <div className="glass-strong rounded-2xl p-8 flex items-center justify-center animate-fade-in-up">
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
              <p className="text-neutral-600">Finding resources and first steps...</p>
            </div>
          </div>
        )}

        {/* Action Picker Phase */}
        {phase === 'action_picker' && discovery && (
          <ActionPicker
            discovery={discovery}
            selectedAction={selectedAction}
            goalTitle={form.goal}
            onSelectAction={setSelectedAction}
            onContinue={createResolution}
            onSkip={handleSkipActionPicker}
          />
        )}

        {/* Creating Phase */}
        {phase === 'creating' && (
          <div className="glass-strong rounded-2xl p-8 flex items-center justify-center animate-fade-in-up">
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
              <p className="text-neutral-600">Creating your goal...</p>
            </div>
          </div>
        )}

        {/* Input Phase */}
        {phase === 'input' && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Question 1: Goal */}
            <div className="glass-strong rounded-2xl p-6 space-y-3">
              <label className="block">
                <span className="text-xs text-teal-600 uppercase tracking-wider font-medium">
                  1. Your Goal
                </span>
                <p className="text-neutral-800 font-medium mt-1 mb-3">
                  What do you want to be true in the next few months?
                </p>
                <Input
                  value={form.goal}
                  onChange={(e) => setForm(f => ({ ...f, goal: e.target.value }))}
                  placeholder="e.g., Run 3 times a week consistently"
                  maxLength={INPUT_LIMITS.GOAL_MAX_LENGTH}
                />
              </label>
            </div>

            {/* Question 2: Why */}
            <div className="glass-strong rounded-2xl p-6 space-y-3">
              <label className="block">
                <span className="text-xs text-teal-600 uppercase tracking-wider font-medium">
                  2. Your Why
                </span>
                <p className="text-neutral-800 font-medium mt-1 mb-3">
                  Why does this matter now?
                </p>
                <Input
                  value={form.why}
                  onChange={(e) => setForm(f => ({ ...f, why: e.target.value }))}
                  placeholder="e.g., So I can keep up with my kids and feel energized"
                  maxLength={INPUT_LIMITS.WHY_MAX_LENGTH}
                />
              </label>
            </div>

            {/* Question 3: Boundaries */}
            <div className="glass-strong rounded-2xl p-6 space-y-4">
              <div>
                <span className="text-xs text-teal-600 uppercase tracking-wider font-medium">
                  3. Your Boundaries
                </span>
                <p className="text-neutral-800 font-medium mt-1 mb-3">
                  What must this not cost you?
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {BOUNDARY_OPTIONS.map(chip => (
                  <button
                    key={chip}
                    onClick={() => toggleBoundary(chip)}
                    className={`
                      px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
                      ${form.boundaryChips.includes(chip)
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
                value={form.customBoundary}
                onChange={(e) => setForm(f => ({ ...f, customBoundary: e.target.value }))}
                placeholder="Or add your own boundary..."
                maxLength={INPUT_LIMITS.CUSTOM_BOUNDARY_MAX_LENGTH}
              />
            </div>

            {/* Question 4: Frequency */}
            <div className="glass-strong rounded-2xl p-6 space-y-4">
              <div>
                <span className="text-xs text-teal-600 uppercase tracking-wider font-medium">
                  4. Frequency
                </span>
                <p className="text-neutral-800 font-medium mt-1 mb-3">
                  How often do you want to work on this?
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map(freq => (
                  <button
                    key={freq}
                    onClick={() => setForm(f => ({ ...f, frequencyPerWeek: freq }))}
                    className={`
                      px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
                      ${form.frequencyPerWeek === freq
                        ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/25'
                        : 'glass-subtle text-neutral-600 hover:bg-white/60 hover:-translate-y-0.5'
                      }
                    `}
                  >
                    {freq}x / week
                  </button>
                ))}
              </div>
            </div>

            {/* Question 5: Optional Minimum Action */}
            <div className="glass-strong rounded-2xl overflow-hidden">
              <button
                onClick={() => setShowOptionalSection(!showOptionalSection)}
                className="w-full p-6 flex items-center justify-between text-left hover:bg-white/30 transition-colors"
              >
                <div>
                  <span className="text-xs text-neutral-400 uppercase tracking-wider font-medium">
                    5. First Step (Optional)
                  </span>
                  <p className="text-neutral-600 mt-1">
                    If you already know a tiny first step, add it. If not, we&apos;ll help you find one.
                  </p>
                </div>
                <ChevronDown 
                  className={`w-5 h-5 text-neutral-400 transition-transform duration-300 ${
                    showOptionalSection ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              
              {showOptionalSection && (
                <div className="px-6 pb-6 space-y-4 animate-fade-in-up">
                  <Input
                    value={form.minimumAction}
                    onChange={(e) => setForm(f => ({ ...f, minimumAction: e.target.value }))}
                    placeholder="e.g., Put on running shoes and step outside"
                    maxLength={INPUT_LIMITS.MINIMUM_ACTION_MAX_LENGTH}
                  />
                  <div className="glass-quiet rounded-xl p-4">
                    <div className="flex justify-between mb-3">
                      <span className="text-sm text-neutral-600">How long?</span>
                      <span className="text-sm font-medium text-teal-600 tabular-nums">
                        {form.minimumMinutes} min
                      </span>
                    </div>
                    <Slider
                      min={2}
                      max={30}
                      value={form.minimumMinutes}
                      onChange={(v) => setForm(f => ({ ...f, minimumMinutes: v }))}
                      label="Duration in minutes"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm animate-fade-in-up">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              size="lg"
              className="w-full gap-2"
              disabled={!isFormValid()}
            >
              Check my goal <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
