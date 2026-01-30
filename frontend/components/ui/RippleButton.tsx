'use client';

/**
 * RippleButton - Button with satisfying ripple effect on click
 */

import { useState, useCallback, ReactNode, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface RippleButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  variant?: 'primary' | 'glass' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function RippleButton({
  children,
  onClick,
  className = '',
  disabled = false,
  variant = 'primary',
  size = 'md',
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handleClick = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    
    const newRipple: Ripple = {
      id: Date.now(),
      x: e.clientX - rect.left - size / 2,
      y: e.clientY - rect.top - size / 2,
      size,
    };
    
    setRipples((prev) => [...prev, newRipple]);
    
    // Clean up ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);
    
    onClick?.();
  }, [disabled, onClick]);

  const variantClasses = {
    primary: 'bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-lg shadow-teal-500/20 hover:shadow-xl hover:shadow-teal-500/30 hover:from-teal-500 hover:to-teal-400',
    glass: 'glass-strong text-teal-700 hover:text-teal-600 border border-teal-200/50',
    outline: 'border-2 border-teal-500 text-teal-600 hover:bg-teal-50 hover:border-teal-600',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm rounded-lg gap-2',
    md: 'px-6 py-3 text-base rounded-xl gap-2',
    lg: 'px-8 py-4 text-lg rounded-2xl gap-3',
  };

  const rippleColor = variant === 'primary' ? 'rgba(255,255,255,0.4)' : 'rgba(20,184,166,0.3)';

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={`
        relative overflow-hidden font-medium transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        flex items-center justify-center
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {/* Ripple effects */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
              borderRadius: '50%',
              backgroundColor: rippleColor,
              pointerEvents: 'none',
            }}
          />
        ))}
      </AnimatePresence>
      
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </motion.button>
  );
}
