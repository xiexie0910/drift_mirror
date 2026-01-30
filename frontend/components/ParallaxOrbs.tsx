'use client';

/**
 * ParallaxOrbs - Floating orbs that respond to scroll and mouse
 * 
 * Creates depth and visual interest on the landing page.
 */

import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

interface Orb {
  id: number;
  size: number;
  x: number;
  y: number;
  parallaxFactor: number;
  color: 'teal' | 'cyan' | 'purple';
  delay: number;
}

const orbs: Orb[] = [
  { id: 1, size: 500, x: 80, y: -10, parallaxFactor: 0.3, color: 'teal', delay: 0 },
  { id: 2, size: 350, x: 5, y: 20, parallaxFactor: 0.5, color: 'cyan', delay: 0.2 },
  { id: 3, size: 400, x: 70, y: 50, parallaxFactor: 0.4, color: 'teal', delay: 0.4 },
  { id: 4, size: 300, x: -5, y: 70, parallaxFactor: 0.6, color: 'purple', delay: 0.6 },
  { id: 5, size: 250, x: 85, y: 85, parallaxFactor: 0.2, color: 'cyan', delay: 0.8 },
];

const colorClasses = {
  teal: 'from-teal-400/40 via-teal-300/30 to-transparent',
  cyan: 'from-cyan-400/35 via-cyan-300/20 to-transparent',
  purple: 'from-purple-400/25 via-purple-300/15 to-transparent',
};

export function ParallaxOrbs() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { scrollY } = useScroll();

  // Smooth mouse position
  const springConfig = { stiffness: 50, damping: 20 };
  const mouseX = useSpring(0, springConfig);
  const mouseY = useSpring(0, springConfig);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      // Normalize to -1 to 1
      const x = (clientX / innerWidth - 0.5) * 2;
      const y = (clientY / innerHeight - 0.5) * 2;
      
      mouseX.set(x);
      mouseY.set(y);
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, [mouseX, mouseY]);

  return (
    <div ref={containerRef} className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {orbs.map((orb) => (
        <ParallaxOrb
          key={orb.id}
          orb={orb}
          mouseX={mousePosition.x}
          mouseY={mousePosition.y}
          scrollY={scrollY}
        />
      ))}
      
      {/* Floating particles */}
      <FloatingParticles />
    </div>
  );
}

interface ParallaxOrbProps {
  orb: Orb;
  mouseX: number;
  mouseY: number;
  scrollY: ReturnType<typeof useScroll>['scrollY'];
}

function ParallaxOrb({ orb, mouseX, mouseY, scrollY }: ParallaxOrbProps) {
  const scrollTransform = useTransform(
    scrollY,
    [0, 1000],
    [0, 100 * orb.parallaxFactor]
  );

  // Calculate position based on mouse
  const mouseOffsetX = mouseX * 20 * orb.parallaxFactor;
  const mouseOffsetY = mouseY * 20 * orb.parallaxFactor;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 0.7, 
        scale: 1,
        x: mouseOffsetX,
        y: mouseOffsetY,
      }}
      transition={{ 
        opacity: { duration: 1, delay: orb.delay },
        scale: { duration: 1.2, delay: orb.delay },
        x: { type: 'spring', stiffness: 30, damping: 20 },
        y: { type: 'spring', stiffness: 30, damping: 20 },
      }}
      style={{
        width: orb.size,
        height: orb.size,
        left: `${orb.x}%`,
        top: `${orb.y}%`,
        translateY: scrollTransform,
      }}
      className={`
        absolute rounded-full blur-3xl
        bg-gradient-radial ${colorClasses[orb.color]}
      `}
    />
  );
}

function FloatingParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 10 + 15,
    delay: Math.random() * 5,
  }));

  return (
    <>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-teal-400/30"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </>
  );
}
