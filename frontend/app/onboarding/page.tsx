'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { api, RealityCheckResponse, GoalContractSoFar } from '@/lib/api';

// ============================================================
// Animation Variants - FULL SCREEN DRAMATIC
// ============================================================
const pageVariants = {
  initial: { 
    opacity: 0, 
    scale: 0.8, 
    y: 100,
    rotateX: 15,
    filter: 'blur(10px)'
  },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    rotateX: 0,
    filter: 'blur(0px)',
    transition: { 
      duration: 0.8, 
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.15
    }
  },
  exit: { 
    opacity: 0, 
    scale: 1.1,
    y: -100,
    rotateX: -15,
    filter: 'blur(10px)',
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

const backgroundVariants = {
  goal: { 
    background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 30%, #e9d5ff 60%, #faf5ff 100%)',
  },
  why: { 
    background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 30%, #fbcfe8 60%, #fdf2f8 100%)',
  },
  boundaries: { 
    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 30%, #bbf7d0 60%, #f0fdf4 100%)',
  },
  minimum_action: { 
    background: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 30%, #fef08a 60%, #fefce8 100%)',
  },
  review: { 
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 30%, #bae6fd 60%, #f0f9ff 100%)',
  },
};

const iconVariants = {
  initial: { scale: 0, rotate: -360, opacity: 0 },
  animate: { 
    scale: 1, 
    rotate: 0,
    opacity: 1,
    transition: { 
      type: 'spring', 
      stiffness: 150, 
      damping: 12,
      delay: 0.3
    }
  },
  hover: { 
    scale: 1.2, 
    rotate: [0, -15, 15, -10, 10, 0],
    transition: { duration: 0.6 }
  },
  pulse: {
    scale: [1, 1.1, 1],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
  }
};

const chipVariants = {
  initial: { opacity: 0, scale: 0, y: 30 },
  animate: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { 
      delay: 0.4 + i * 0.08, 
      type: 'spring', 
      stiffness: 400, 
      damping: 15 
    }
  }),
  tap: { scale: 0.9 },
  selected: { 
    scale: [1, 1.2, 1],
    transition: { duration: 0.4 }
  }
};

const buttonVariants = {
  initial: { opacity: 0, y: 40, scale: 0.9 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { delay: 0.5, type: 'spring', stiffness: 200 }
  },
  hover: { 
    scale: 1.05,
    y: -3,
    boxShadow: '0 20px 60px -15px rgba(168, 85, 247, 0.5)',
    transition: { duration: 0.3 }
  },
  tap: { scale: 0.95, y: 0 }
};

const floatingVariants = {
  animate: {
    y: [-20, 20, -20],
    x: [-5, 5, -5],
    rotate: [-3, 3, -3],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

const glowVariants = {
  animate: {
    opacity: [0.3, 0.6, 0.3],
    scale: [1, 1.2, 1],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

// ============================================================
// Full Screen Animated Background
// ============================================================
const AnimatedBackground = ({ step }: { step: string }) => {
  return (
    <motion.div 
      className="fixed inset-0 -z-10"
      animate={step}
      variants={backgroundVariants}
      transition={{ duration: 1, ease: 'easeInOut' }}
    >
      {/* Gradient orbs */}
      <motion.div 
        className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full bg-lilac-300/20 blur-[100px]"
        animate={{ 
          x: [0, 100, 0], 
          y: [0, 50, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div 
        className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-pink-300/20 blur-[80px]"
        animate={{ 
          x: [0, -80, 0], 
          y: [0, -60, 0],
          scale: [1.2, 1, 1.2]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-blue-200/10 blur-[60px]"
        animate={{ 
          scale: [1, 1.3, 1],
          rotate: [0, 180, 360]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
      />
    </motion.div>
  );
};

// ============================================================
// Floating Particles Background - MORE PARTICLES
// ============================================================
const FloatingParticles = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: 4 + Math.random() * 12,
    x: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 4 + Math.random() * 6
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: '110%',
            background: `radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, rgba(168, 85, 247, 0) 70%)`
          }}
          animate={{
            y: [0, -(typeof window !== 'undefined' ? window.innerHeight + 200 : 1000)],
            x: [0, Math.sin(p.id) * 100],
            opacity: [0, 0.8, 0.8, 0],
            scale: [0.5, 1, 1, 0.5]
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'linear'
          }}
        />
      ))}
    </div>
  );
};

// ============================================================
// Screen Flash Transition
// ============================================================
const ScreenFlash = ({ trigger }: { trigger: number }) => {
  return (
    <motion.div
      key={trigger}
      className="fixed inset-0 bg-white/80 pointer-events-none z-40"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.5, 0] }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    />
  );
};

// ============================================================
// Ripple Effect on Step Change
// ============================================================
const RippleEffect = ({ trigger }: { trigger: number }) => {
  return (
    <motion.div
      key={trigger}
      className="fixed inset-0 pointer-events-none z-30 flex items-center justify-center"
    >
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-32 h-32 rounded-full border-4 border-lilac-300"
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 15, opacity: 0 }}
          transition={{ 
            duration: 1.2, 
            delay: i * 0.15, 
            ease: [0.22, 1, 0.36, 1] 
          }}
        />
      ))}
    </motion.div>
  );
};

