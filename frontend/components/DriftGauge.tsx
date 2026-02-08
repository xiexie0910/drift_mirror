'use client';

/**
 * DriftGauge — Animated Circular Drift Score Indicator
 * ============================================================
 * 
 * Visual gauge showing drift score from 0.0 to 1.0:
 *  - Green  (0.0 – 0.3): On track
 *  - Amber  (0.3 – 0.6): Drifting
 *  - Red    (0.6 – 1.0): Needs attention
 * 
 * Uses SVG arc + CSS transitions for smooth animation.
 */

import { useEffect, useState } from 'react';

interface DriftGaugeProps {
  /** Drift score between 0 and 1 */
  score: number;
  /** Diameter of the gauge in pixels */
  size?: number;
  /** Stroke width of the gauge arc */
  strokeWidth?: number;
  /** Whether to show the numeric label inside */
  showLabel?: boolean;
  /** Optional className for the container */
  className?: string;
}

function getGaugeColor(score: number): string {
  if (score <= 0.3) return '#14b8a6';   // teal-500  — on track
  if (score <= 0.6) return '#f59e0b';   // amber-500 — drifting
  return '#ef4444';                      // red-500   — needs attention
}

function getStatusText(score: number): string {
  if (score <= 0.3) return 'On track';
  if (score <= 0.6) return 'Drifting';
  return 'Needs attention';
}

export function DriftGauge({
  score,
  size = 120,
  strokeWidth = 10,
  showLabel = true,
  className = '',
}: DriftGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  
  // Animate the score on mount / change
  useEffect(() => {
    // Small delay so the animation is visible on mount
    const timer = setTimeout(() => {
      setAnimatedScore(Math.min(1, Math.max(0, score)));
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  
  // We draw a 270° arc (from 135° to 405° = 270° sweep)
  // This leaves a 90° gap at the bottom
  const arcAngle = 270;
  const startAngle = 135; // degrees, measured clockwise from 12 o'clock (SVG standard: from 3 o'clock)
  const circumference = (arcAngle / 360) * 2 * Math.PI * radius;
  
  // dashoffset controls how much of the arc is "filled"
  const dashOffset = circumference * (1 - animatedScore);
  
  const color = getGaugeColor(animatedScore);
  const statusText = getStatusText(animatedScore);
  
  // Convert angle to SVG coordinates
  // SVG angles: 0 = right (3 o'clock), goes clockwise
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  
  // Start at 135° (bottom-left), end at 45° (bottom-right) — 270° arc
  const svgStartAngle = startAngle;
  const svgEndAngle = startAngle + arcAngle;
  
  const startX = center + radius * Math.cos(toRad(svgStartAngle));
  const startY = center + radius * Math.sin(toRad(svgStartAngle));
  const endX = center + radius * Math.cos(toRad(svgEndAngle));
  const endY = center + radius * Math.sin(toRad(svgEndAngle));
  
  // SVG arc path: M startX,startY A rx,ry rotation large-arc-flag sweep-flag endX,endY
  const largeArcFlag = arcAngle > 180 ? 1 : 0;
  const bgPath = `M ${startX},${startY} A ${radius},${radius} 0 ${largeArcFlag} 1 ${endX},${endY}`;

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-0"
      >
        {/* Background track */}
        <path
          d={bgPath}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="text-neutral-200"
        />
        
        {/* Animated fill arc */}
        <path
          d={bgPath}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transition: 'stroke-dashoffset 1s ease-out, stroke 0.5s ease',
          }}
        />
        
        {/* Glow filter for the filled arc */}
        <defs>
          <filter id="gauge-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
      
      {/* Center label */}
      {showLabel && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ paddingBottom: size * 0.08 }}
        >
          <span
            className="font-bold tabular-nums transition-colors duration-500"
            style={{
              fontSize: size * 0.22,
              color,
            }}
          >
            {(animatedScore * 100).toFixed(0)}
          </span>
          <span
            className="text-neutral-500 font-medium"
            style={{ fontSize: size * 0.09 }}
          >
            drift
          </span>
        </div>
      )}
      
      {/* Status text below */}
      <p
        className="mt-1 font-medium transition-colors duration-500"
        style={{
          fontSize: Math.max(11, size * 0.1),
          color,
        }}
      >
        {statusText}
      </p>
    </div>
  );
}
