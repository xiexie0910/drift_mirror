'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode, useEffect, useState } from 'react';
import Image from 'next/image';

// Theme definitions for different pages
const themes = {
  home: {
    gradient: 'from-lilac-100 via-purple-50 to-pink-100',
    particles: ['#a855f7', '#ec4899', '#7c3aed', '#f472b6'],
  },
  onboarding: {
    gradient: 'from-lilac-100 via-indigo-50 to-purple-100',
    particles: ['#a855f7', '#6366f1', '#8b5cf6', '#c084fc'],
  },
  dashboard: {
    gradient: 'from-green-50 via-emerald-50 to-teal-50',
    particles: ['#22c55e', '#10b981', '#14b8a6', '#34d399'],
  },
  checkin: {
    gradient: 'from-yellow-50 via-amber-50 to-orange-50',
    particles: ['#f59e0b', '#fbbf24', '#fb923c', '#facc15'],
  },
  mirror: {
    gradient: 'from-blue-50 via-cyan-50 to-sky-50',
    particles: ['#3b82f6', '#06b6d4', '#0ea5e9', '#38bdf8'],
  },
};

type ThemeKey = keyof typeof themes;

interface AnimatedBackgroundProps {
  theme?: ThemeKey;
  children?: ReactNode;
}

export function AnimatedBackground({ theme = 'home' }: AnimatedBackgroundProps) {
  const themeConfig = themes[theme];
  
  return (
    <motion.div
      className={`fixed inset-0 bg-gradient-to-br ${themeConfig.gradient} -z-10`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated gradient overlay */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(circle at 20% 80%, rgba(168, 85, 247, 0.15) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.15) 0%, transparent 50%)',
            'radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.15) 0%, transparent 50%)',
            'radial-gradient(circle at 20% 80%, rgba(168, 85, 247, 0.15) 0%, transparent 50%)',
          ],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(168, 85, 247, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(168, 85, 247, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
    </motion.div>
  );
}

interface FloatingParticlesProps {
  count?: number;
  theme?: ThemeKey;
}

export function FloatingParticles({ count = 25, theme = 'home' }: FloatingParticlesProps) {
  const colors = themes[theme].particles;
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {Array.from({ length: count }).map((_, i) => {
        const size = Math.random() * 12 + 4;
        const delay = Math.random() * 5;
        const duration = Math.random() * 15 + 10;
        const startX = Math.random() * 100;
        const color = colors[i % colors.length];
        
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              left: `${startX}%`,
              background: `radial-gradient(circle, ${color}80 0%, ${color}20 70%, transparent 100%)`,
              boxShadow: `0 0 ${size * 2}px ${color}40`,
            }}
            initial={{ y: '110vh', opacity: 0, rotate: 0 }}
            animate={{
              y: '-10vh',
              opacity: [0, 1, 1, 0],
              rotate: 360,
              x: [0, Math.sin(i) * 50, 0],
            }}
            transition={{
              duration,
              delay,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        );
      })}
    </div>
  );
}

interface ScreenFlashProps {
  trigger: boolean;
}

