import { Card } from './ui/Card';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Checkin } from '@/lib/api';

interface TimelineProps {
  checkins: Checkin[];
}

export function Timeline({ checkins }: TimelineProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getFrictionColor = (friction: number) => {
    if (friction === 1) return 'text-green-500';
    if (friction === 2) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-3">
      {checkins.map((checkin) => (
        <Card key={checkin.id} className="p-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              {checkin.completed ? (
                <CheckCircle className="w-5 h-5 text-drift-500" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {checkin.actual}
                </p>
                <span className="text-xs text-gray-400 shrink-0">
                  {formatDate(checkin.created_at)}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                Planned: {checkin.planned}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className={`text-xs ${getFrictionColor(checkin.friction)}`}>
                  Friction: {checkin.friction}/3
                </span>
                {checkin.blocker && (
                  <span className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {checkin.blocker.slice(0, 30)}...
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
