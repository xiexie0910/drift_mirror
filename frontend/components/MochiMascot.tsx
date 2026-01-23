'use client';

/**
 * DriftMirror Mochi Mascot
 * ============================================================
 * 
 * A cute, lively mochi character that lives in the bottom right corner.
 * Drinks water when user checks in!
 */

import { useState, useEffect, useCallback, useContext } from 'react';
import { CelebrationContext } from './CelebrationProvider';

interface MochiMascotProps {
  size?: number;
  className?: string;
  showWatering?: boolean;
  onWateringComplete?: () => void;
}

export function MochiMascot({ 
  size = 80, 
  className = '',
  showWatering = false,
  onWateringComplete,
}: MochiMascotProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const [isWatering, setIsWatering] = useState(false);
  const [isSatisfied, setIsSatisfied] = useState(false);
  const [frame, setFrame] = useState(0);
  
  // Connect to celebration context if available
  const celebration = useContext(CelebrationContext);

  // Lively idle animation
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(prev => (prev + 1) % 4);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  // Handle watering animation from prop or celebration context
  useEffect(() => {
    const shouldWater = showWatering || celebration?.isCelebrating;
    if (shouldWater && !isWatering) {
      setIsWatering(true);
      setTimeout(() => {
        setIsWatering(false);
        setIsSatisfied(true);
        setTimeout(() => {
          setIsSatisfied(false);
          onWateringComplete?.();
        }, 1500);
      }, 2000);
    }
  }, [showWatering, celebration?.isCelebrating, isWatering, onWateringComplete]);

  const handleClick = () => {
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 600);
  };

  // Double-click triggers watering (for testing)
  const handleDoubleClick = () => {
    if (!isWatering && !isSatisfied) {
      setIsWatering(true);
      setTimeout(() => {
        setIsWatering(false);
        setIsSatisfied(true);
        setTimeout(() => {
          setIsSatisfied(false);
          onWateringComplete?.();
        }, 1500);
      }, 2000);
    }
  };

  // Playful wobble animation (paused when watering)
  const getWobble = () => {
    if (isWatering || isSatisfied) {
      return { rotate: 0, scaleX: 1.03, scaleY: 0.97, translateY: 0 };
    }
    const wobbles = [
      { rotate: -2, scaleX: 1.02, scaleY: 0.98, translateY: 0 },
      { rotate: 0, scaleX: 1, scaleY: 1, translateY: -3 },
      { rotate: 2, scaleX: 1.02, scaleY: 0.98, translateY: 0 },
      { rotate: 0, scaleX: 1, scaleY: 1, translateY: -3 },
    ];
    return wobbles[frame];
  };

  const wobble = getWobble();

  return (
    <div
      className={`fixed bottom-6 right-6 z-40 cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      style={{
        transform: `translateY(${wobble.translateY}px) rotate(${wobble.rotate}deg) scale(${isHovered ? 1.12 : 1})`,
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
      title="Hi! I'm Mochi, your DriftMirror companion 🍡"
    >
      {/* Soft glow behind mochi */}
      <div 
        className="absolute inset-0 rounded-full blur-xl transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle, rgba(20, 184, 166, ${isSatisfied ? 0.6 : 0.4}) 0%, transparent 70%)`,
          transform: 'scale(1.8)',
          opacity: isHovered || isSatisfied ? 1 : 0.7,
        }}
      />

      {/* Drinking cup animation */}
      {isWatering && (
        <div 
          className="absolute pointer-events-none"
          style={{
            top: 8,
            right: -35,
          }}
        >
          <style>{`
            @keyframes tip-cup {
              0%, 10% { transform: rotate(0deg); }
              30%, 70% { transform: rotate(-45deg); }
              90%, 100% { transform: rotate(0deg); }
            }
            @keyframes water-pour {
              0%, 15% { opacity: 0; transform: scaleY(0); }
              25%, 65% { opacity: 0.8; transform: scaleY(1); }
              75%, 100% { opacity: 0; transform: scaleY(0); }
            }
            @keyframes gulp {
              0%, 100% { transform: scaleY(1); }
              50% { transform: scaleY(0.85); }
            }
          `}</style>
          <svg 
            width="45" 
            height="50" 
            viewBox="0 0 45 50"
            style={{
              animation: 'tip-cup 2s ease-in-out infinite',
              transformOrigin: 'bottom left',
            }}
          >
            <defs>
              <linearGradient id="cupGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#E0F2FE" />
                <stop offset="50%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#BAE6FD" />
              </linearGradient>
              <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#5EEAD4" />
                <stop offset="100%" stopColor="#14B8A6" />
              </linearGradient>
            </defs>
            
            {/* Cup body */}
            <path
              d="M8 8 L12 42 Q15 48 22 48 Q29 48 32 42 L36 8 Z"
              fill="url(#cupGrad)"
              stroke="#94A3B8"
              strokeWidth="1.5"
            />
            
            {/* Cup handle */}
            <path
              d="M36 15 Q46 15 46 25 Q46 35 36 35"
              fill="none"
              stroke="#94A3B8"
              strokeWidth="3"
              strokeLinecap="round"
            />
            
            {/* Water inside cup */}
            <path
              d="M10 14 L13 38 Q15 43 22 43 Q29 43 31 38 L34 14 Z"
              fill="url(#waterGrad)"
              opacity="0.8"
            />
            
            {/* Water surface shine */}
            <ellipse cx="22" cy="14" rx="11" ry="3" fill="#99F6E4" opacity="0.6" />
            
            {/* Cup rim highlight */}
            <path
              d="M8 8 L36 8"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.7"
            />
          </svg>
          
          {/* Water stream pouring out */}
          <svg 
            width="20" 
            height="30" 
            viewBox="0 0 20 30"
            style={{
              position: 'absolute',
              top: 5,
              left: -8,
              animation: 'water-pour 2s ease-in-out infinite',
              transformOrigin: 'top center',
            }}
          >
            <path
              d="M10 0 Q8 10 10 20 Q12 30 10 30"
              stroke="#5EEAD4"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              opacity="0.8"
            />
            <path
              d="M9 2 Q7 12 9 22"
              stroke="#99F6E4"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              opacity="0.6"
            />
          </svg>
        </div>
      )}
      
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative"
        style={{
          transform: `scaleX(${wobble.scaleX}) scaleY(${wobble.scaleY}) ${isWatering ? 'rotate(-8deg)' : ''}`,
          transformOrigin: 'center bottom',
          transition: 'transform 0.3s ease-out',
          filter: 'drop-shadow(0 6px 12px rgba(13, 148, 136, 0.25))',
        }}
      >
        {/* Mochi body - realistic mochi shape: soft, slightly squished, organic */}
        <path
          d="M50 15
             C28 15, 15 28, 12 45
             C10 58, 14 72, 25 82
             C35 90, 45 92, 50 92
             C55 92, 65 90, 75 82
             C86 72, 90 58, 88 45
             C85 28, 72 15, 50 15"
          fill="url(#mochiGradient)"
        />
        
        {/* Mochi soft highlight - makes it look squishy */}
        <ellipse
          cx="38"
          cy="35"
          rx="18"
          ry="12"
          fill="white"
          opacity="0.6"
        />
        
        {/* Secondary subtle highlight */}
        <ellipse
          cx="60"
          cy="45"
          rx="10"
          ry="8"
          fill="white"
          opacity="0.3"
        />
        
        {/* Left eye - looks toward cup when drinking */}
        <ellipse
          cx={isWatering ? 42 : 38}
          cy={isWatering ? 48 : isBouncing ? 48 : 50}
          rx="5"
          ry={isSatisfied ? 2 : isWatering ? 5 : isHovered ? 2.5 : isBouncing ? 7 : 6}
          fill="#0D9488"
          style={{ transition: 'all 0.2s ease' }}
        />
        
        {/* Right eye - looks toward cup when drinking */}
        <ellipse
          cx={isWatering ? 66 : 62}
          cy={isWatering ? 48 : isBouncing ? 48 : 50}
          rx="5"
          ry={isSatisfied ? 2 : isWatering ? 5 : isHovered ? 2.5 : isBouncing ? 7 : 6}
          fill="#0D9488"
          style={{ transition: 'all 0.2s ease' }}
        />
        
        {/* Eye sparkles */}
        {!isHovered && !isWatering && !isSatisfied && (
          <>
            <circle cx="36" cy="47" r="2" fill="white" opacity="0.9" />
            <circle cx="60" cy="47" r="2" fill="white" opacity="0.9" />
          </>
        )}
        
        {/* Mouth - drinking from side */}
        {isWatering ? (
          // Drinking mouth - tilted to the side
          <ellipse
            cx="55"
            cy="65"
            rx="6"
            ry="7"
            fill="#0D9488"
            opacity="0.7"
            style={{ 
              animation: 'gulp 0.4s ease-in-out infinite',
            }}
          />
        ) : isSatisfied ? (
          // Super happy after drinking
          <path
            d="M38 58 Q50 75 62 58"
            stroke="#0D9488"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        ) : (
          <path
            d={isBouncing 
              ? "M40 62 Q50 75 60 62"
              : isHovered 
                ? "M42 60 Q50 70 58 60"
                : "M44 58 Q50 66 56 58"
            }
            stroke="#0D9488"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            style={{ transition: 'all 0.2s ease' }}
          />
        )}
        
        {/* Sparkle decorations */}
        <g style={{ opacity: isHovered || isSatisfied ? 1 : 0.6, transition: 'opacity 0.3s ease' }}>
          <path
            d="M5 40 L7 45 L5 50 L3 45 Z"
            fill="#5EEAD4"
            style={{ 
              transform: `scale(${frame % 2 === 0 ? 1 : 1.2})`,
              transformOrigin: '5px 45px',
              transition: 'transform 0.3s ease',
            }}
          />
          <path
            d="M95 35 L97 40 L95 45 L93 40 Z"
            fill="#5EEAD4"
            style={{ 
              transform: `scale(${frame % 2 === 1 ? 1 : 1.2})`,
              transformOrigin: '95px 40px',
              transition: 'transform 0.3s ease',
            }}
          />
          <circle 
            cx="88" 
            cy="55" 
            r={frame % 2 === 0 ? 2.5 : 3} 
            fill="#99F6E4" 
          />
          <circle 
            cx="12" 
            cy="60" 
            r={frame % 2 === 1 ? 2 : 2.5} 
            fill="#99F6E4" 
          />
        </g>

        {/* Satisfaction sparkles */}
        {isSatisfied && (
          <g className="animate-pulse">
            <path d="M18 22 L20 26 L18 30 L16 26 Z" fill="#2DD4BF" />
            <path d="M82 18 L84 22 L82 26 L80 22 Z" fill="#2DD4BF" />
            <circle cx="8" cy="70" r="3" fill="#99F6E4" />
            <circle cx="92" cy="65" r="2.5" fill="#99F6E4" />
            <path d="M25 10 L27 13 L25 16 L23 13 Z" fill="#5EEAD4" />
            <path d="M75 8 L77 11 L75 14 L73 11 Z" fill="#5EEAD4" />
          </g>
        )}

        {/* Gradient definitions */}
        <defs>
          {/* Main body gradient - soft cream mochi look */}
          <radialGradient id="mochiGradient" cx="0.35" cy="0.3" r="0.75">
            <stop offset="0%" stopColor="#FFFFFE" />
            <stop offset="40%" stopColor="#F5FFFD" />
            <stop offset="75%" stopColor="#E6FFFA" />
            <stop offset="100%" stopColor="#CCFBF1" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

// Hook to manage mascot state
export function useMascotState() {
  const [showWatering, setShowWatering] = useState(false);

  const triggerWatering = useCallback(() => {
    setShowWatering(true);
  }, []);

  const onWateringComplete = useCallback(() => {
    setShowWatering(false);
  }, []);

  return {
    showWatering,
    triggerWatering,
    onWateringComplete,
  };
}

