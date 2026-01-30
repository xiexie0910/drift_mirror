'use client';

/**
 * TextReveal - Animated text that reveals word by word
 * 
 * Creates an engaging entrance for headlines and quotes.
 */

import { ReactNode, Children, isValidElement, cloneElement } from 'react';
import { motion, Variants } from 'framer-motion';

interface TextRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  staggerChildren?: number;
  once?: boolean;
}

const containerVariants: Variants = {
  hidden: {},
  visible: (custom: { staggerChildren: number }) => ({
    transition: {
      staggerChildren: custom.staggerChildren,
    },
  }),
};

const wordVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    rotateX: 45,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    rotateX: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 12,
    },
  },
};

export function TextReveal({
  children,
  className = '',
  delay = 0,
  staggerChildren = 0.05,
  once = true,
}: TextRevealProps) {
  // Extract text and split into words
  const text = typeof children === 'string' ? children : '';
  const words = text.split(' ');

  return (
    <motion.span
      className={`inline-block ${className}`}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once }}
      custom={{ staggerChildren }}
      style={{ perspective: 500 }}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          variants={wordVariants}
          className="inline-block mr-[0.25em]"
          style={{ transformOrigin: 'bottom' }}
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
}

/**
 * CharacterReveal - Even more dramatic letter-by-letter reveal
 */
interface CharacterRevealProps {
  children: string;
  className?: string;
  staggerChildren?: number;
}

const charVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 50,
    scale: 0.5,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 15,
    },
  },
};

export function CharacterReveal({
  children,
  className = '',
  staggerChildren = 0.03,
}: CharacterRevealProps) {
  const characters = children.split('');

  return (
    <motion.span
      className={`inline-block ${className}`}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      custom={{ staggerChildren }}
    >
      {characters.map((char, i) => (
        <motion.span
          key={i}
          variants={charVariants}
          className="inline-block"
          style={{ whiteSpace: char === ' ' ? 'pre' : 'normal' }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
}

/**
 * SlideUp - Simple slide up animation for containers
 */
interface SlideUpProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export function SlideUp({
  children,
  className = '',
  delay = 0,
  duration = 0.6,
}: SlideUpProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * FadeIn - Simple fade animation
 */
interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

export function FadeIn({
  children,
  className = '',
  delay = 0,
  direction = 'up',
}: FadeInProps) {
  const directionMap = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 },
    none: {},
  };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...directionMap[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.5,
        delay,
        ease: 'easeOut',
      }}
    >
      {children}
    </motion.div>
  );
}
