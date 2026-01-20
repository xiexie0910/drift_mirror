import { InputHTMLAttributes, forwardRef } from 'react';

/**
 * Input Component
 * 
 * Calm Futurism Design
 * - Glass-style input with frosted background
 * - Teal focus glow
 * - Subtle elevation on focus
 */

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'glass';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', variant = 'default', ...props }, ref) => {
    const variants = {
      default: `
        bg-white/80
        backdrop-blur-sm
        border border-white/60
        shadow-sm
        focus:bg-white
        focus:shadow-lg focus:shadow-teal-500/10
        focus:border-teal-400
      `,
      glass: `
        bg-white/40
        backdrop-blur-md
        border border-white/50
        focus:bg-white/60
        focus:shadow-lg focus:shadow-teal-500/10
        focus:border-teal-400
      `,
    };

    return (
      <input
        ref={ref}
        className={`
          w-full px-4 py-3
          rounded-xl 
          text-neutral-800
          placeholder:text-neutral-400
          transition-all duration-300 ease-out
          focus:outline-none 
          focus:-translate-y-0.5
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variants[variant]}
          ${className}
        `}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
