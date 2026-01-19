'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { api, RealityCheckResponse, GoalContractSoFar } from '@/lib/api';

// ============================================================
// Icons (inline SVG for bubble theme)
// ============================================================
const TargetIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const HeartIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const LightningIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

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

const BOUNDARY_CHIPS = [
  'No burnout',
  'No 80-hour weeks',
  'No debt',
  'No sacrificing family/friends',
  'No losing sleep',
  'No constant stress',
  'No social media grind',
  'No complicated tech stack',
];

const STEP_CONFIG: Record<Exclude<Step, 'review'>, { 
  icon: JSX.Element; 
  prompt: string; 
  helper: string;
  placeholder?: string;
}> = {
  goal: {
    icon: <TargetIcon />,
    prompt: 'What do you want to achieve?',
    helper: 'Write it as an outcome, not a feeling.',
    placeholder: 'e.g., Run a 5K, Read 12 books this year...',
  },
  why: {
    icon: <HeartIcon />,
    prompt: 'Why does this matter to you?',
    helper: 'One honest reason — it keeps you moving when it gets hard.',
    placeholder: 'e.g., To keep up with my kids, To feel capable again...',
  },
  boundaries: {
    icon: <ShieldIcon />,
    prompt: 'What do you NOT want this goal to cost you?',
    helper: 'These are your non-negotiables.',
  },
  minimum_action: {
    icon: <LightningIcon />,
    prompt: "What's the smallest action you can do even on a bad day?",
    helper: '2–10 minutes is perfect. Start first — value comes later.',
    placeholder: 'e.g., Put on running shoes and step outside...',
  },
};

