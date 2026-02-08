'use client';

/**
 * DriftMirror Mirror Page
 * ============================================================
 * 
 * Calm Futurism Design - The Mirror represents system insights
 * Security: Error handling without console exposure
 */

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { InsightCard } from '@/components/InsightCard';
import { ChevronDown, ArrowLeft, ThumbsUp, ThumbsDown, Sparkles, Eye, Loader2 } from 'lucide-react';
import { api, Dashboard } from '@/lib/api';

function MirrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const goalId = searchParams.get('goal');
  
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [expandedFindings, setExpandedFindings] = useState<number[]>([]);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [feedbackError, setFeedbackError] = useState(false);

  useEffect(() => {
    const loadDashboard = goalId 
      ? api.getDashboardForResolution(Number(goalId))
      : api.getLatestDashboard();
      
    loadDashboard
      .then(setDashboard)
      .catch(() => router.push('/dashboard'));
  }, [router, goalId]);

  const backHref = goalId ? `/dashboard/${goalId}` : '/dashboard';

  const handleFeedback = async (helpful: boolean) => {
    if (!dashboard?.latest_mirror) return;
    try {
      await api.submitFeedback(dashboard.latest_mirror.id, helpful);
      setFeedbackGiven(true);
      setFeedbackError(false);
    } catch {
      // Silent failure for feedback - non-critical
      setFeedbackError(true);
    }
  };

  const toggleFinding = (idx: number) => {
    setExpandedFindings((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  // No mirror available
  if (!dashboard?.latest_mirror) {
    return (
      <div className="min-h-screen">
        <div className="max-w-lg mx-auto px-4 py-8 space-y-8 animate-fade-in-up">
          <header className="flex items-center gap-4">
            <Link
              href={backHref}
              className="p-3 glass-subtle rounded-xl text-neutral-500 hover:text-teal-600 transition-all hover:-translate-y-0.5"
              aria-label="Back to goal"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="glass-subtle p-2.5 rounded-xl glow-teal">
                <Eye className="w-5 h-5 text-teal-600" />
              </div>
              <h1 className="text-xl font-semibold text-neutral-800">
                Mirror Report
              </h1>
            </div>
          </header>
          
          <div className="glass-strong rounded-2xl p-10 text-center">
            <div className="flex justify-center mb-6">
              <div className="glass-subtle p-4 rounded-2xl">
                <Sparkles className="w-8 h-8 text-neutral-400" />
              </div>
            </div>
            <p className="text-neutral-700 mb-2">No analysis available yet.</p>
            <p className="text-sm text-neutral-500">
              Continue logging check-ins. The system will generate insights 
              once it observes patterns.
            </p>
            <Link href={backHref}>
              <Button 
                variant="glass"
                className="mt-8"
              >
                Back to Goal
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const mirror = dashboard.latest_mirror;

  // Drift level indicator
  const getDriftDescription = (score: number) => {
    if (score < 0.3) return { 
      label: 'Low', 
      bg: 'bg-gradient-to-r from-emerald-500/10 to-emerald-500/5',
      text: 'text-emerald-600',
      glow: 'shadow-emerald-500/20'
    };
    if (score < 0.5) return { 
      label: 'Moderate', 
      bg: 'bg-gradient-to-r from-amber-500/10 to-amber-500/5',
      text: 'text-amber-600',
      glow: 'shadow-amber-500/20'
    };
    return { 
      label: 'High', 
      bg: 'bg-gradient-to-r from-rose-500/10 to-rose-500/5',
      text: 'text-rose-600',
      glow: 'shadow-rose-500/20'
    };
  };

  const driftInfo = getDriftDescription(mirror.drift_score);

  return (
    <div className="min-h-screen pb-8">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-8">
        
        {/* Header */}
        <header className="flex items-center gap-4 animate-fade-in-up">
          <Link
            href={backHref}
            className="p-3 glass-subtle rounded-xl text-neutral-500 hover:text-teal-600 transition-all hover:-translate-y-0.5"
            aria-label="Back to goal"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="glass-subtle p-2.5 rounded-xl glow-teal">
                <Eye className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-neutral-800">
                  Mirror Report
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`
                    text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm
                    border shadow-lg
                    ${driftInfo.bg} ${driftInfo.text} ${driftInfo.glow}
                  `}>
                    {driftInfo.label} drift ({(mirror.drift_score * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
          {/* Drift explanation - calm helper text */}
          <p className="text-xs text-neutral-500 mt-3 text-center">
            Drift doesn&apos;t mean failure. It just means the plan and real life are out of sync.
          </p>
        </header>

        {/* Findings - Premium glass cards */}
        <section className="space-y-4">
          <h2 className="text-xs font-medium text-teal-600 uppercase tracking-wider">
            Observations
          </h2>
          
          {mirror.findings.map((finding, idx) => (
            <div
              key={idx}
              className={`
                glass-strong rounded-2xl p-5 cursor-pointer transition-all duration-300
                hover:scale-[1.01] hover:shadow-xl
                animate-fade-in-up
                ${finding.order === 2 ? 'border-l-3 border-l-amber-400' : ''}
              `}
              style={{ animationDelay: `${idx * 0.1}s` }}
              onClick={() => toggleFinding(idx)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <span className={`
                    text-xs font-medium px-3 py-1 rounded-lg inline-block
                    ${finding.order === 1 
                      ? 'glass-quiet text-neutral-600' 
                      : 'bg-amber-500/10 text-amber-600'
                    }
                  `}>
                    {finding.order === 1 ? 'Observation' : 'Pattern'}
                  </span>
                  <p className="text-neutral-700 mt-3">
                    {finding.finding}
                  </p>
                </div>
                <ChevronDown 
                  className={`w-5 h-5 text-neutral-400 shrink-0 transition-transform duration-300
                    ${expandedFindings.includes(idx) ? 'rotate-180' : ''}
                  `}
                />
              </div>
              
              {/* Evidence and Root Cause (expanded) */}
              {expandedFindings.includes(idx) && (
                <div className="mt-5 pt-4 border-t border-white/30 space-y-4">
                  {finding.evidence.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-teal-600 mb-3">Evidence:</p>
                      <ul className="space-y-2">
                        {finding.evidence.map((ev, i) => (
                          <li 
                            key={i} 
                            className="text-sm text-neutral-600 flex items-start gap-3 glass-quiet p-3 rounded-xl"
                          >
                            <span className="text-teal-500 mt-0.5">•</span>
                            <span>{ev}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {/* Root Cause Hypothesis */}
                  {finding.root_cause_hypothesis && (
                    <div className="glass-subtle p-4 rounded-xl border-l-3 border-l-teal-400">
                      <p className="text-xs font-medium text-teal-600 mb-2">Why this might be happening:</p>
                      <p className="text-sm text-neutral-700 italic">{finding.root_cause_hypothesis}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </section>

        {/* Recurring Blockers */}
        {mirror.recurring_blockers && mirror.recurring_blockers.length > 0 && (
          <section className="glass-subtle rounded-2xl p-5 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <h2 className="text-xs font-medium text-amber-600 uppercase tracking-wider mb-3">
              Recurring Blockers
            </h2>
            <ul className="space-y-2">
              {mirror.recurring_blockers.map((blocker, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-neutral-700">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  {blocker}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Strength Pattern - What's Working */}
        {mirror.strength_pattern && (
          <section className="glass-strong rounded-2xl p-5 border-l-4 border-l-emerald-400 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-3">
              What&apos;s Working
            </h2>
            <p className="text-neutral-700">{mirror.strength_pattern}</p>
          </section>
        )}

        {/* Actionable Suggestions */}
        {mirror.actionable_suggestions && mirror.actionable_suggestions.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xs font-medium text-teal-600 uppercase tracking-wider">
              What We Suggest
            </h2>
            {mirror.actionable_suggestions.map((suggestion, idx) => (
              <InsightCard
                key={idx}
                suggestion={suggestion}
                resolutionId={dashboard.resolution?.id || 0}
                mirrorReportId={mirror.id}
                onActionComplete={() => {
                  // Reload dashboard to reflect changes
                  const loadDashboard = goalId 
                    ? api.getDashboardForResolution(Number(goalId))
                    : api.getLatestDashboard();
                  loadDashboard.then(setDashboard);
                }}
              />
            ))}
          </section>
        )}

        {/* Alternative perspective */}
        {mirror.counterfactual && (
          <div className="glass-strong rounded-2xl p-6 animate-fade-in-up glow-teal" style={{ animationDelay: '0.3s' }}>
            <h2 className="text-xs font-medium text-teal-600 uppercase tracking-wider mb-4">
              Alternative Perspective
            </h2>
            <p className="text-neutral-700">
              {mirror.counterfactual}
            </p>
          </div>
        )}

        {/* Feedback */}
        <div className="glass-subtle rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <p className="text-sm text-neutral-600 mb-4">
            Was this analysis helpful?
          </p>
          {feedbackGiven ? (
            <div className="flex items-center gap-2 text-teal-600">
              <div className="p-2 bg-teal-500/10 rounded-lg">
                <ThumbsUp className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">Feedback recorded. Thank you.</span>
            </div>
          ) : feedbackError ? (
            <div className="text-sm text-neutral-500">
              Could not record feedback. Please try again later.
            </div>
          ) : (
            <div className="flex gap-3">
              <Button
                onClick={() => handleFeedback(true)}
                variant="glass"
                size="sm"
                className="gap-2"
              >
                <ThumbsUp className="w-4 h-4" /> Yes
              </Button>
              <Button
                onClick={() => handleFeedback(false)}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <ThumbsDown className="w-4 h-4" /> No
              </Button>
            </div>
          )}
        </div>

        {/* Back action */}
        <Link href={backHref}>
          <Button
            variant="secondary"
            className="w-full"
          >
            Back to Goal
          </Button>
        </Link>
      </div>
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function MirrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    }>
      <MirrorContent />
    </Suspense>
  );
}
