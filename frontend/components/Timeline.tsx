import { Checkin } from '@/lib/api';

/**
 * Timeline Component
 * 
 * Calm Futurism Design
 * - Glass cards for each check-in
 * - Subtle teal accents
 * - Clean visual hierarchy
 */

interface TimelineProps {
  checkins: Checkin[];
}

export function Timeline({ checkins }: TimelineProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getFrictionLabel = (friction: number) => {
    if (friction === 1) return 'Low';
    if (friction === 2) return 'Medium';
    return 'High';
  };

  return (
    <div className="space-y-3">
      {checkins.map((checkin, index) => (
        <div 
          key={checkin.id} 
          className="glass-subtle rounded-xl p-4 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg"
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <div className="flex items-start gap-4">
            {/* Status indicator with glow */}
            <div className={`
              w-3 h-3 mt-1.5 rounded-full flex-shrink-0 transition-all
              ${checkin.completed 
                ? 'bg-gradient-to-r from-teal-400 to-teal-500 shadow-lg shadow-teal-500/30' 
                : 'bg-neutral-300/50'}
            `} />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-neutral-800 truncate">
                  {checkin.actual}
                </p>
                <span className="text-xs text-teal-600/70 shrink-0 tabular-nums font-medium">
                  {formatDate(checkin.created_at)}
                </span>
              </div>
              
              <p className="text-xs text-neutral-500 truncate mt-1.5">
                Planned: {checkin.planned}
              </p>
              
              <div className="flex items-center gap-4 mt-3 text-xs">
                <span className="px-2 py-1 glass-quiet rounded-lg text-neutral-600">
                  Friction: {getFrictionLabel(checkin.friction)}
                </span>
                {checkin.blocker && (
                  <span className="text-neutral-400 truncate">
                    {checkin.blocker.slice(0, 30)}...
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
