'use client';

/**
 * AnimatedCounter - Counts up from 0 to target value
 * 
 * Creates a satisfying number animation when values change.
 */

import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
  decimals?: number;
}

export function AnimatedCounter({
  value,
  duration = 1.5,
  className = '',
  suffix = '',
  prefix = '',
  decimals = 0,
}: AnimatedCounterProps) {
  const spring = useSpring(0, { duration: duration * 1000 });
  const display = useTransform(spring, (current) => 
    `${prefix}${current.toFixed(decimals)}${suffix}`
  );
  const [displayValue, setDisplayValue] = useState(`${prefix}0${suffix}`);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    return display.on('change', (latest) => {
      setDisplayValue(latest);
    });
  }, [display]);

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {displayValue}
    </motion.span>
  );
}

/**
 * AnimatedPercentage - Animated percentage with circular progress
 */
interface AnimatedPercentageProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
}

export function AnimatedPercentage({
  value,
  size = 80,
  strokeWidth = 6,
  className = '',
  label,
}: AnimatedPercentageProps) {
  const normalizedValue = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const spring = useSpring(0, { stiffness: 50, damping: 20 });
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    spring.set(normalizedValue);
  }, [spring, normalizedValue]);

  useEffect(() => {
    return spring.on('change', (latest) => {
      const newOffset = circumference - (latest / 100) * circumference;
      setOffset(newOffset);
    });
  }, [spring, circumference]);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          className="text-neutral-200"
          fill="none"
        />
        {/* Animated progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="url(#progressGradient)"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          initial={{ strokeDashoffset: circumference }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#5eead4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedCounter
          value={normalizedValue}
          suffix="%"
          className="text-lg font-bold text-teal-700"
        />
        {label && <span className="text-xs text-neutral-500">{label}</span>}
      </div>
    </div>
  );
}
