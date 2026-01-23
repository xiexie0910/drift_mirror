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
    <div className="grid grid-cols-4 gap-2">
      {/* Completion Rate */}
      <div className="glass-subtle rounded-xl p-3 transition-all duration-300 hover:scale-[1.02]">
        <p className="text-[10px] text-teal-600 font-medium uppercase tracking-wider mb-1">Done</p>
        <p className="text-lg font-semibold text-neutral-800 tabular-nums">
          {(metrics.completion_rate * 100).toFixed(0)}
          <span className="text-xs text-neutral-400">%</span>
        </p>
      </div>
      
      {/* Check-ins */}
      <div className="glass-subtle rounded-xl p-3 transition-all duration-300 hover:scale-[1.02]">
        <p className="text-[10px] text-teal-600 font-medium uppercase tracking-wider mb-1">Streak</p>
        <p className="text-lg font-semibold text-neutral-800 tabular-nums">
          {metrics.streak}
        </p>
      </div>
      
      {/* Friction */}
      <div className="glass-subtle rounded-xl p-3 transition-all duration-300 hover:scale-[1.02]">
        <p className="text-[10px] text-teal-600 font-medium uppercase tracking-wider mb-1">Effort</p>
        <p className="text-lg font-semibold text-neutral-800 tabular-nums">
          {metrics.avg_friction.toFixed(1)}
        </p>
      </div>
      
      {/* Drift Score */}
      <div className={`
        rounded-xl p-3 
        backdrop-blur-md border 
        shadow-lg
        transition-all duration-300 hover:scale-[1.02]
        ${driftStyle.bg} ${driftStyle.border} ${driftStyle.glow}
      `}>
        <p className={`text-[10px] font-medium uppercase tracking-wider mb-1 ${driftStyle.text}`}>Drift</p>
        <p className={`text-lg font-semibold tabular-nums ${driftStyle.text}`}>
          {(metrics.drift_score * 100).toFixed(0)}
          <span className="text-xs opacity-60">%</span>
        </p>
      </div>
    </div>
  );
}
