'use client';

/**
 * Actionable Insight Card
 * ============================================================
 * Displays patterns detected by the system with 2 action options:
 * - Accept changes (apply the suggestion)
 * - Ignore this pattern (dismiss)
 */

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Check, X, AlertCircle, Lightbulb } from 'lucide-react';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [editableChanges, setEditableChanges] = useState<Record<string, any>>(suggestion.changes || {});
  const [isEditingChanges, setIsEditingChanges] = useState(false);

  const handleAction = async (action: 'accept' | 'constrain' | 'ignore') => {
    setIsProcessing(true);
    
    try {
      const payload = {
        resolution_id: resolutionId,
        mirror_report_id: mirrorReportId,
        insight_type: 'pattern',
        insight_summary: suggestion.suggestion,
        action_taken: action,
        constraint_details: null,
        suggested_changes: Object.keys(editableChanges).length > 0 ? editableChanges : null
      };

      const response = await fetch(`/api/resolutions/${resolutionId}/insights/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to submit action');
      
      // Notify parent component to refresh and remove this card
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
      {Object.keys(editableChanges).length > 0 && (
        <div className="glass-quiet rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-neutral-600">
              {isEditingChanges ? 'Edit proposed changes:' : 'Proposed changes:'}
            </p>
            <button
              onClick={() => setIsEditingChanges(!isEditingChanges)}
              className="text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors"
            >
              {isEditingChanges ? 'Done editing' : 'Customize'}
            </button>
          </div>
          <ul className="space-y-2">
            {Object.entries(editableChanges).map(([key, value]) => (
              <li key={key} className="text-sm text-neutral-700">
                {isEditingChanges ? (
                  <div className="flex items-center gap-2">
                    <span className="text-teal-500 shrink-0">→</span>
                    <span className="font-medium min-w-[140px]">{key.replace(/_/g, ' ')}:</span>
                    <input
                      type={typeof value === 'number' ? 'number' : 'text'}
                      value={value}
                      onChange={(e) => {
                        const newValue = typeof value === 'number' 
                          ? parseFloat(e.target.value) || 0
                          : e.target.value;
                        setEditableChanges(prev => ({...prev, [key]: newValue}));
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg glass-subtle text-neutral-800 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-teal-500">→</span>
                    <span className="font-medium">{key.replace(/_/g, ' ')}:</span>
                    <span>{value}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
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
