'use client';

/**
 * Celebration Provider
 * ============================================================
 * 
 * Global context for triggering water celebration animations
 * when users complete check-ins.
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface CelebrationContextType {
  isCelebrating: boolean;
  triggerCelebration: () => void;
  onCelebrationComplete: () => void;
}

export const CelebrationContext = createContext<CelebrationContextType | null>(null);

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [isCelebrating, setIsCelebrating] = useState(false);

  const triggerCelebration = useCallback(() => {
    setIsCelebrating(true);
    // Auto-dismiss after animation completes
    setTimeout(() => setIsCelebrating(false), 3000);
  }, []);

  const onCelebrationComplete = useCallback(() => {
    setIsCelebrating(false);
  }, []);

  // Generate confetti pieces with varied properties
  const confettiPieces = Array.from({ length: 60 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1 + Math.random() * 1,
    size: 6 + Math.random() * 10,
    color: [
      '#14B8A6', '#5EEAD4', '#2DD4BF', '#99F6E4', // Teal spectrum
      '#F472B6', '#FB7185', '#FBBF24', '#A78BFA', // Accents
      '#34D399', '#60A5FA', '#F87171', '#FACC15', // More colors
      '#818CF8', '#FB923C', '#4ADE80', '#22D3EE', // Extra variety
    ][Math.floor(Math.random() * 16)],
    rotation: Math.random() * 360,
    rotationSpeed: 180 + Math.random() * 540,
    drift: -40 + Math.random() * 80,
    shape: Math.random() > 0.6 ? 'rect' : Math.random() > 0.5 ? 'circle' : 'strip',
  }));

  return (
    <CelebrationContext.Provider value={{ isCelebrating, triggerCelebration, onCelebrationComplete }}>
      {children}
      
      {/* Confetti celebration overlay */}
      {isCelebrating && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          <style>{`
            @keyframes confetti-fall {
              0% {
                transform: translateY(0) rotate(0deg);
                opacity: 1;
              }
              100% {
                transform: translateY(110vh) rotate(720deg);
                opacity: 0.7;
              }
            }
            @keyframes success-appear {
              0% { 
                transform: translate(-50%, -50%) scale(0.5);
                opacity: 0;
              }
              60% { 
                transform: translate(-50%, -50%) scale(1.05);
                opacity: 1;
              }
              100% { 
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
              }
            }
            @keyframes success-exit {
              0% { 
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
              }
              100% { 
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.9) translateY(-30px);
              }
            }
          `}</style>
          
          {/* Confetti pieces */}
          {confettiPieces.map((piece) => (
            <div
              key={piece.id}
              className="absolute"
              style={{
                left: `${piece.left}%`,
                top: -30,
                animation: `confetti-fall ${piece.duration}s ease-in forwards`,
                animationDelay: `${piece.delay}s`,
              }}
            >
              {piece.shape === 'rect' ? (
                <div
                  style={{
                    width: piece.size,
                    height: piece.size * 0.6,
                    backgroundColor: piece.color,
                    borderRadius: 2,
                  }}
                />
              ) : piece.shape === 'strip' ? (
                <div
                  style={{
                    width: piece.size * 0.4,
                    height: piece.size * 1.5,
                    backgroundColor: piece.color,
                    borderRadius: 1,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: piece.size * 0.8,
                    height: piece.size * 0.8,
                    backgroundColor: piece.color,
                    borderRadius: '50%',
                  }}
                />
              )}
            </div>
          ))}
          
          {/* Streamers / ribbons */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={`ribbon-${i}`}
              className="absolute"
              style={{
                left: `${2 + i * 4}%`,
                top: -50,
                width: 3 + Math.random() * 3,
                height: 30 + Math.random() * 40,
                background: `linear-gradient(180deg, ${
                  ['#14B8A6', '#F472B6', '#FBBF24', '#A78BFA', '#34D399', '#60A5FA', '#FB7185', '#22D3EE'][i % 8]
                }, transparent)`,
                borderRadius: 2,
                animation: `confetti-fall ${1.2 + Math.random() * 0.8}s ease-in forwards`,
                animationDelay: `${Math.random() * 0.3}s`,
              }}
            />
          ))}
          
          {/* Success message */}
          <div 
            className="absolute top-1/3 left-1/2"
            style={{
              animation: 'success-appear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, success-exit 0.5s ease-out 2.3s forwards',
            }}
          >
            <div className="bg-white/95 backdrop-blur-sm text-teal-700 px-6 py-3 rounded-2xl shadow-xl border border-teal-200">
              <div className="flex items-center gap-3 whitespace-nowrap">
                <span className="text-2xl">🎉</span>
                <span className="font-semibold text-lg">Check-in saved!</span>
                <span className="text-2xl">✨</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </CelebrationContext.Provider>
  );
}

export function useCelebration() {
  const context = useContext(CelebrationContext);
  if (!context) {
    throw new Error('useCelebration must be used within a CelebrationProvider');
  }
  return context;
}
