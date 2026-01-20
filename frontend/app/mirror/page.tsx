'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { api, Dashboard, MirrorReport } from '@/lib/api';
import { 
  AnimatedBackground, 
  FloatingParticles, 
  FloatingShapes,
  AnimatedDecorations,
  PageTransition,
  FloatingImage 
} from '@/components/animations/AnimatedBackground';

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
      <div className="min-h-screen relative overflow-hidden">
        <AnimatedBackground theme="mirror" />
        <FloatingParticles count={20} />
        <FloatingShapes />
        
        <PageTransition className="relative z-10 py-6 px-4">
          <div className="max-w-2xl mx-auto space-y-6">
            <motion.h1 
              className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              🪞 Mirror Report
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6 text-center text-calm-500 backdrop-blur-sm bg-white/80">
                <motion.div
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-4xl mb-4"
                >
                  🔮
                </motion.div>
                <p className="mb-2">No mirror report available yet.</p>
                <p className="text-sm">Keep logging check-ins to generate insights.</p>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-4"
                >
                  <Button onClick={() => router.push('/dashboard')}>
                    Back to Dashboard
                  </Button>
                </motion.div>
              </Card>
            </motion.div>
          </div>
        </PageTransition>
      </div>
    );
  }

  const mirror = dashboard.latest_mirror;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground theme="mirror" />
      <FloatingParticles count={25} />
      <FloatingShapes />
      <AnimatedDecorations />
      
      {/* Floating mirror illustration */}
      <FloatingImage 
        src="/images/mirror.svg" 
        alt="Mirror illustration" 
        size={160} 
        position="top-right"
        delay={0.3}
      />
      
      <PageTransition className="relative z-10 py-6 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <motion.button
              onClick={() => router.push('/dashboard')}
              className="p-2 text-calm-400 hover:text-calm-600 rounded-lg hover:bg-white/50 transition-all"
              whileHover={{ scale: 1.1, x: -3 }}
              whileTap={{ scale: 0.9 }}
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                🪞 Mirror Report
              </h1>
              <motion.p 
                className="text-sm text-calm-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Drift Score: 
                <motion.span 
                  className={`ml-1 font-medium px-2 py-0.5 rounded-lg ${
                    mirror.drift_score > 0.5 ? 'text-red-600 bg-red-100' : 
                    mirror.drift_score > 0.3 ? 'text-yellow-600 bg-yellow-100' : 
                    'text-green-600 bg-green-100'
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                >
                  {(mirror.drift_score * 100).toFixed(0)}%
                </motion.span>
              </motion.p>
            </div>
          </motion.div>

          {/* Findings */}
          <div className="space-y-3">
            <motion.h2 
              className="text-sm font-medium text-calm-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              📋 Findings
            </motion.h2>
            {mirror.findings.map((finding, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.3 + idx * 0.1, type: 'spring' }}
              >
                <Card
                  className={`p-4 cursor-pointer transition-all backdrop-blur-sm bg-white/80 hover:bg-white hover:shadow-lg ${
                    finding.order === 2 ? 'border-l-4 border-l-amber-400' : ''
                  }`}
                  onClick={() => toggleFinding(idx)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <motion.span 
                          className={`text-xs px-2 py-0.5 rounded-lg font-medium ${
                            finding.order === 1 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-amber-100 text-amber-700'
                          }`}
                          whileHover={{ scale: 1.05 }}
                        >
                          {finding.order === 1 ? '👁️ Observation' : '🔄 Pattern'}
                        </motion.span>
                      </div>
                      <p className="text-calm-800">{finding.finding}</p>
                    </div>
                    <motion.div
                      animate={{ rotate: expandedFindings.includes(idx) ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-5 h-5 text-calm-400" />
                    </motion.div>
                  </div>
                  
                  <AnimatePresence>
                    {expandedFindings.includes(idx) && finding.evidence.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-calm-100"
                      >
                        <p className="text-xs font-medium text-calm-500 mb-2">📝 Evidence:</p>
                        <ul className="space-y-1">
                          {finding.evidence.map((ev, i) => (
                            <motion.li 
                              key={i} 
                              className="text-sm text-calm-600 flex items-start gap-2"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                            >
                              <span className="text-calm-400">•</span>
                              <span>{ev}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Counterfactual */}
          {mirror.counterfactual && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200/50 backdrop-blur-sm">
                <motion.h2 
                  className="text-sm font-medium text-purple-700 mb-2"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  ✨ What Could Have Been
                </motion.h2>
                <p className="text-calm-700">{mirror.counterfactual}</p>
              </Card>
            </motion.div>
          )}

          {/* Feedback */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="p-4 backdrop-blur-sm bg-white/80">
              <p className="text-sm text-calm-600 mb-3">Was this reflection helpful?</p>
              {feedbackGiven ? (
                <motion.p 
                  className="text-sm text-green-600 font-medium"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring' }}
                >
                  ✅ Thanks for your feedback!
                </motion.p>
              ) : (
                <div className="flex gap-2">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => handleFeedback(true)}
                      variant="secondary"
                      size="sm"
                      className="gap-1"
                    >
                      <ThumbsUp className="w-4 h-4" /> Yes
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => handleFeedback(false)}
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                    >
                      <ThumbsDown className="w-4 h-4" /> No
                    </Button>
                  </motion.div>
                </div>
              )}
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={() => router.push('/dashboard')}
              variant="secondary"
              className="w-full backdrop-blur-sm bg-white/80"
            >
              ← Back to Dashboard
            </Button>
          </motion.div>
        </div>
      </PageTransition>
    </div>
  );
}
