import { Metrics } from '@/lib/api';

/**
 * MetricPills Component
 * 
 * Calm Futurism Design
 * - Glass metric cards with subtle glow
 * - Semantic colors for states
 * - Teal accents for key metrics
 */

interface MetricPillsProps {
  metrics: Metrics;
}

export function MetricPills({ metrics }: MetricPillsProps) {
  // Drift level determines visual state
  const getDriftState = (score: number) => {
    if (score < 0.3) return {
      bg: 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5',
      text: 'text-emerald-600',
      border: 'border-emerald-500/20',
      glow: 'shadow-emerald-500/10',
    };
    if (score < 0.5) return {
      bg: 'bg-gradient-to-br from-amber-500/10 to-amber-500/5',
      text: 'text-amber-600',
      border: 'border-amber-500/20',
      glow: 'shadow-amber-500/10',
    };
    return {
      bg: 'bg-gradient-to-br from-rose-500/10 to-rose-500/5',
      text: 'text-rose-600',
      border: 'border-rose-500/20',
      glow: 'shadow-rose-500/10',
    };
  };

  const driftStyle = getDriftState(metrics.drift_score);

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Completion Rate */}
      <div className="glass-subtle rounded-xl p-4 transition-all duration-300 hover:scale-[1.02]">
        <p className="text-xs text-teal-600 font-medium uppercase tracking-wider mb-2">Completion</p>
        <p className="text-2xl font-semibold text-neutral-800 tabular-nums">
          {(metrics.completion_rate * 100).toFixed(0)}
          <span className="text-sm text-neutral-400 ml-0.5">%</span>
        </p>
      </div>
      
      {/* Check-ins */}
      <div className="glass-subtle rounded-xl p-4 transition-all duration-300 hover:scale-[1.02]">
        <p className="text-xs text-teal-600 font-medium uppercase tracking-wider mb-2">Check-ins</p>
        <p className="text-2xl font-semibold text-neutral-800 tabular-nums">
          {metrics.streak}
        </p>
      </div>
      
      {/* Friction */}
      <div className="glass-subtle rounded-xl p-4 transition-all duration-300 hover:scale-[1.02]">
        <p className="text-xs text-teal-600 font-medium uppercase tracking-wider mb-2">Friction</p>
        <p className="text-2xl font-semibold text-neutral-800 tabular-nums">
          {metrics.avg_friction.toFixed(1)}
          <span className="text-sm text-neutral-400 ml-0.5">/3</span>
        </p>
      </div>
      
      {/* Drift Score */}
      <div className={`
        rounded-xl p-4 
        backdrop-blur-md border 
        shadow-lg
        transition-all duration-300 hover:scale-[1.02]
        ${driftStyle.bg} ${driftStyle.border} ${driftStyle.glow}
      `}>
        <p className={`text-xs font-medium uppercase tracking-wider mb-2 ${driftStyle.text}`}>Drift</p>
        <p className={`text-2xl font-semibold tabular-nums ${driftStyle.text}`}>
          {(metrics.drift_score * 100).toFixed(0)}
          <span className="text-sm opacity-60 ml-0.5">%</span>
        </p>
      </div>
    </div>
  );
}
