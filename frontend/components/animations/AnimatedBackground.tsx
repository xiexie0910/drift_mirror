'use client';

import { ReactNode } from 'react';

/**
 * DriftMirror Animation Components
 * ============================================================
 * 
 * Design Philosophy:
 * - Motion explains state, never entertains
 * - Fade + small translate only
 * - Scale 0.98 → 1.0 transitions
 * - NO particles, sparkles, shimmer, or confetti
 * - NO bounces, springs, or elastic effects
 * 
 * Glass is used ONLY for observational overlays, not decoration
 */

// Simple fade-in wrapper for page content
export function PageTransition({ 
  children, 
  className = '' 
}: { 
  children: ReactNode; 
  className?: string 
}) {
  return (
    <div 
      className={`animate-fade-in ${className}`}
    >
      {children}
    </div>
  );
}

// Removed: AnimatedBackground, FloatingParticles, FloatingShapes, 
// AnimatedDecorations, FloatingImage
// These violate the design philosophy of restraint and calm

// Stub exports to prevent import errors during migration
// These will be removed after page refactoring
export const AnimatedBackground = () => null;
export const FloatingParticles = () => null;
export const FloatingShapes = () => null;
export const AnimatedDecorations = () => null;
export const FloatingImage = () => null;