// ============================================================
// Confetti Component - MEGA VERSION
// ============================================================
const Confetti = ({ show }: { show: boolean }) => {
  if (!show) return null;

  const confettiPieces = Array.from({ length: 150 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    size: 6 + Math.random() * 10,
    color: ['#a855f7', '#c084fc', '#e9d5ff', '#22c55e', '#fbbf24', '#ec4899', '#3b82f6', '#f97316'][
      Math.floor(Math.random() * 8)
    ],
    delay: Math.random() * 1,
    rotation: Math.random() * 360,
    drift: (Math.random() - 0.5) * 200
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {/* Burst effect */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-4 h-4 rounded-full bg-yellow-400"
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 40, opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
      
      {confettiPieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: '-5%',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : Math.random() > 0.5 ? '2px' : '0%',
          }}
          initial={{ y: 0, x: 0, rotate: 0, opacity: 1, scale: 0 }}
          animate={{
            y: typeof window !== 'undefined' ? window.innerHeight + 100 : 1000,
            x: p.drift,
            rotate: p.rotation + 1080,
            opacity: [0, 1, 1, 0.8, 0],
            scale: [0, 1.5, 1, 0.8, 0.5]
          }}
          transition={{
            duration: 3.5,
            delay: p.delay,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
        />
      ))}
      
      {/* Additional sparkles */}
      {Array.from({ length: 30 }, (_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 2, 0], 
            opacity: [0, 1, 0] 
          }}
          transition={{
            duration: 0.6,
            delay: 0.2 + Math.random() * 0.8,
            ease: 'easeOut'
          }}
        />
      ))}
    </div>
  );
};

