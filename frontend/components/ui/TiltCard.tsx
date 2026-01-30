'use client';

/**
 * TiltCard - 3D tilt effect that follows cursor
 * 
 * Creates a premium feel by tilting toward the mouse position.
 */

import { useRef, useState, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  tiltAmount?: number;
  glareOpacity?: number;
  scale?: number;
}

export function TiltCard({
  children,
  className = '',
  tiltAmount = 10,
  glareOpacity = 0.15,
  scale = 1.02,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateXValue = ((y - centerY) / centerY) * -tiltAmount;
    const rotateYValue = ((x - centerX) / centerX) * tiltAmount;
    
    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
    setGlarePosition({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    });
  };

  const reset = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePosition({ x: 50, y: 50 });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{
        rotateX,
        rotateY,
        scale: rotateX !== 0 || rotateY !== 0 ? scale : 1,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
      className={`relative ${className}`}
    >
      {children}
      
      {/* Dynamic glare effect */}
      <motion.div
        className="absolute inset-0 rounded-inherit pointer-events-none overflow-hidden"
        style={{
          background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,${glareOpacity}) 0%, transparent 60%)`,
        }}
        animate={{ opacity: rotateX !== 0 || rotateY !== 0 ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />
    </motion.div>
  );
}
