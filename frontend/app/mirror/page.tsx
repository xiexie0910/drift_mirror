'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { api, Dashboard, MirrorReport } from '@/lib/api';

export default function MirrorPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [expandedFindings, setExpandedFindings] = useState<number[]>([]);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  useEffect(() => {
    api.getDashboard().then(setDashboard).catch(() => router.push('/'));
  }, [router]);

  const handleFeedback = async (helpful: boolean) => {
    if (!dashboard?.latest_mirror) return;
    try {
      await api.submitFeedback(dashboard.latest_mirror.id, helpful);
      setFeedbackGiven(true);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFinding = (idx: number) => {
    setExpandedFindings((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  if (!dashboard?.latest_mirror) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Mirror Report</h1>
        <Card className="p-6 text-center text-gray-500">
          <p>No mirror report available yet.</p>
          <p className="text-sm mt-2">Keep logging check-ins to generate insights.</p>
          <Button onClick={() => router.push('/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const mirror = dashboard.latest_mirror;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/dashboard')}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Mirror Report</h1>
          <p className="text-sm text-gray-500">
            Drift Score: {(mirror.drift_score * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Findings */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-gray-500">Findings</h2>
        {mirror.findings.map((finding, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card
              className={`p-4 cursor-pointer transition-all ${
                finding.order === 2 ? 'border-l-4 border-l-amber-400' : ''
              }`}
              onClick={() => toggleFinding(idx)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      finding.order === 1 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {finding.order === 1 ? 'Observation' : 'Pattern'}
                    </span>
                  </div>
                  <p className="text-gray-800">{finding.finding}</p>
                </div>
                {expandedFindings.includes(idx) ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
              
              {expandedFindings.includes(idx) && finding.evidence.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 pt-3 border-t"
                >
                  <p className="text-xs font-medium text-gray-500 mb-2">Evidence:</p>
                  <ul className="space-y-1">
                    {finding.evidence.map((ev, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-gray-400">•</span>
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Counterfactual */}
      {mirror.counterfactual && (
        <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <h2 className="text-sm font-medium text-purple-700 mb-2">What Could Have Been</h2>
          <p className="text-gray-700">{mirror.counterfactual}</p>
        </Card>
      )}

      {/* Feedback */}
      <Card className="p-4">
        <p className="text-sm text-gray-600 mb-3">Was this reflection helpful?</p>
        {feedbackGiven ? (
          <p className="text-sm text-drift-600">Thanks for your feedback!</p>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={() => handleFeedback(true)}
              variant="secondary"
              size="sm"
              className="gap-1"
            >
              <ThumbsUp className="w-4 h-4" /> Yes
            </Button>
            <Button
              onClick={() => handleFeedback(false)}
              variant="ghost"
              size="sm"
              className="gap-1"
            >
              <ThumbsDown className="w-4 h-4" /> No
            </Button>
          </div>
        )}
      </Card>

      <Button
        onClick={() => router.push('/dashboard')}
        variant="secondary"
        className="w-full"
      >
        Back to Dashboard
      </Button>
    </div>
  );
}
