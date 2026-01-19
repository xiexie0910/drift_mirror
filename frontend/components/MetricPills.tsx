import { Metrics } from '@/lib/api';
import { TrendingUp, Flame, Gauge, Target } from 'lucide-react';

interface MetricPillsProps {
  metrics: Metrics;
}

export function MetricPills({ metrics }: MetricPillsProps) {
  const getDriftColor = (score: number) => {
    if (score < 0.3) return 'text-green-600 bg-green-50';
    if (score < 0.5) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
        <Target className="w-5 h-5 text-drift-500" />
        <div>
          <p className="text-xs text-gray-500">Completion</p>
          <p className="font-semibold">{(metrics.completion_rate * 100).toFixed(0)}%</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
        <Flame className="w-5 h-5 text-orange-500" />
        <div>
          <p className="text-xs text-gray-500">Streak</p>
          <p className="font-semibold">{metrics.streak}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
        <Gauge className="w-5 h-5 text-purple-500" />
        <div>
          <p className="text-xs text-gray-500">Avg Friction</p>
          <p className="font-semibold">{metrics.avg_friction.toFixed(1)}/3</p>
        </div>
      </div>
      
      <div className={`flex items-center gap-2 p-3 rounded-lg border ${getDriftColor(metrics.drift_score)}`}>
        <TrendingUp className="w-5 h-5" />
        <div>
          <p className="text-xs opacity-75">Drift</p>
          <p className="font-semibold">{(metrics.drift_score * 100).toFixed(0)}%</p>
        </div>
      </div>
    </div>
  );
}
