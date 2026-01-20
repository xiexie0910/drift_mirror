import { HTMLAttributes, forwardRef } from 'react';

/**
 * Card Component
 * 
 * Calm Futurism Design System
 * 
 * Variants:
 * - default: Subtle glass for general content
 * - elevated: Strong glass with depth for primary content
 * - glass: Standard glass panel
 * - glass-strong: Premium frosted glass for featured content
 * - surface: Solid white surface when glass isn't appropriate
 */

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass' | 'glass-strong' | 'surface';
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', hover = false, children, ...props }, ref) => {
    const baseStyles = 'transition-all duration-300';
    
    const variants = {
      // Default - subtle glass
      default: `
        glass-subtle
        p-6
      `,
      // Elevated - strong glass with more depth
      elevated: `
        glass-strong
        p-6
      `,
      // Standard glass
      glass: `
        glass-subtle
        p-6
      `,
      // Premium strong glass
      'glass-strong': `
        glass-strong
        p-6
      `,
      // Solid surface (for forms, inputs)
      surface: `
        bg-white/90
        backdrop-blur-sm
        border border-white/60
        rounded-xl
        shadow-lg shadow-black/[0.03]
        p-6
      `,
    };
    
    const hoverStyles = hover ? `
      hover:scale-[1.02]
      hover:shadow-xl
      cursor-pointer
    ` : '';

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${hoverStyles} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