export function ScreenFlash({ trigger }: ScreenFlashProps) {
  return (
    <AnimatePresence>
      {trigger && (
        <motion.div
          className="fixed inset-0 bg-gradient-to-br from-white via-lilac-100 to-white z-50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.9, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      )}
    </AnimatePresence>
  );
}

interface RippleEffectProps {
  trigger: boolean;
  x?: number;
  y?: number;
}

export function RippleEffect({ trigger, x = 50, y = 50 }: RippleEffectProps) {
  return (
    <AnimatePresence>
      {trigger && (
        <div 
          className="fixed inset-0 z-40 pointer-events-none overflow-hidden"
          style={{ perspective: '1000px' }}
        >
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border-2 border-lilac-400/50"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              initial={{ width: 0, height: 0, opacity: 0.8 }}
              animate={{ 
                width: 600 + i * 200, 
                height: 600 + i * 200, 
                opacity: 0,
              }}
              transition={{
                duration: 1.2,
                delay: i * 0.15,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

export function FloatingShapes() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {[
        { size: 300, x: '10%', y: '20%', color: 'from-lilac-300/30 to-purple-400/20', delay: 0 },
        { size: 250, x: '70%', y: '60%', color: 'from-pink-300/30 to-rose-400/20', delay: 1 },
        { size: 200, x: '80%', y: '10%', color: 'from-purple-300/30 to-violet-400/20', delay: 2 },
        { size: 280, x: '20%', y: '70%', color: 'from-indigo-300/30 to-blue-400/20', delay: 3 },
      ].map((shape, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full bg-gradient-to-br ${shape.color} blur-3xl`}
          style={{
            width: shape.size,
            height: shape.size,
            left: shape.x,
            top: shape.y,
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: [0.4, 0.7, 0.4],
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 8,
            delay: shape.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

interface FloatingImageProps {
  src: string;
  alt: string;
  size?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  delay?: number;
}

export function FloatingImage({ 
  src, 
  alt, 
  size = 150, 
  position = 'top-right',
  delay = 0 
}: FloatingImageProps) {
  const positionClasses = {
    'top-right': 'top-20 right-10',
    'top-left': 'top-20 left-10',
    'bottom-right': 'bottom-20 right-10',
    'bottom-left': 'bottom-20 left-10',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  };

  return (
    <motion.div
      className={`fixed ${positionClasses[position]} pointer-events-none z-5`}
      initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
      animate={{ opacity: 0.8, scale: 1, rotate: 0 }}
      transition={{ delay, duration: 0.8, type: 'spring' }}
    >
      <motion.div
        animate={{ 
          y: [0, -15, 0],
          rotate: [0, 5, -5, 0],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
      >
        {/* Glow effect behind image */}
        <div 
          className="absolute inset-0 blur-2xl opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.5) 0%, transparent 70%)',
            transform: 'scale(1.5)',
          }}
        />
        <Image
          src={src}
          alt={alt}
          width={size}
          height={size}
          className="relative drop-shadow-2xl"
        />
      </motion.div>
    </motion.div>
  );
}

export function AnimatedDecorations() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Floating stars */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute text-lilac-400/60 text-xl"
          style={{
            left: `${10 + i * 12}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0.3, 0.8, 0.3],
            scale: [0.8, 1.2, 0.8],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 4,
            delay: i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          ✦
        </motion.div>
      ))}
      
      {/* Floating circles */}
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={`circle-${i}`}
          className="absolute w-3 h-3 rounded-full bg-gradient-to-br from-pink-400/40 to-purple-500/40"
          style={{
            right: `${15 + i * 15}%`,
            bottom: `${25 + (i % 2) * 30}%`,
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.4, 0.8, 0.4],
            y: [0, -20, 0],
            x: [0, 10, 0],
          }}
          transition={{
            duration: 5,
            delay: i * 0.7,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

interface ConfettiProps {
  trigger: boolean;
  duration?: number;
}

export function Confetti({ trigger, duration = 3000 }: ConfettiProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (trigger) {
      setIsVisible(true);
      const timer = setTimeout(() => setIsVisible(false), duration);
      return () => clearTimeout(timer);
    }
  }, [trigger, duration]);

  const confettiColors = ['#a855f7', '#ec4899', '#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6'];
  
  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 150 }).map((_, i) => {
            const randomX = Math.random() * 100;
            const randomDelay = Math.random() * 0.5;
            const randomDuration = 2 + Math.random() * 2;
            const randomSize = 6 + Math.random() * 10;
            const randomRotation = Math.random() * 720 - 360;
            const color = confettiColors[i % confettiColors.length];
            const shape = i % 3;
            
            return (
              <motion.div
                key={i}
                className={shape === 0 ? 'rounded-full' : shape === 1 ? 'rounded-sm' : ''}
                style={{
                  position: 'absolute',
                  left: `${randomX}%`,
                  width: randomSize,
                  height: shape === 2 ? randomSize * 0.4 : randomSize,
                  backgroundColor: color,
                  boxShadow: `0 0 ${randomSize}px ${color}80`,
                }}
                initial={{ 
                  y: -20, 
                  opacity: 1,
                  rotate: 0,
                  scale: 0,
                }}
                animate={{ 
                  y: '110vh',
                  opacity: [1, 1, 0],
                  rotate: randomRotation,
                  scale: [0, 1, 1, 0.5],
                  x: [0, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 100],
                }}
                transition={{
                  duration: randomDuration,
                  delay: randomDelay,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              />
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}
