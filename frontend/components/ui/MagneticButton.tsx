'use client';

/**
 * MagneticButton - Award-winning button with magnetic hover effect
 * 
 * The button subtly follows the cursor when hovered, creating
 * a satisfying "magnetic" pull effect.
 */

import { useRef, useState, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'glass' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  magneticStrength?: number;
}

export function MagneticButton({
  children,
  className = '',
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  magneticStrength = 0.3,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current || disabled) return;
    
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const middleX = left + width / 2;
    const middleY = top + height / 2;
    
    setPosition({
      x: (clientX - middleX) * magneticStrength,
      y: (clientY - middleY) * magneticStrength,
    });
  };

  const reset = () => setPosition({ x: 0, y: 0 });

  const variantClasses = {
    primary: 'bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30',
    glass: 'glass-strong text-teal-700 hover:text-teal-600',
    ghost: 'bg-transparent text-neutral-600 hover:text-teal-600 hover:bg-teal-50/50',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-base rounded-xl',
    lg: 'px-8 py-4 text-lg rounded-2xl',
  };

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      disabled={disabled}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 350, damping: 15, mass: 0.5 }}
      whileTap={{ scale: 0.97 }}
      className={`
        relative font-medium transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {/* Shine effect on hover */}
      <motion.div
        className="absolute inset-0 rounded-inherit overflow-hidden pointer-events-none"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
        />
      </motion.div>
      
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
}
