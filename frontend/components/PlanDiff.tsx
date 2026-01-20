import { Card } from './ui/Card';
import { ArrowRight } from 'lucide-react';

/**
 * PlanDiff Component
 * 
 * Design Philosophy:
 * - Glass surface because this represents system insight/adaptation
 * - Neutral language - system observation, not judgment
 * - Clear before/after comparison
 * - Recovery step is a suggestion, not a command
 */

interface Plan {
  frequency_per_week: number;
  min_minutes: number;
  time_window: string;
  recovery_step?: string | null;
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
    // Glass surface - this is a system observation/adaptation
    <Card variant="glass" className="p-5">
      <h3 className="text-sm font-medium text-neutral-600 mb-4">
        Plan Adjusted
      </h3>
      
      <div className="space-y-3">
        {changes.map((change, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <span className="text-neutral-500 w-20">{change.label}</span>
            <span className="text-neutral-400 line-through">{change.old}</span>
            <ArrowRight className="w-4 h-4 text-neutral-300" />
            <span className="text-teal-600 font-medium">{change.new}</span>
          </div>
        ))}
      </div>
      
      {newPlan.recovery_step && (
        <p className="text-sm text-neutral-600 mt-4 pt-4 border-t border-neutral-200/50">
          <span className="text-teal-600">Suggested approach:</span> {newPlan.recovery_step}
        </p>
      )}
    </Card>
  );
}
