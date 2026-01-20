import { ButtonHTMLAttributes, forwardRef } from 'react';

/**
 * Button Component
 * 
 * Calm Futurism Design System
 * - Primary: Gradient teal with glow
 * - Secondary: Glass button
 * - Ghost: Minimal for tertiary
 */

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, disabled, ...props }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center 
      font-medium rounded-xl
      transition-all duration-300 ease-out
      focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
      active:scale-[0.98]
    `;
    
    const variants = {
      // Primary: Vibrant teal gradient with strong glow
      primary: `
        bg-gradient-to-r from-teal-500 via-teal-500 to-teal-400
        text-white font-semibold
        shadow-xl shadow-teal-500/35
        hover:shadow-2xl hover:shadow-teal-500/45
        hover:from-teal-400 hover:via-teal-500 hover:to-teal-400
        hover:-translate-y-0.5
        border border-teal-400/30
      `,
      // Secondary: Teal-tinted glass button
      secondary: `
        bg-gradient-to-r from-teal-50/80 to-white/60 backdrop-blur-sm
        text-teal-700 
        border border-teal-200/60
        shadow-lg shadow-teal-500/10
        hover:from-teal-100/80 hover:to-white/80 hover:border-teal-300/70
        hover:-translate-y-0.5
        hover:shadow-xl hover:shadow-teal-500/15
      `,
      // Ghost: Subtle teal hover
      ghost: `
        text-teal-600 
        hover:bg-teal-50/50 hover:text-teal-700
        hover:backdrop-blur-sm
      `,
      // Glass: Frosted teal-tinted glass button
      glass: `
        bg-gradient-to-r from-teal-100/40 to-white/40 backdrop-blur-md
        text-teal-700
        border border-teal-200/40
        shadow-lg shadow-teal-500/10
        hover:from-teal-100/60 hover:to-white/60 hover:border-teal-300/50
        hover:-translate-y-0.5
        hover:shadow-xl hover:shadow-teal-500/15
      `,
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm gap-1.5',
      md: 'px-5 py-2.5 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
