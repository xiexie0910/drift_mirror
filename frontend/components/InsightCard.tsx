'use client';

/**
 * Actionable Insight Card
 * ============================================================
 * Award-winning design with:
 * - Smooth entrance animations
 * - Interactive hover states
 * - Haptic-feeling button feedback
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertCircle, Lightbulb, Sparkles, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';

interface InsightCardProps {
  suggestion: {
    type: string;
    suggestion: string;
    changes: Record<string, unknown>;
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
  const [editableChanges, setEditableChanges] = useState<Record<string, unknown>>(suggestion.changes || {});
  const [isEditingChanges, setIsEditingChanges] = useState(false);

  const handleAction = async (action: 'accept' | 'constrain' | 'ignore') => {
    setIsProcessing(true);
    
    try {
      await api.submitInsightAction(resolutionId, {
        mirror_report_id: mirrorReportId,
        insight_type: 'pattern',
        insight_summary: suggestion.suggestion,
        action_taken: action,
        constraint_details: null,
        suggested_changes: Object.keys(editableChanges).length > 0 ? editableChanges : null
      });
      
      // Notify parent component to refresh and remove this card
      if (onActionComplete) {
        onActionComplete();
      }
    } catch {
      // Silent failure for insight actions - non-critical
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

  const getTypeColor = () => {
    switch (suggestion.type) {
      case 'reduce_duration':
      case 'reduce_frequency':
        return { bg: 'from-amber-500/20 to-amber-500/5', border: 'border-amber-500', accent: 'text-amber-600', pill: 'bg-amber-500/10 text-amber-600' };
      case 'recovery_mode':
        return { bg: 'from-rose-500/20 to-rose-500/5', border: 'border-rose-500', accent: 'text-rose-600', pill: 'bg-rose-500/10 text-rose-600' };
      default:
        return { bg: 'from-teal-500/20 to-teal-500/5', border: 'border-teal-500', accent: 'text-teal-600', pill: 'bg-teal-500/10 text-teal-600' };
    }
  };

  const colors = getTypeColor();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`
        relative overflow-hidden
        bg-gradient-to-br ${colors.bg}
        backdrop-blur-xl rounded-2xl p-6 
        border-l-4 ${colors.border}
        shadow-xl shadow-neutral-200/50
      `}
    >
      {/* Decorative sparkle */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="absolute top-4 right-4"
      >
        <Sparkles className={`w-5 h-5 ${colors.accent} opacity-50`} />
      </motion.div>

      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <motion.div 
          initial={{ rotate: -10 }}
          animate={{ rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="glass-subtle p-3 rounded-xl"
        >
          {getTypeIcon()}
        </motion.div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg ${colors.pill}`}
            >
              {getTypeLabel()}
            </motion.span>
          </div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-neutral-800 font-semibold text-lg mb-1"
          >
            {suggestion.suggestion}
          </motion.p>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-sm text-neutral-500"
          >
            {suggestion.reason}
          </motion.p>
        </div>
      </div>

      {/* Proposed changes (if any) */}
      <AnimatePresence>
        {Object.keys(editableChanges).length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-quiet rounded-xl p-4 mb-4 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-neutral-600">
                {isEditingChanges ? 'Edit proposed changes:' : 'Proposed changes:'}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditingChanges(!isEditingChanges)}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors"
              >
                {isEditingChanges ? 'Done editing' : 'Customize'}
              </motion.button>
            </div>
            <ul className="space-y-2">
              {Object.entries(editableChanges).map(([key, value], index) => (
                <motion.li 
                  key={key} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="text-sm text-neutral-700"
                >
                  {isEditingChanges ? (
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-teal-500 shrink-0" />
                      <span className="font-medium min-w-[140px]">{key.replace(/_/g, ' ')}:</span>
                      <input
                        type={typeof value === 'number' ? 'number' : 'text'}
                        value={String(value ?? '')}
                        onChange={(e) => {
                          const newValue = typeof value === 'number' 
                            ? parseFloat(e.target.value) || 0
                            : e.target.value;
                          setEditableChanges(prev => ({...prev, [key]: newValue}));
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg glass-subtle text-neutral-800 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-teal-500" />
                      <span className="font-medium">{key.replace(/_/g, ' ')}:</span>
                      <span className="text-neutral-600">{String(value ?? '')}</span>
                    </div>
                  )}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap gap-3"
      >
        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleAction('accept')}
          disabled={isProcessing}
          className={`
            flex items-center gap-2 px-5 py-2.5 rounded-xl
            bg-teal-500 text-white font-medium
            shadow-lg shadow-teal-500/30
            hover:bg-teal-600 hover:shadow-xl hover:shadow-teal-500/40
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
          `}
        >
          <Check className="w-4 h-4" />
          {Object.keys(suggestion.changes).length > 0 ? 'Accept changes' : 'Good insight'}
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleAction('ignore')}
          disabled={isProcessing}
          className={`
            flex items-center gap-2 px-5 py-2.5 rounded-xl
            bg-white/50 backdrop-blur-sm text-neutral-600 font-medium
            border border-neutral-200/50
            hover:bg-white/80 hover:text-neutral-800
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
          `}
        >
          <X className="w-4 h-4" />
          Ignore
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
