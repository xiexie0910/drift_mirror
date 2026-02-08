'use client';

/**
 * DriftMirror Home Page
 * ============================================================
 * 
 * Design: Calm Futurism with Glass Materials
 * - Premium glass card
 * - Subtle animations
 * - Ambient depth
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles, Play } from 'lucide-react';
import { api } from '@/lib/api';

export default function Home() {
  const router = useRouter();
  const [hasResolution, setHasResolution] = useState<boolean | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  useEffect(() => {
    // Check if user has any goals - if so, go to unified dashboard
    api.getResolutions().then((resolutions) => {
      if (resolutions.length > 0) {
        setHasResolution(true);
        router.push('/dashboard');
      } else {
        setHasResolution(false);
      }
    }).catch(() => setHasResolution(false));
  }, [router]);

  // Loading state - elegant glass loader
  if (hasResolution === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-subtle p-8 rounded-2xl animate-pulse-soft">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <p className="text-neutral-500 text-sm">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full space-y-8">
        {/* Decorative teal line top */}
        <div className="teal-line w-32 mx-auto rounded-full" />
        
        {/* Header with subtle animation */}
        <div 
          className="text-center space-y-4 animate-fade-in-up"
          style={{ animationDelay: '0.1s' }}
        >
          {/* Logo mark with strong teal glow */}
          <div className="flex justify-center mb-6">
            <div className="glass-strong p-5 rounded-2xl glow-teal-strong relative">
              <Sparkles className="w-10 h-10 text-teal-600" />
              {/* Teal ring accent */}
              <div className="absolute inset-0 rounded-2xl border-2 border-teal-400/30 animate-pulse-soft" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-700 via-teal-600 to-teal-500 bg-clip-text text-transparent tracking-tight">
            DriftMirror
          </h1>
          <p className="text-lg text-teal-700/70">
            A system for observing behavior and adapting plans.
          </p>
        </div>

        {/* Primary glass card with teal accent border */}
        <div 
          className="glass-strong p-8 space-y-6 animate-fade-in-up relative overflow-hidden"
          style={{ animationDelay: '0.2s' }}
        >
          {/* Decorative teal accent corner */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-teal-400/20 to-transparent rounded-bl-full" />
          
          {/* System explanation */}
          <div className="space-y-4 text-neutral-600 relative z-10">
            <p className="text-base leading-relaxed">
              This system helps you track what actually happens, 
              not what you hope will happen.
            </p>
            <p className="text-base leading-relaxed">
              Start with a goal. The system observes your behavior 
              and adjusts the plan based on real data.
            </p>
          </div>
          
          {/* Decorative teal divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-teal-400 to-transparent" />
          
          {/* Primary CTA */}
          <button 
            onClick={() => router.push('/onboarding')} 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="w-full btn-primary py-4 px-6 rounded-xl font-medium text-base flex items-center justify-center gap-3 group relative overflow-hidden"
          >
            {/* Shimmer effect on button */}
            <div className="absolute inset-0 teal-shimmer" />
            <span className="relative z-10">Set up your goal</span>
            <ArrowRight 
              className={`w-5 h-5 relative z-10 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} 
            />
          </button>
          
          {/* Demo CTA */}
          <button 
            onClick={async () => {
              setIsDemoLoading(true);
              try {
                const result = await api.seedDemo();
                router.push(`/dashboard/${result.resolution_id}`);
              } catch (err) {
                console.error('Demo seed failed:', err);
                setIsDemoLoading(false);
              }
            }}
            disabled={isDemoLoading}
            className="w-full py-3 px-6 rounded-xl font-medium text-sm flex items-center justify-center gap-2 glass-subtle text-teal-700 hover:bg-teal-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDemoLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                <span>Loading demo...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Try a demo instead</span>
              </>
            )}
          </button>
        </div>

        {/* How it works - glass grid with teal accents */}
        <div 
          className="space-y-4 animate-fade-in-up"
          style={{ animationDelay: '0.3s' }}
        >
          <p className="font-medium text-teal-700 text-sm text-center">How it works</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { num: '01', text: 'Define a goal and minimum action' },
              { num: '02', text: 'Log brief check-ins on what happened' },
              { num: '03', text: 'System identifies patterns and drift' },
              { num: '04', text: 'Plan adapts based on your behavior' },
            ].map((step, i) => (
              <div 
                key={i} 
                className="glass-subtle p-4 rounded-xl transition-all duration-300 hover:scale-[1.03] hover:glow-teal-soft group"
              >
                <span className="text-teal-500 font-mono text-xs font-bold group-hover:text-teal-600">{step.num}</span>
                <p className="text-neutral-600 text-sm mt-2">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Bottom decorative element */}
        <div className="flex justify-center gap-2 pt-4">
          <div className="w-2 h-2 rounded-full bg-teal-400/50 animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-teal-500/50 animate-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 rounded-full bg-teal-400/50 animate-pulse" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
}
