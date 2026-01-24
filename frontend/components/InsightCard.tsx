'use client';

/**
 * Actionable Insight Card
 * ============================================================
 * Displays patterns detected by the system with 3 action options:
 * - Adopt suggestion (apply the change)
 * - Add a constraint (specify user preferences)
 * - Ignore this pattern (dismiss)
 */

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Check, X, AlertCircle, Lightbulb, Lock } from 'lucide-react';

interface InsightCardProps {
  suggestion: {
    type: string;
    suggestion: string;
    changes: Record<string, any>;
    reason: string;
  };
  resolutionId: number;
  mirrorReportId?: number;
  onActionComplete?: () => void;
}

export function InsightCard({ 
  suggestion, 
  resolutionId, 
  mirrorReportId,
  onActionComplete 
}: InsightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConstraintInput, setShowConstraintInput] = useState(false);
  const [constraintText, setConstraintText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionTaken, setActionTaken] = useState<string | null>(null);

  const handleAction = async (action: 'accept' | 'constrain' | 'ignore') => {
    setIsProcessing(true);
    
    try {
      const payload = {
        resolution_id: resolutionId,
        mirror_report_id: mirrorReportId,
        insight_type: 'pattern',
        insight_summary: suggestion.suggestion,
        action_taken: action,
        constraint_details: action === 'constrain' ? constraintText : null,
        suggested_changes: Object.keys(suggestion.changes).length > 0 ? suggestion.changes : null
      };

      const response = await fetch(`http://localhost:8000/resolutions/${resolutionId}/insights/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to submit action');

      setActionTaken(action);
      
      // Notify parent component
      if (onActionComplete) {
        onActionComplete();
      }
    } catch (error) {
      console.error('Error submitting insight action:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getTypeIcon = () => {
    switch (suggestion.type) {
      case 'reduce_duration':
      case 'reduce_frequency':
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case 'change_time':
        return <Lightbulb className="w-5 h-5 text-teal-600" />;
      case 'recovery_mode':
        return <AlertCircle className="w-5 h-5 text-rose-600" />;
      default:
        return <Lightbulb className="w-5 h-5 text-neutral-600" />;
    }
  };

  const getTypeLabel = () => {
    switch (suggestion.type) {
      case 'reduce_duration': return 'Duration Adjustment';
      case 'reduce_frequency': return 'Frequency Adjustment';
      case 'change_time': return 'Time Preference';
      case 'simplify_action': return 'Simplify Action';
      case 'recovery_mode': return 'Recovery Mode';
      default: return 'Pattern Detected';
    }
  };

  if (actionTaken) {
    return (
      <div className="glass-strong rounded-2xl p-6 border-l-4 border-l-emerald-500 animate-fade-in-up">
        <div className="flex items-start gap-4">
          <div className="glass-subtle p-2.5 rounded-xl bg-emerald-500/10">
            <Check className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-neutral-800 mb-2">
              {actionTaken === 'accept' && 'Changes Applied'}
              {actionTaken === 'constrain' && 'Constraint Added'}
              {actionTaken === 'ignore' && 'Dismissed'}
            </h3>
            <p className="text-sm text-neutral-600">
              {actionTaken === 'accept' && 'Your plan has been updated. Refresh to see the changes.'}
              {actionTaken === 'constrain' && 'We\'ll remember your preference for future suggestions.'}
              {actionTaken === 'ignore' && 'Got it. We won\'t show this pattern again.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-strong rounded-2xl p-6 border-l-4 border-l-teal-500 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="glass-subtle p-2.5 rounded-xl">
          {getTypeIcon()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium px-3 py-1 rounded-lg bg-teal-500/10 text-teal-600">
              {getTypeLabel()}
            </span>
            <span className="text-xs text-neutral-500">
              {suggestion.reason}
            </span>
          </div>
          <h3 className="text-neutral-800 font-medium mb-2">
            Here's what we notice
          </h3>
          <p className="text-neutral-700">
            {suggestion.suggestion}
          </p>
        </div>
      </div>

      {/* Proposed changes (if any) */}
      {Object.keys(suggestion.changes).length > 0 && (
        <div className="glass-quiet rounded-xl p-4 mb-4">
          <p className="text-xs font-medium text-neutral-600 mb-2">Proposed changes:</p>
          <ul className="space-y-1">
            {Object.entries(suggestion.changes).map(([key, value]) => (
              <li key={key} className="text-sm text-neutral-700 flex items-center gap-2">
                <span className="text-teal-500">→</span>
                <span className="font-medium">{key.replace(/_/g, ' ')}:</span>
                <span>{value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Constraint input (if shown) */}
      {showConstraintInput && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            What constraint should we remember?
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 rounded-xl glass-subtle text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            placeholder="e.g., 'No mornings', 'Keep duration above 10 min'"
            value={constraintText}
            onChange={(e) => setConstraintText(e.target.value)}
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-neutral-700">
          What do you want to do?
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="glass"
            onClick={() => handleAction('accept')}
            disabled={isProcessing}
            className="flex items-center gap-2 bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 border-teal-500/30"
          >
            <Check className="w-4 h-4" />
            {Object.keys(suggestion.changes).length > 0 ? 'Accept changes' : 'Good insight'}
          </Button>
          
          {!showConstraintInput ? (
            <Button
              variant="glass"
              onClick={() => setShowConstraintInput(true)}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Add a constraint
            </Button>
          ) : (
            <Button
              variant="glass"
              onClick={() => handleAction('constrain')}
              disabled={isProcessing || !constraintText.trim()}
              className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 border-amber-500/30"
            >
              <Lock className="w-4 h-4" />
              Save constraint
            </Button>
          )}
          
          <Button
            variant="glass"
            onClick={() => handleAction('ignore')}
            disabled={isProcessing}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Ignore this pattern
          </Button>
        </div>
      </div>
    </div>
  );
}