// ============================================================
// Bubble Card Component
// ============================================================
const BubbleCard = ({ 
  children, 
  className = '',
  variant = 'default' 
}: { 
  children: React.ReactNode; 
  className?: string;
  variant?: 'default' | 'highlight' | 'subtle';
}) => {
  const baseStyles = 'rounded-3xl transition-all duration-300';
  const variants = {
    default: 'bg-gradient-to-br from-white via-white to-lilac-50/50 shadow-bubble border border-lilac-100/50',
    highlight: 'bg-gradient-to-br from-lilac-50 to-lilac-100/50 shadow-bubble border border-lilac-200/50',
    subtle: 'bg-calm-50/80 border border-calm-200/50',
  };
  
  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`}>
      {/* Inner highlight for 3D effect */}
      <div className="rounded-3xl shadow-bubble-inset">
        {children}
      </div>
    </div>
  );
};

// ============================================================
// Reality Check Panel Component
// ============================================================
const RealityCheckPanel = ({
  response,
  onSelectSuggestion,
  onKeepMine,
  loading,
}: {
  response: RealityCheckResponse | null;
  onSelectSuggestion: (text: string) => void;
  onKeepMine: () => void;
  loading: boolean;
}) => {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4"
      >
        <BubbleCard variant="subtle" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-lilac-300 animate-pulse" />
            <span className="text-calm-500 text-sm">Checking clarity...</span>
          </div>
        </BubbleCard>
      </motion.div>
    );
  }

  if (!response) return null;

  if (response.status === 'ok') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4"
      >
        <BubbleCard variant="subtle" className="p-4">
          <div className="flex items-center gap-3 text-drift-600">
            <CheckIcon />
            <span className="text-sm font-medium">Looks clear and startable.</span>
          </div>
        </BubbleCard>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 space-y-3"
    >
      <BubbleCard variant="highlight" className="p-5">
        <div className="space-y-4">
          {/* Issues */}
          {response.issues.length > 0 && (
            <div>
              <p className="text-sm text-calm-600 mb-2">A few thoughts:</p>
              <ul className="space-y-1">
                {response.issues.map((issue, i) => (
                  <li key={i} className="text-sm text-calm-700 flex items-start gap-2">
                    <span className="text-lilac-400 mt-0.5">•</span>
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Rewrite Options */}
          {response.rewrite_options.length > 0 && (
            <div>
              <p className="text-sm text-calm-600 mb-2">Try this instead:</p>
              <div className="space-y-2">
                {response.rewrite_options.map((option, i) => (
                  <button
                    key={i}
                    onClick={() => onSelectSuggestion(option)}
                    className="w-full text-left p-3 rounded-2xl bg-white/80 hover:bg-white border border-lilac-200/50 hover:border-lilac-300 transition-all text-sm text-calm-700 hover:shadow-md"
                  >
                    <span className="text-lilac-500 font-medium mr-2">#{i + 1}</span>
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clarifying Questions */}
          {response.clarifying_questions.length > 0 && (
            <div className="pt-2 border-t border-lilac-200/50">
              <p className="text-xs text-calm-500 mb-1">You might also consider:</p>
              {response.clarifying_questions.map((q, i) => (
                <p key={i} className="text-sm text-calm-600 italic">{q}</p>
              ))}
            </div>
          )}

          {/* Keep Mine Button */}
          <button
            onClick={onKeepMine}
            className="text-sm text-calm-500 hover:text-calm-700 underline underline-offset-2"
          >
            Keep mine anyway →
          </button>
        </div>
      </BubbleCard>
    </motion.div>
  );
};

// ============================================================
// Main Wizard Component
// ============================================================
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('goal');
  const [loading, setLoading] = useState(false);
  const [checkLoading, setCheckLoading] = useState(false);
  const [realityResponse, setRealityResponse] = useState<RealityCheckResponse | null>(null);
  const [stepSubmitted, setStepSubmitted] = useState(false);
  
  const [contract, setContract] = useState<GoalContract>({
    goal: '',
    why: '',
    boundaries: { chips: [], custom: '' },
    minimum_action: { text: '', minutes: 10 },
  });

  // Build context for API calls
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

  // Get user input for current step
  const getUserInput = useCallback(() => {
    switch (step) {
      case 'goal': return { goal: contract.goal };
      case 'why': return { why: contract.why };
      case 'boundaries': return { chips: contract.boundaries.chips, custom: contract.boundaries.custom };
      case 'minimum_action': return { text: contract.minimum_action.text, minutes: contract.minimum_action.minutes };
      default: return {};
    }
  }, [step, contract]);

  // Proceed to next step
  const proceedToNext = useCallback(() => {
    setRealityResponse(null);
    setStepSubmitted(false);
    
    const steps: Step[] = ['goal', 'why', 'boundaries', 'minimum_action', 'review'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  }, [step]);

  // Run reality check
  const runRealityCheck = useCallback(async () => {
    if (step === 'review') return;
    
    setCheckLoading(true);
    setRealityResponse(null);
    
    try {
      const response = await api.realityCheck({
        step: step as 'goal' | 'why' | 'boundaries' | 'minimum_action',
        goal_contract_so_far: buildContext(),
        user_input: getUserInput(),
      });
      setRealityResponse(response);
      setStepSubmitted(true);
    } catch (err) {
      console.error('Reality check error:', err);
      // Allow proceed on error
      setRealityResponse({ 
        status: 'ok', 
        issues: [], 
        rewrite_options: [], 
        clarifying_questions: [],
        best_guess_refinement: null,
        confidence: 0.5,
        debug: { model_used: 'error', fallback_used: true }
      });
      setStepSubmitted(true);
    } finally {
      setCheckLoading(false);
    }
  }, [step, buildContext, getUserInput]);

  // Handle step submission
  const handleSubmitStep = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    runRealityCheck();
  }, [runRealityCheck]);

  // Handle suggestion selection
  const handleSelectSuggestion = useCallback((text: string) => {
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
    proceedToNext();
  }, [step, proceedToNext]);

  // Handle keep mine
  const handleKeepMine = useCallback(() => {
    proceedToNext();
  }, [proceedToNext]);

  // Handle continue (when status is ok)
  const handleContinue = useCallback(() => {
    proceedToNext();
  }, [proceedToNext]);

  // Toggle boundary chip
  const toggleChip = useCallback((chip: string) => {
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

  // Create resolution
  const handleCreateResolution = useCallback(async () => {
    setLoading(true);
    try {
      await api.createResolution({
        title: contract.goal,
        why: contract.why || null,
        mode: 'personal_growth',
        frequency_per_week: 3,
        min_minutes: contract.minimum_action.minutes || 10,
        time_window: 'morning',
      });
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [contract, router]);

  // Check if current step input is valid
  const isStepValid = useCallback(() => {
    switch (step) {
      case 'goal': return contract.goal.trim().length > 0;
      case 'why': return contract.why.trim().length > 0;
      case 'boundaries': return contract.boundaries.chips.length > 0 || contract.boundaries.custom.trim().length > 0;
      case 'minimum_action': return contract.minimum_action.text.trim().length > 0;
      default: return true;
    }
  }, [step, contract]);

  // Progress indicator
  const steps: Step[] = ['goal', 'why', 'boundaries', 'minimum_action', 'review'];
  const currentStepIndex = steps.indexOf(step);

  return (
    <div className="min-h-screen bg-gradient-to-br from-calm-50 via-white to-lilac-50/30 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Progress */}
        <div className="flex justify-center gap-2">
          {steps.slice(0, -1).map((s, i) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i <= currentStepIndex ? 'bg-lilac-400' : 'bg-calm-200'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step !== 'review' ? (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <BubbleCard className="p-6 md:p-8">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-lilac-100 to-lilac-200 flex items-center justify-center text-lilac-600 shadow-bubble-inset">
                    {STEP_CONFIG[step].icon}
                  </div>
                </div>

                {/* Prompt */}
                <h1 className="text-xl md:text-2xl font-semibold text-center text-calm-800 mb-2">
                  {STEP_CONFIG[step].prompt}
                </h1>

                {/* Helper with tooltip */}
                <div className="flex items-center justify-center gap-1 mb-6">
                  <p className="text-sm text-calm-500 text-center">
                    {STEP_CONFIG[step].helper}
                  </p>
                  <div className="relative group">
                    <button className="text-calm-400 hover:text-lilac-500 transition-colors">
                      <InfoIcon />
                    </button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-calm-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      Clear goals are easier to start. Value comes after you begin.
                    </div>
                  </div>
                </div>

                {/* Input */}
                <form onSubmit={handleSubmitStep}>
                  {step === 'goal' && (
                    <input
                      type="text"
                      value={contract.goal}
                      onChange={(e) => setContract(c => ({ ...c, goal: e.target.value }))}
                      placeholder={STEP_CONFIG.goal.placeholder}
                      className="w-full px-4 py-3 rounded-2xl border border-calm-200 focus:border-lilac-300 focus:ring-2 focus:ring-lilac-100 outline-none transition-all text-calm-700 placeholder:text-calm-400"
                      autoFocus
                    />
                  )}

                  {step === 'why' && (
                    <textarea
                      value={contract.why}
                      onChange={(e) => setContract(c => ({ ...c, why: e.target.value }))}
                      placeholder={STEP_CONFIG.why.placeholder}
                      rows={2}
                      className="w-full px-4 py-3 rounded-2xl border border-calm-200 focus:border-lilac-300 focus:ring-2 focus:ring-lilac-100 outline-none transition-all text-calm-700 placeholder:text-calm-400 resize-none"
                      autoFocus
                    />
                  )}

                  {step === 'boundaries' && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {BOUNDARY_CHIPS.map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => toggleChip(chip)}
                            className={`px-4 py-2 rounded-full text-sm transition-all ${
                              contract.boundaries.chips.includes(chip)
                                ? 'bg-lilac-500 text-white shadow-md'
                                : 'bg-calm-100 text-calm-600 hover:bg-calm-200'
                            }`}
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={contract.boundaries.custom}
                        onChange={(e) => setContract(c => ({ 
                          ...c, 
                          boundaries: { ...c.boundaries, custom: e.target.value }
                        }))}
                        placeholder="Or add your own..."
                        className="w-full px-4 py-3 rounded-2xl border border-calm-200 focus:border-lilac-300 focus:ring-2 focus:ring-lilac-100 outline-none transition-all text-calm-700 placeholder:text-calm-400"
                      />
                    </div>
                  )}

                  {step === 'minimum_action' && (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={contract.minimum_action.text}
                        onChange={(e) => setContract(c => ({ 
                          ...c, 
                          minimum_action: { ...c.minimum_action, text: e.target.value }
                        }))}
                        placeholder={STEP_CONFIG.minimum_action.placeholder}
                        className="w-full px-4 py-3 rounded-2xl border border-calm-200 focus:border-lilac-300 focus:ring-2 focus:ring-lilac-100 outline-none transition-all text-calm-700 placeholder:text-calm-400"
                        autoFocus
                      />
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-calm-500">Minutes:</span>
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={contract.minimum_action.minutes}
                          onChange={(e) => setContract(c => ({ 
                            ...c, 
                            minimum_action: { ...c.minimum_action, minutes: parseInt(e.target.value) || 10 }
                          }))}
                          className="w-20 px-3 py-2 rounded-xl border border-calm-200 focus:border-lilac-300 focus:ring-2 focus:ring-lilac-100 outline-none transition-all text-calm-700 text-center"
                        />
                      </div>
                    </div>
                  )}

                  {/* Submit / Continue */}
                  {!stepSubmitted && (
                    <button
                      type="submit"
                      disabled={!isStepValid() || checkLoading}
                      className="w-full mt-6 py-3 px-6 rounded-2xl bg-gradient-to-r from-lilac-500 to-lilac-600 text-white font-medium shadow-bubble hover:shadow-bubble-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {checkLoading ? 'Checking...' : 'Next'}
                    </button>
                  )}

                  {stepSubmitted && realityResponse?.status === 'ok' && (
                    <button
                      type="button"
                      onClick={handleContinue}
                      className="w-full mt-6 py-3 px-6 rounded-2xl bg-gradient-to-r from-lilac-500 to-lilac-600 text-white font-medium shadow-bubble hover:shadow-bubble-hover transition-all"
                    >
                      Continue
                    </button>
                  )}
                </form>

                {/* Reality Check Panel */}
                <RealityCheckPanel
                  response={realityResponse}
                  onSelectSuggestion={handleSelectSuggestion}
                  onKeepMine={handleKeepMine}
                  loading={checkLoading}
                />
              </BubbleCard>
            </motion.div>
          ) : (
            /* Review Step */
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <BubbleCard className="p-6 md:p-8">
                <h1 className="text-xl md:text-2xl font-semibold text-center text-calm-800 mb-6">
                  Your Goal Contract
                </h1>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-calm-50">
                    <div className="flex items-center gap-2 text-lilac-600 mb-1">
                      <TargetIcon />
                      <span className="text-sm font-medium">Goal</span>
                    </div>
                    <p className="text-calm-700">{contract.goal}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-calm-50">
                    <div className="flex items-center gap-2 text-lilac-600 mb-1">
                      <HeartIcon />
                      <span className="text-sm font-medium">Why</span>
                    </div>
                    <p className="text-calm-700">{contract.why}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-calm-50">
                    <div className="flex items-center gap-2 text-lilac-600 mb-1">
                      <ShieldIcon />
                      <span className="text-sm font-medium">Boundaries</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {contract.boundaries.chips.map((chip) => (
                        <span key={chip} className="px-3 py-1 rounded-full bg-lilac-100 text-lilac-700 text-sm">
                          {chip}
                        </span>
                      ))}
                      {contract.boundaries.custom && (
                        <span className="px-3 py-1 rounded-full bg-lilac-100 text-lilac-700 text-sm">
                          {contract.boundaries.custom}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-calm-50">
                    <div className="flex items-center gap-2 text-lilac-600 mb-1">
                      <LightningIcon />
                      <span className="text-sm font-medium">Minimum Action</span>
                    </div>
                    <p className="text-calm-700">
                      {contract.minimum_action.text}
                      <span className="text-calm-500 ml-2">
                        ({contract.minimum_action.minutes} min)
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleCreateResolution}
                  disabled={loading}
                  className="w-full mt-6 py-4 px-6 rounded-2xl bg-gradient-to-r from-lilac-500 to-lilac-600 text-white font-semibold shadow-bubble hover:shadow-bubble-hover disabled:opacity-50 transition-all"
                >
                  {loading ? 'Creating your plan...' : 'Start Now — Value Comes Later ✨'}
                </button>

                <p className="text-center text-xs text-calm-400 mt-4">
                  You can always adjust your plan later
                </p>
              </BubbleCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