// ============================================================
// Animated Progress Dots - ENHANCED
// ============================================================
const ProgressDots = ({ steps, currentIndex }: { steps: string[]; currentIndex: number }) => (
  <div className="flex justify-center gap-4">
    {steps.slice(0, -1).map((s, i) => (
      <motion.div
        key={s}
        className="relative"
        initial={{ scale: 0.8 }}
        animate={{ 
          scale: i === currentIndex ? 1 : 1,
        }}
      >
        {/* Glow effect for active dot */}
        {i === currentIndex && (
          <motion.div
            className="absolute inset-0 bg-lilac-400 rounded-full blur-md"
            animate={{ 
              scale: [1, 1.8, 1],
              opacity: [0.5, 0.2, 0.5]
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <motion.div
          className={`relative rounded-full transition-colors duration-300 ${
            i <= currentIndex ? 'bg-lilac-400' : 'bg-calm-200'
          }`}
          animate={{ 
            width: i === currentIndex ? 40 : 12,
            height: 12,
            y: i === currentIndex ? -2 : 0
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          {i < currentIndex && (
            <motion.svg 
              className="absolute inset-0 m-auto w-3 h-3 text-white"
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="3"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500 }}
            >
              <polyline points="20 6 9 17 4 12" />
            </motion.svg>
          )}
        </motion.div>
      </motion.div>
    ))}
  </div>
);

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
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="mt-4"
      >
        <BubbleCard variant="subtle" className="p-4">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-5 h-5 rounded-full bg-gradient-to-r from-lilac-300 to-lilac-500"
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
            <motion.span 
              className="text-calm-500 text-sm"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Checking clarity...
            </motion.span>
          </div>
        </BubbleCard>
      </motion.div>
    );
  }

  if (!response) return null;

  if (response.status === 'ok') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="mt-4"
      >
        <BubbleCard variant="subtle" className="p-4">
          <motion.div 
            className="flex items-center gap-3 text-drift-600"
            initial={{ x: -10 }}
            animate={{ x: 0 }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
            >
              <CheckIcon />
            </motion.div>
            <span className="text-sm font-medium">Looks clear and startable.</span>
          </motion.div>
        </BubbleCard>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="mt-4 space-y-3"
    >
      <BubbleCard variant="highlight" className="p-5">
        <div className="space-y-4">
          {/* Issues */}
          {response.issues.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-sm text-calm-600 mb-2">A few thoughts:</p>
              <ul className="space-y-1">
                {response.issues.map((issue, i) => (
                  <motion.li 
                    key={i} 
                    className="text-sm text-calm-700 flex items-start gap-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.1 }}
                  >
                    <motion.span 
                      className="text-lilac-400 mt-0.5"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.3 }}
                    >
                      •
                    </motion.span>
                    {issue}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Rewrite Options */}
          {response.rewrite_options.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-sm text-calm-600 mb-2">Try this instead:</p>
              <div className="space-y-2">
                {response.rewrite_options.map((option, i) => (
                  <motion.button
                    key={i}
                    onClick={() => onSelectSuggestion(option)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1, type: 'spring' }}
                    whileHover={{ 
                      scale: 1.02, 
                      x: 5,
                      boxShadow: '0 4px 20px -4px rgba(168, 85, 247, 0.3)'
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full text-left p-3 rounded-2xl bg-white/80 hover:bg-white border border-lilac-200/50 hover:border-lilac-300 transition-colors text-sm text-calm-700"
                  >
                    <span className="text-lilac-500 font-medium mr-2">#{i + 1}</span>
                    {option}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Clarifying Questions */}
          {response.clarifying_questions.length > 0 && (
            <motion.div 
              className="pt-2 border-t border-lilac-200/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <p className="text-xs text-calm-500 mb-1">You might also consider:</p>
              {response.clarifying_questions.map((q, i) => (
                <motion.p 
                  key={i} 
                  className="text-sm text-calm-600 italic"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                >
                  {q}
                </motion.p>
              ))}
            </motion.div>
          )}

          {/* Keep Mine Button */}
          <motion.button
            onClick={onKeepMine}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            whileHover={{ x: 5 }}
            className="text-sm text-calm-500 hover:text-calm-700 underline underline-offset-2"
          >
            Keep mine anyway →
          </motion.button>
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
  
  // Show confetti on review step
  const [showConfetti, setShowConfetti] = useState(false);
  const [stepChangeCount, setStepChangeCount] = useState(0);
  
  useEffect(() => {
    if (step === 'review') {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Track step changes for ripple effect
  useEffect(() => {
    setStepChangeCount(c => c + 1);
  }, [step]);

  return (
    <div className="min-h-screen overflow-hidden relative">
      {/* Animated full-screen background */}
      <AnimatedBackground step={step} />
      
      {/* Full screen effects */}
      <FloatingParticles />
      <Confetti show={showConfetti} />
      <ScreenFlash trigger={stepChangeCount} />
      <RippleEffect trigger={stepChangeCount} />
      
      {/* Floating decorative shapes */}
      <motion.div
        className="fixed top-20 right-20 w-64 h-64 rounded-full bg-gradient-to-br from-lilac-200/30 to-pink-200/30 blur-2xl"
        animate={{ 
          x: [0, 30, 0],
          y: [0, -20, 0],
          scale: [1, 1.1, 1],
          rotate: [0, 90, 0]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="fixed bottom-20 left-10 w-48 h-48 rounded-full bg-gradient-to-br from-blue-200/20 to-green-200/20 blur-2xl"
        animate={{ 
          x: [0, -25, 0],
          y: [0, 25, 0],
          scale: [1.1, 1, 1.1]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <motion.div
        className="fixed top-1/3 left-20 w-32 h-32 rounded-full bg-gradient-to-br from-yellow-200/20 to-orange-200/20 blur-xl"
        animate={{ 
          y: [0, -40, 0],
          x: [0, 20, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      
      {/* Floating Rocket Image */}
      <motion.div
        className="fixed top-16 right-8 w-44 h-44 pointer-events-none z-5"
        initial={{ opacity: 0, scale: 0.3, y: 100, rotate: 45 }}
        animate={{ opacity: 0.9, scale: 1, y: 0, rotate: 0 }}
        transition={{ delay: 0.5, duration: 1, type: 'spring', stiffness: 80 }}
      >
        <motion.div
          animate={{ 
            y: [-15, 15, -15],
            rotate: [-5, 5, -5],
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="relative w-full h-full"
        >
          {/* Glow effect */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-br from-lilac-400/30 to-pink-400/30 blur-2xl rounded-full"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <Image
            src="/images/rocket.svg"
            alt="Rocket illustration"
            width={176}
            height={176}
            className="relative z-10 drop-shadow-2xl"
          />
        </motion.div>
      </motion.div>
      
      <div className="relative z-10 py-8 px-4">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Progress */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ProgressDots steps={steps} currentIndex={currentStepIndex} />
          </motion.div>

        <AnimatePresence mode="wait">
          {step !== 'review' ? (
            <motion.div
              key={step}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{ perspective: 1200 }}
              className="relative"
            >
              {/* Glow behind card */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-lilac-400/20 to-pink-400/20 blur-3xl rounded-3xl"
                variants={glowVariants}
                animate="animate"
              />
              
              <BubbleCard className="p-6 md:p-8 relative">
                {/* Icon with animation */}
                <motion.div 
                  className="flex justify-center mb-4"
                  variants={iconVariants}
                  initial="initial"
                  animate={["animate", "pulse"]}
                  whileHover="hover"
                >
                  <motion.div 
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-lilac-100 to-lilac-200 flex items-center justify-center text-lilac-600 shadow-bubble-inset cursor-pointer relative overflow-hidden"
                    variants={floatingVariants}
                    animate="animate"
                  >
                    {/* Shine effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    />
                    <span className="relative z-10 scale-110">{STEP_CONFIG[step].icon}</span>
                  </motion.div>
                </motion.div>

                {/* Prompt with typing effect feel */}
                <motion.h1 
                  className="text-xl md:text-2xl font-semibold text-center text-calm-800 mb-2"
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                >
                  {STEP_CONFIG[step].prompt}
                </motion.h1>

                {/* Helper with tooltip */}
                <motion.div 
                  className="flex items-center justify-center gap-1 mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className="text-sm text-calm-500 text-center">
                    {STEP_CONFIG[step].helper}
                  </p>
                  <div className="relative group">
                    <motion.button 
                      className="text-calm-400 hover:text-lilac-500 transition-colors"
                      whileHover={{ scale: 1.2, rotate: 15 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <InfoIcon />
                    </motion.button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-calm-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      Clear goals are easier to start. Value comes after you begin.
                    </div>
                  </div>
                </motion.div>

                {/* Input */}
                <form onSubmit={handleSubmitStep}>
                  {step === 'goal' && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, type: 'spring' }}
                    >
                      <input
                        type="text"
                        value={contract.goal}
                        onChange={(e) => setContract(c => ({ ...c, goal: e.target.value }))}
                        placeholder={STEP_CONFIG.goal.placeholder}
                        className="w-full px-4 py-3 rounded-2xl border border-calm-200 focus:border-lilac-300 focus:ring-2 focus:ring-lilac-100 outline-none transition-all text-calm-700 placeholder:text-calm-400"
                        autoFocus
                      />
                    </motion.div>
                  )}

                  {step === 'why' && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, type: 'spring' }}
                    >
                      <textarea
                        value={contract.why}
                        onChange={(e) => setContract(c => ({ ...c, why: e.target.value }))}
                        placeholder={STEP_CONFIG.why.placeholder}
                        rows={2}
                        className="w-full px-4 py-3 rounded-2xl border border-calm-200 focus:border-lilac-300 focus:ring-2 focus:ring-lilac-100 outline-none transition-all text-calm-700 placeholder:text-calm-400 resize-none"
                        autoFocus
                      />
                    </motion.div>
                  )}

                  {step === 'boundaries' && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {BOUNDARY_CHIPS.map((chip, i) => (
                          <motion.button
                            key={chip}
                            type="button"
                            onClick={() => toggleChip(chip)}
                            custom={i}
                            variants={chipVariants}
                            initial="initial"
                            animate="animate"
                            whileTap="tap"
                            className={`px-4 py-2 rounded-full text-sm transition-colors ${
                              contract.boundaries.chips.includes(chip)
                                ? 'bg-lilac-500 text-white shadow-md'
                                : 'bg-calm-100 text-calm-600 hover:bg-calm-200'
                            }`}
                          >
                            <motion.span
                              animate={contract.boundaries.chips.includes(chip) ? { scale: [1, 1.2, 1] } : {}}
                              transition={{ duration: 0.2 }}
                            >
                              {chip}
                            </motion.span>
                          </motion.button>
                        ))}
                      </div>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
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
                      </motion.div>
                    </div>
                  )}

                  {step === 'minimum_action' && (
                    <motion.div 
                      className="space-y-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, type: 'spring' }}
                    >
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
                      <motion.div 
                        className="flex items-center gap-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
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
                      </motion.div>
                    </motion.div>
                  )}

                  {/* Submit / Continue */}
                  {!stepSubmitted && (
                    <motion.button
                      type="submit"
                      disabled={!isStepValid() || checkLoading}
                      variants={buttonVariants}
                      initial="initial"
                      animate="animate"
                      whileHover={isStepValid() && !checkLoading ? "hover" : undefined}
                      whileTap={isStepValid() && !checkLoading ? "tap" : undefined}
                      className="w-full mt-6 py-3 px-6 rounded-2xl bg-gradient-to-r from-lilac-500 to-lilac-600 text-white font-medium shadow-bubble disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {checkLoading ? (
                        <motion.span
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          Checking...
                        </motion.span>
                      ) : 'Next'}
                    </motion.button>
                  )}

                  {stepSubmitted && realityResponse?.status === 'ok' && (
                    <motion.button
                      type="button"
                      onClick={handleContinue}
                      variants={buttonVariants}
                      initial="initial"
                      animate="animate"
                      whileHover="hover"
                      whileTap="tap"
                      className="w-full mt-6 py-3 px-6 rounded-2xl bg-gradient-to-r from-lilac-500 to-lilac-600 text-white font-medium shadow-bubble"
                    >
                      Continue ✨
                    </motion.button>
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
            /* Review Step - CELEBRATION MODE */
            <motion.div
              key="review"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="relative"
            >
              {/* Celebration glow */}
              <motion.div
                className="absolute -inset-10 bg-gradient-to-br from-yellow-400/20 via-lilac-400/20 to-pink-400/20 blur-3xl rounded-3xl"
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              
              <BubbleCard className="p-6 md:p-8 relative overflow-hidden">
                {/* Animated gradient border */}
                <motion.div
                  className="absolute inset-0 rounded-3xl"
                  style={{
                    background: 'linear-gradient(90deg, #a855f7, #ec4899, #f59e0b, #22c55e, #3b82f6, #a855f7)',
                    backgroundSize: '300% 100%',
                    padding: '2px',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                  }}
                  animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                />
                
                <motion.h1 
                  className="text-2xl md:text-3xl font-bold text-center text-calm-800 mb-8 relative"
                  initial={{ opacity: 0, scale: 0.5, y: -30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                >
                  <motion.span
                    className="inline-block"
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    🎉
                  </motion.span>
                  {' '}Your Goal Contract{' '}
                  <motion.span
                    className="inline-block"
                    animate={{ rotate: [0, 10, -10, 10, 0] }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                  >
                    🎉
                  </motion.span>
                </motion.h1>

                <div className="space-y-4 relative">
                  {[
                    { icon: <TargetIcon />, label: 'Goal', content: contract.goal, color: 'from-lilac-100 to-lilac-50' },
                    { icon: <HeartIcon />, label: 'Why', content: contract.why, color: 'from-pink-100 to-pink-50' },
                  ].map((item, i) => (
                    <motion.div 
                      key={item.label}
                      className={`p-4 rounded-2xl bg-gradient-to-br ${item.color} border border-white/50`}
                      initial={{ opacity: 0, x: -50, scale: 0.8 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.15, type: 'spring', stiffness: 200 }}
                    >
                      <div className="flex items-center gap-2 text-lilac-600 mb-1">
                        <motion.span
                          initial={{ rotate: -180, scale: 0 }}
                          animate={{ rotate: 0, scale: 1 }}
                          transition={{ delay: 0.4 + i * 0.15, type: 'spring' }}
                        >
                          {item.icon}
                        </motion.span>
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <p className="text-calm-700">{item.content}</p>
                    </motion.div>
                  ))}

                  <motion.div 
                    className="p-4 rounded-2xl bg-gradient-to-br from-green-100 to-green-50 border border-white/50"
                    initial={{ opacity: 0, x: -50, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
                  >
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                      <motion.span
                        initial={{ rotate: -180, scale: 0 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ delay: 0.7, type: 'spring' }}
                      >
                        <ShieldIcon />
                      </motion.span>
                      <span className="text-sm font-medium">Boundaries</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {contract.boundaries.chips.map((chip, i) => (
                        <motion.span 
                          key={chip} 
                          className="px-3 py-1.5 rounded-full bg-green-200/50 text-green-700 text-sm font-medium"
                          initial={{ opacity: 0, scale: 0, rotate: -20 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          transition={{ delay: 0.75 + i * 0.08, type: 'spring', stiffness: 300 }}
                          whileHover={{ scale: 1.1, y: -2 }}
                        >
                          ✓ {chip}
                        </motion.span>
                      ))}
                      {contract.boundaries.custom && (
                        <motion.span 
                          className="px-3 py-1.5 rounded-full bg-green-200/50 text-green-700 text-sm font-medium"
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.9, type: 'spring' }}
                        >
                          ✓ {contract.boundaries.custom}
                        </motion.span>
                      )}
                    </div>
                  </motion.div>

                  <motion.div 
                    className="p-4 rounded-2xl bg-gradient-to-br from-yellow-100 to-orange-50 border border-white/50"
                    initial={{ opacity: 0, x: -50, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ delay: 0.9, type: 'spring', stiffness: 200 }}
                  >
                    <div className="flex items-center gap-2 text-orange-600 mb-1">
                      <motion.span
                        initial={{ rotate: -180, scale: 0 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ delay: 1, type: 'spring' }}
                      >
                        <LightningIcon />
                      </motion.span>
                      <span className="text-sm font-medium">Minimum Action</span>
                    </div>
                    <p className="text-calm-700 text-lg">
                      {contract.minimum_action.text}
                      <motion.span 
                        className="inline-block ml-2 px-2 py-0.5 rounded-lg bg-orange-200/50 text-orange-600 text-sm font-medium"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1.1, type: 'spring' }}
                      >
                        ⏱ {contract.minimum_action.minutes} min
                      </motion.span>
                    </p>
                  </motion.div>
                </div>

                <motion.button
                  onClick={handleCreateResolution}
                  disabled={loading}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -3,
                    boxShadow: '0 25px 50px -12px rgba(168, 85, 247, 0.5)'
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ delay: 1.2, type: 'spring', stiffness: 200 }}
                  className="relative w-full mt-8 py-5 px-6 rounded-2xl bg-gradient-to-r from-lilac-500 via-purple-500 to-pink-500 text-white font-bold text-lg shadow-2xl disabled:opacity-50 overflow-hidden"
                >
                  {/* Animated shine */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                  />
                  
                  {loading ? (
                    <motion.span
                      className="relative z-10"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      ✨ Creating your plan...
                    </motion.span>
                  ) : (
                    <span className="relative z-10">🚀 Start Now — Value Comes Later ✨</span>
                  )}
                </motion.button>

                <motion.p 
                  className="text-center text-sm text-calm-400 mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.4 }}
                >
                  You can always adjust your plan later
                </motion.p>
              </BubbleCard>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
