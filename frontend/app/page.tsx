'use client';

/**
 * DriftMirror Home Page - Award-Winning Version
 * ============================================================
 * 
 * Design: Calm Futurism with Delightful Interactions
 * - Magnetic buttons with ripple effects
 * - Text reveal animations
 * - Parallax orbs responding to cursor
 * - Tilt cards with 3D depth
 * - Smooth page transitions
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Zap, Eye, TrendingUp, RefreshCw, Github, Play, CheckCircle2 } from 'lucide-react';
import { ParallaxOrbs } from '@/components/ParallaxOrbs';
import { RippleButton } from '@/components/ui/RippleButton';
import { TiltCard } from '@/components/ui/TiltCard';
import { CharacterReveal, FadeIn, SlideUp } from '@/components/ui/TextReveal';

export default function Home() {
  const router = useRouter();
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [demoLoaded, setDemoLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLoadDemo = async () => {
    setIsLoadingDemo(true);
    try {
      const response = await fetch('/api/demo/seed', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        console.error('Demo seed failed:', response.status);
        setIsLoadingDemo(false);
        return;
      }
      
      const data = await response.json();
      setDemoLoaded(true);
      
      setTimeout(() => {
        router.push(`/dashboard/${data.resolution_id}`);
      }, 600);
    } catch (error) {
      console.error('Demo seed error:', error);
      setIsLoadingDemo(false);
    }
  };

  const features = [
    { 
      icon: Eye, 
      title: 'Evidence-Based', 
      desc: 'Quotes your own words back to you. No vague "you should try harder."' 
    },
    { 
      icon: TrendingUp, 
      title: 'Drift Detection', 
      desc: 'Automatically spots when plans and reality diverge—before you give up.' 
    },
    { 
      icon: Zap, 
      title: 'Adaptive Plans', 
      desc: 'Your plan evolves based on behavior patterns. Not the other way around.' 
    },
  ];

  const steps = ['Define goal', 'Daily check-ins', 'AI spots patterns', 'Plan adapts'];

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Parallax background with interactive orbs */}
      <ParallaxOrbs />
      
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="max-w-2xl w-full space-y-10">
          
          {/* Logo & Tagline */}
          <div className="text-center space-y-6">
            {/* Animated logo */}
            <motion.div 
              className="flex justify-center mb-8"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: 'spring', 
                stiffness: 200, 
                damping: 15,
                delay: 0.2 
              }}
            >
              <motion.div 
                className="glass-strong p-6 rounded-3xl glow-teal-strong relative"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Sparkles className="w-12 h-12 text-teal-600" />
                
                {/* Pulsing ring */}
                <motion.div
                  className="absolute inset-0 rounded-3xl border-2 border-teal-400/50"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0.2, 0.5],
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                
                {/* Sparkle particles */}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-teal-400"
                    style={{
                      top: `${20 + i * 25}%`,
                      left: `${10 + i * 30}%`,
                    }}
                    animate={{
                      y: [0, -10, 0],
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.3,
                      repeat: Infinity,
                    }}
                  />
                ))}
              </motion.div>
            </motion.div>
            
            {/* Animated title */}
            <motion.h1 
              className="text-5xl md:text-6xl font-bold tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <span className="bg-gradient-to-r from-teal-700 via-teal-600 to-teal-500 bg-clip-text text-transparent">
                <CharacterReveal staggerChildren={0.04}>
                  DriftMirror
                </CharacterReveal>
              </span>
            </motion.h1>
            
            {/* Philosophy Quote with reveal */}
            <SlideUp delay={0.8}>
              <div className="glass-subtle p-6 rounded-2xl border-l-4 border-l-teal-500 max-w-lg mx-auto">
                <motion.p 
                  className="text-lg md:text-xl text-neutral-700 italic font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1, duration: 0.8 }}
                >
                  "Start before you think about the value. Value comes after you start. Don't wait."
                </motion.p>
              </div>
            </SlideUp>
            
            <FadeIn delay={1.2}>
              <p className="text-xl text-neutral-600 max-w-md mx-auto">
                A behavioral mirror that shows what actually happens—not what you hope will happen.
              </p>
            </FadeIn>
          </div>

          {/* CTA Buttons with magnetic/ripple effects */}
          <FadeIn delay={1.4}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <RippleButton 
                onClick={() => router.push('/onboarding')} 
                size="lg"
                variant="primary"
              >
                <span>Start Tracking</span>
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.span>
              </RippleButton>
              
              <RippleButton 
                onClick={handleLoadDemo}
                disabled={isLoadingDemo || demoLoaded}
                variant="glass"
                size="lg"
              >
                <AnimatePresence mode="wait">
                  {demoLoaded ? (
                    <motion.span
                      key="done"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 text-emerald-600"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Launching...
                    </motion.span>
                  ) : isLoadingDemo ? (
                    <motion.span
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Loading Demo...
                    </motion.span>
                  ) : (
                    <motion.span
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2"
                    >
                      <Play className="w-5 h-5" />
                      See it in Action
                    </motion.span>
                  )}
                </AnimatePresence>
              </RippleButton>
            </div>
          </FadeIn>

          {/* Feature Cards with tilt effect */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map((item, i) => (
              <FadeIn key={i} delay={1.6 + i * 0.1}>
                <TiltCard className="h-full">
                  <div className="glass-strong p-5 rounded-2xl h-full">
                    <div className="flex items-center gap-3 mb-3">
                      <motion.div 
                        className="p-2 rounded-xl bg-teal-500/10"
                        whileHover={{ scale: 1.1, rotate: 10 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        <item.icon className="w-5 h-5 text-teal-600" />
                      </motion.div>
                      <h3 className="font-semibold text-neutral-800">{item.title}</h3>
                    </div>
                    <p className="text-sm text-neutral-600">{item.desc}</p>
                  </div>
                </TiltCard>
              </FadeIn>
            ))}
          </div>

          {/* How it Works - Animated Steps */}
          <SlideUp delay={2}>
            <div className="glass-subtle p-6 rounded-2xl">
              <p className="text-xs font-medium text-teal-600 uppercase tracking-wider text-center mb-4">
                How it works
              </p>
              <div className="flex flex-wrap justify-center items-center gap-2 md:gap-4">
                {steps.map((step, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-2 md:gap-4"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 2.2 + i * 0.15 }}
                  >
                    <motion.span 
                      className="px-3 py-1.5 rounded-full glass-strong text-sm text-neutral-700 font-medium"
                      whileHover={{ scale: 1.05, y: -2 }}
                    >
                      {step}
                    </motion.span>
                    {i < steps.length - 1 && (
                      <motion.span 
                        className="text-teal-500 hidden md:inline"
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      >
                        →
                      </motion.span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </SlideUp>

          {/* Existing Users Link */}
          <FadeIn delay={2.5}>
            <div className="text-center">
              <motion.button
                onClick={() => router.push('/dashboard')}
                className="text-sm text-neutral-500 hover:text-teal-600 transition-colors underline underline-offset-4"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Already tracking? Go to Dashboard →
              </motion.button>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Tech Stack Footer */}
      <footer className="py-6 px-4 border-t border-neutral-200/30 relative z-10">
        <div className="max-w-2xl mx-auto">
          <motion.div 
            className="flex flex-wrap items-center justify-center gap-3 text-xs text-neutral-500"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.8 }}
          >
            <span className="font-medium">Built with:</span>
            {[
              { name: 'Next.js 14', color: 'bg-neutral-800 text-white' },
              { name: 'FastAPI', color: 'bg-emerald-600 text-white' },
              { name: 'Gemini AI', color: 'bg-blue-600 text-white' },
              { name: 'TypeScript', color: 'bg-blue-500 text-white' },
            ].map((tech, i) => (
              <motion.span 
                key={tech.name} 
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${tech.color}`}
                whileHover={{ scale: 1.1, y: -2 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 3 + i * 0.05 }}
              >
                {tech.name}
              </motion.span>
            ))}
          </motion.div>
          
          <motion.div 
            className="flex justify-center mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.2 }}
          >
            <motion.a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              <Github className="w-4 h-4" />
              View Source
            </motion.a>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}
