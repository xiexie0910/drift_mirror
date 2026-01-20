'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Sparkles, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { 
  AnimatedBackground, 
  FloatingParticles, 
  FloatingShapes,
  AnimatedDecorations,
  PageTransition,
  FloatingImage 
} from '@/components/animations/AnimatedBackground';

export default function Home() {
  const router = useRouter();
  const [hasResolution, setHasResolution] = useState<boolean | null>(null);

  useEffect(() => {
    api.getDashboard().then((data) => {
      setHasResolution(!!data.resolution);
      if (data.resolution) {
        router.push('/dashboard');
      }
    }).catch(() => setHasResolution(false));
  }, [router]);

  if (hasResolution === null) {
    return (
      <div className="min-h-screen relative">
        <AnimatedBackground theme="home" />
        <FloatingParticles count={20} />
        <div className="flex items-center justify-center min-h-screen">
          <motion.div 
            className="text-lilac-500 text-xl font-medium"
            animate={{ opacity: [0.5, 1, 0.5], scale: [0.98, 1.02, 0.98] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ✨ Loading...
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground theme="home" />
      <FloatingParticles count={30} />
      <FloatingShapes />
      <AnimatedDecorations />
      
      {/* Floating target image */}
      <FloatingImage 
        src="/images/target.svg" 
        alt="Target illustration" 
        size={180} 
        position="top-right"
        delay={0.5}
      />
      
      {/* Decorative floating illustration - bottom left */}
      <motion.div
        className="fixed bottom-20 left-10 w-32 h-32 pointer-events-none z-5"
        initial={{ opacity: 0, scale: 0.5, x: -50 }}
        animate={{ opacity: 0.7, scale: 1, x: 0 }}
        transition={{ delay: 0.8, duration: 0.8, type: 'spring' }}
      >
        <motion.div
          animate={{ y: [10, -10, 10], rotate: [5, -5, 5] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl">
            <defs>
              <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <path d="M100 20 L180 100 L100 180 L20 100 Z" fill="url(#gradient2)" opacity="0.4" />
            <text x="100" y="115" textAnchor="middle" fontSize="50" fill="white">✨</text>
          </svg>
        </motion.div>
      </motion.div>
      
      <PageTransition className="relative z-10 py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          <motion.div 
            className="text-center space-y-4"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
          >
            <motion.div 
              className="flex items-center justify-center gap-3"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles className="w-10 h-10 text-lilac-500 drop-shadow-lg" />
              </motion.div>
              <h1 className="text-5xl font-display font-bold text-gradient-shine text-shadow-glow tracking-tight">
                DriftMirror
              </h1>
            </motion.div>
            <motion.p 
              className="text-lg font-body text-calm-600 max-w-md mx-auto font-medium tracking-wide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Track your goals. Reflect on your patterns. Adapt without judgment.
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 100 }}
          >
            <Card className="p-8 text-center space-y-6 glass-card rounded-2xl">
              <motion.blockquote 
                className="text-xl font-display italic text-calm-700 border-l-4 border-lilac-400 pl-4 text-left leading-relaxed"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                "Start before you think about the value. Value comes after you start. Don't wait."
              </motion.blockquote>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  onClick={() => router.push('/onboarding')} 
                  size="lg" 
                  className="gap-2 bg-gradient-to-r from-lilac-500 to-purple-600 hover:from-lilac-600 hover:to-purple-700 shadow-lg shadow-lilac-500/30 text-lg px-8 py-4 font-heading font-semibold tracking-wide"
                >
                  Begin Your Journey <ArrowRight className="w-5 h-5" />
                </Button>
              </motion.div>
            </Card>
          </motion.div>

          <motion.div 
            className="grid gap-4 text-sm text-calm-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {[
              { num: 1, text: 'Set a simple goal in under 30 seconds', icon: '🎯' },
              { num: 2, text: 'Quick daily check-ins (15 seconds)', icon: '⚡' },
              { num: 3, text: 'Get non-judgmental insights when you drift', icon: '🔮' },
              { num: 4, text: 'Your plan adapts automatically to keep you going', icon: '✨' },
            ].map((item, i) => (
              <motion.div 
                key={item.num}
                className="flex items-center gap-4 p-4 rounded-2xl glass glass-hover cursor-default"
                style={{ '--shine-delay': `${i * 0.5}s` } as React.CSSProperties}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + i * 0.1, type: 'spring' }}
              >
                <motion.span 
                  className="text-2xl"
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
                >
                  {item.icon}
                </motion.span>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-bold text-lilac-600 text-lg">
                    {item.num}.
                  </span>
                  <span className="font-body font-medium text-calm-700">{item.text}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </PageTransition>
    </div>
  );
}
