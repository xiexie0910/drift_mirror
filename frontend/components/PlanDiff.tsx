import { Card } from './ui/Card';
import { ArrowRight } from 'lucide-react';

interface Plan {
  frequency_per_week: number;
  min_minutes: number;
  time_window: string;
  recovery_step?: string;
}

interface PlanDiffProps {
  oldPlan: Plan;
  newPlan: Plan;
}

export function PlanDiff({ oldPlan, newPlan }: PlanDiffProps) {
  const changes: { label: string; old: string; new: string }[] = [];

  if (oldPlan.frequency_per_week !== newPlan.frequency_per_week) {
    changes.push({
      label: 'Frequency',
      old: `${oldPlan.frequency_per_week}x/week`,
      new: `${newPlan.frequency_per_week}x/week`,
    });
  }

  if (oldPlan.min_minutes !== newPlan.min_minutes) {
    changes.push({
      label: 'Duration',
      old: `${oldPlan.min_minutes} min`,
      new: `${newPlan.min_minutes} min`,
    });
  }

  if (oldPlan.time_window !== newPlan.time_window) {
    changes.push({
      label: 'Time',
      old: oldPlan.time_window,
      new: newPlan.time_window,
    });
  }

  if (changes.length === 0) return null;

  return (
    <Card className="p-4 border-drift-200 bg-drift-50">
      <h3 className="text-sm font-medium text-drift-700 mb-3">Plan Adjusted</h3>
      <div className="space-y-2">
        {changes.map((change, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 w-20">{change.label}:</span>
            <span className="text-red-500 line-through">{change.old}</span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <span className="text-drift-700 font-medium">{change.new}</span>
          </div>
        ))}
      </div>
      {newPlan.recovery_step && (
        <p className="text-sm text-drift-600 mt-3 pt-3 border-t border-drift-200">
          💡 {newPlan.recovery_step}
        </p>
      )}
    </Card>
  );
}
