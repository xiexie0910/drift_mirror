'use client';
/**
 * Onboarding Page - Two-Phase Intent Capture
 * ============================================================
 * Award-winning design with:
 * - Step-by-step animations
 * - Interactive chip selection
 * - Smooth phase transitions
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Loader2, AlertCircle, Check, Zap, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
  MinimumActionOption,
  AccountabilitySuggestion,
  OnboardingAgentResponse,
} from '@/lib/api';

// ============================================================
// Boundary Chips - Covering common goal types
// ============================================================

const BOUNDARY_OPTIONS = [
  // Time boundaries
  'Max 30 min/day',
  'Max 1 hour/day',
  'Weekdays only',
  'Weekends only',
  // Energy/health boundaries
  'Skip when sick',
  'No late nights',
  'Rest days allowed',
  // Resource boundaries
  'No extra cost',
  'Use what I have',
  // Lifestyle boundaries
  'Fits my schedule',
  'No social pressure',
  'Can do at home',
];

// ============================================================
// Types
// ============================================================

interface FormState {
  goal: string;
  why: string;
  boundaryChips: string[];
  customBoundary: string;
  frequencyPerWeek: number;
  // Phase 2 selections
  selectedMinimumAction: MinimumActionOption | null;
  selectedAccountability: AccountabilitySuggestion | null;
  customAccountability: string;
}

type Phase = 'input' | 'assessing' | 'refinement' | 'generating-options' | 'select-options' | 'creating';

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
// Main Component
// ============================================================

export default function OnboardingPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('input');
  const [assessment, setAssessment] = useState<AssessmentResponse | null>(null);
  const [agentBResponse, setAgentBResponse] = useState<OnboardingAgentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    goal: '',
    why: '',
    boundaryChips: [],
    customBoundary: '',
    frequencyPerWeek: 3,
    // Phase 2 selections
    selectedMinimumAction: null,
    selectedAccountability: null,
    customAccountability: '',
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
    minimum_action: null, // Will be selected in phase 2
  }), [form]);

  // Check if form is valid for submission
  const isFormValid = useCallback(() => {
    const goalValid = validateGoal(form.goal).valid;
    const whyValid = validateWhy(form.why).valid;
    const hasBoundary = form.boundaryChips.length > 0 || form.customBoundary.trim().length > 0;
    return goalValid && whyValid && hasBoundary;
  }, [form]);

  // Submit for assessment (Agent A)
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
      const response = await api.assessQuestionnaire({ payload: buildPayload() });
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

  // Generate options with Agent B
  const generateOptions = useCallback(async () => {
    setPhase('generating-options');
    setError(null);

    try {
      const response = await api.generateOnboardingOptions({
        goal: sanitizeText(form.goal),
        why: sanitizeText(form.why),
        boundaries: form.boundaryChips,
        frequency: form.frequencyPerWeek,
      });
      setAgentBResponse(response);
      setPhase('select-options');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to generate options. Please try again.');
      }
      setPhase('refinement');
    }
  }, [form]);

  // Create the resolution
  const createResolution = useCallback(async () => {
    if (!form.selectedMinimumAction) {
      setError('Please select a minimum action');
      return;
    }
    
    setPhase('creating');
    setError(null);

    // Get accountability text
    const accountabilityText = form.selectedAccountability?.text || form.customAccountability.trim() || null;

    try {
      await api.createResolution({
        title: sanitizeText(form.goal),
        why: sanitizeText(form.why) || null,
        mode: 'personal_growth',
        frequency_per_week: form.frequencyPerWeek,
        min_minutes: form.selectedMinimumAction.minutes,
        minimum_action_text: form.selectedMinimumAction.text,
      });
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to create goal. Please try again.');
      }
      setPhase('select-options');
    }
  }, [form, router]);

  // Apply a suggested rewrite and continue to Agent B
  const applyRewrite = useCallback(async (rewrite: RewriteOption) => {
    // Update form with the refined value
    const updatedForm = { ...form };
    if (rewrite.field === 'goal') {
      updatedForm.goal = rewrite.text;
    } else if (rewrite.field === 'why') {
      updatedForm.why = rewrite.text;
    }
    setForm(updatedForm);
    
    // Generate options with Agent B
    setPhase('generating-options');
    setError(null);

    try {
      const response = await api.generateOnboardingOptions({
        goal: sanitizeText(updatedForm.goal),
        why: sanitizeText(updatedForm.why),
        boundaries: updatedForm.boundaryChips,
        frequency: updatedForm.frequencyPerWeek,
      });
      setAgentBResponse(response);
      setPhase('select-options');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to generate options. Please try again.');
      }
      setPhase('refinement');
    }
  }, [form]);

  // Continue from assessment to Agent B
  const handleContinue = useCallback(async () => {
    await generateOptions();
  }, [generateOptions]);

  // Go back to editing
  const handleEdit = useCallback(() => {
    setPhase('input');
    setAssessment(null);
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
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Question 1: Goal */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 24 }}
              className="glass-strong rounded-2xl p-6 space-y-3"
            >
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
            </motion.div>

            {/* Question 2: Why */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 24 }}
              className="glass-strong rounded-2xl p-6 space-y-3"
            >
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
            </motion.div>

            {/* Question 3: Boundaries */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 24 }}
              className="glass-strong rounded-2xl p-6 space-y-4"
            >
              <div>
                <span className="text-xs text-teal-600 uppercase tracking-wider font-medium">
                  3. Your Boundaries
                </span>
                <p className="text-neutral-800 font-medium mt-1 mb-3">
                  What must this not cost you?
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {BOUNDARY_OPTIONS.map((chip, index) => (
                  <motion.button
                    key={chip}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.35 + index * 0.02 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleBoundary(chip)}
                    className={`
                      px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
                      ${form.boundaryChips.includes(chip)
                        ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/25'
                        : 'glass-subtle text-neutral-600 hover:bg-white/60'
                      }
                    `}
                  >
                    {chip}
                  </motion.button>
                ))}
              </div>
              <Input
                value={form.customBoundary}
                onChange={(e) => setForm(f => ({ ...f, customBoundary: e.target.value }))}
                placeholder="Or add your own boundary..."
                maxLength={INPUT_LIMITS.CUSTOM_BOUNDARY_MAX_LENGTH}
              />
            </motion.div>

            {/* Question 4: Frequency */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 24 }}
              className="glass-strong rounded-2xl p-6 space-y-4"
            >
              <div>
                <span className="text-xs text-teal-600 uppercase tracking-wider font-medium">
                  4. Frequency
                </span>
                <p className="text-neutral-800 font-medium mt-1 mb-3">
                  How often do you want to work on this?
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map((freq, index) => (
                  <motion.button
                    key={freq}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.45 + index * 0.03 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setForm(f => ({ ...f, frequencyPerWeek: freq }))}
                    className={`
                      px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
                      ${form.frequencyPerWeek === freq
                        ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/25'
                        : 'glass-subtle text-neutral-600 hover:bg-white/60'
                      }
                    `}
                  >
                    {freq}x / week
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={!isFormValid()}
                className={`
                  w-full py-4 px-6 rounded-2xl font-semibold text-lg
                  flex items-center justify-center gap-2
                  transition-all duration-200
                  ${!isFormValid()
                    ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-xl shadow-teal-500/30 hover:shadow-2xl hover:shadow-teal-500/40'
                  }
                `}
              >
                Check my goal <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          </motion.div>
        )}

        {/* Generating Options Phase */}
        {phase === 'generating-options' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-strong rounded-2xl p-8 flex items-center justify-center"
          >
            <div className="text-center space-y-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-10 h-10 text-teal-600 mx-auto" />
              </motion.div>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-neutral-700 font-medium"
              >
                Generating personalized options...
              </motion.p>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm text-neutral-400"
              >
                Creating your minimum actions and accountability suggestions
              </motion.p>
            </div>
          </motion.div>
        )}

        {/* Select Options Phase (Agent B results) */}
        {phase === 'select-options' && agentBResponse && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring' }}
                className="flex justify-center mb-4"
              >
                <div className="glass-subtle p-3 rounded-xl glow-teal">
                  <Zap className="w-6 h-6 text-teal-600" />
                </div>
              </motion.div>
              <h1 className="text-2xl font-semibold text-neutral-800">
                Personalize your approach
              </h1>
              <p className="text-neutral-500 mt-2">
                Choose what works best for you.
              </p>
            </motion.div>

            {/* Minimum Action Selection */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-strong rounded-2xl p-6 space-y-4"
            >
              <div>
                <span className="text-xs text-teal-600 uppercase tracking-wider font-medium">
                  5. Your Minimum Action
                </span>
                <p className="text-neutral-800 font-medium mt-1 mb-1">
                  What&apos;s the smallest step you can do on your worst day?
                </p>
                <p className="text-sm text-neutral-500 mb-4">
                  Select one of these AI-generated options—even 2 minutes counts.
                </p>
              </div>
              <div className="space-y-3">
                {agentBResponse.minimum_actions.map((action, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.05 }}
                    whileHover={{ scale: 1.01, x: 4 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setForm(f => ({ ...f, selectedMinimumAction: action }))}
                    className={`
                      w-full text-left p-4 rounded-xl transition-colors
                      ${form.selectedMinimumAction?.text === action.text
                        ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/25'
                        : 'glass-subtle hover:bg-white/60'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className={`font-medium ${form.selectedMinimumAction?.text === action.text ? 'text-white' : 'text-neutral-800'}`}>
                          {action.text}
                        </p>
                        <p className={`text-sm mt-1 ${form.selectedMinimumAction?.text === action.text ? 'text-white/80' : 'text-neutral-500'}`}>
                          {action.rationale}
                        </p>
                      </div>
                      <span className={`text-sm font-medium shrink-0 ${form.selectedMinimumAction?.text === action.text ? 'text-white/90' : 'text-teal-600'}`}>
                        {action.minutes} min
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Accountability Selection */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-strong rounded-2xl p-6 space-y-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-600" />
                  <span className="text-xs text-teal-600 uppercase tracking-wider font-medium">
                    6. Accountability
                  </span>
                </div>
                <p className="text-neutral-800 font-medium mt-1 mb-1">
                  How can you keep yourself accountable?
                </p>
                <p className="text-sm text-neutral-500 mb-4">
                  Choose a strategy that fits your style.
                </p>
              </div>
              <div className="space-y-3">
                {agentBResponse.accountability_suggestions.map((suggestion, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.05 }}
                    whileHover={{ scale: 1.01, x: 4 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setForm(f => ({ ...f, selectedAccountability: suggestion, customAccountability: '' }))}
                    className={`
                      w-full text-left p-4 rounded-xl transition-colors
                      ${form.selectedAccountability?.text === suggestion.text
                        ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/25'
                        : 'glass-subtle hover:bg-white/60'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <p className={`font-medium ${form.selectedAccountability?.text === suggestion.text ? 'text-white' : 'text-neutral-800'}`}>
                          {suggestion.text}
                        </p>
                        <p className={`text-sm mt-1 ${form.selectedAccountability?.text === suggestion.text ? 'text-white/80' : 'text-neutral-500'}`}>
                          {suggestion.rationale}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-lg shrink-0 ${form.selectedAccountability?.text === suggestion.text ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'}`}>
                        {suggestion.type}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
              
              {/* Custom option */}
              <div className="pt-3 border-t border-white/30">
                <p className="text-sm text-neutral-500 mb-2">Or write your own:</p>
                <Input
                  value={form.customAccountability}
                  onChange={(e) => setForm(f => ({ ...f, customAccountability: e.target.value, selectedAccountability: null }))}
                  placeholder="e.g., I'll update my journal every Sunday"
                  maxLength={200}
                />
              </div>
            </motion.div>

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Create Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={createResolution}
                disabled={!form.selectedMinimumAction}
                className={`
                  w-full py-4 px-6 rounded-2xl font-semibold text-lg
                  flex items-center justify-center gap-2
                  transition-all duration-200
                  ${!form.selectedMinimumAction
                    ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-xl shadow-teal-500/30 hover:shadow-2xl hover:shadow-teal-500/40'
                  }
                `}
              >
                Create my goal <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
