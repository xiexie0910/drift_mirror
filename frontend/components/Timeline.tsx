import { Checkin } from '@/lib/api';
import { Check, X } from 'lucide-react';

/**
 * Timeline Component
 * 
 * Compact check-in history with minimum action status
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
    if (friction === 1) return 'Easy';
    if (friction === 2) return 'Medium';
    return 'Hard';
  };

  return (
    <div className="space-y-2">
      {checkins.map((checkin, index) => {
        const didMinimum = checkin.did_minimum_action ?? checkin.completed;
        
        return (
          <div 
            key={checkin.id} 
            className="glass-subtle rounded-xl p-3 transition-all hover:shadow-md"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex items-center gap-3">
              {/* Status icon */}
              <div className={`
                w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
                ${didMinimum 
                  ? 'bg-teal-100 text-teal-600' 
                  : 'bg-neutral-100 text-neutral-400'}
              `}>
                {didMinimum ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-neutral-700">
                    {didMinimum ? 'Did minimum' : 'Missed'}
                    {checkin.extra_done && <span className="text-teal-600"> +extra</span>}
                  </p>
                  <span className="text-xs text-neutral-400 shrink-0">
                    {formatDate(checkin.created_at)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                  <span>{getFrictionLabel(checkin.friction)}</span>
                  {checkin.blocker && (
                    <>
                      <span>•</span>
                      <span className="truncate">{checkin.blocker.slice(0, 25)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
