'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MetricPills } from '@/components/MetricPills';
import { Timeline } from '@/components/Timeline';
import { PlanDiff } from '@/components/PlanDiff';
import { DebugDrawer } from '@/components/DebugDrawer';
import { Plus, Eye, Bug, Trash2, Database } from 'lucide-react';
import { api, Dashboard } from '@/lib/api';
import { 
  AnimatedBackground, 
  FloatingParticles, 
  FloatingShapes,
  AnimatedDecorations,
  PageTransition,
  FloatingImage 
} from '@/components/animations/AnimatedBackground';

export default function DashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const loadDashboard = async () => {
    try {
      const data = await api.getDashboard();
      setDashboard(data);
      if (!data.resolution) {
        router.push('/');
      }
    } catch {
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      await api.seedDemo();
      await loadDashboard();
    } finally {
      setSeeding(false);
    }
  };

  const handleClearData = async () => {
    if (confirm('Clear all data?')) {
      await api.clearDemo();
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative">
        <AnimatedBackground theme="dashboard" />
        <FloatingParticles count={15} />
        <div className="flex items-center justify-center min-h-screen">
          <motion.div 
            className="text-green-500 text-xl font-medium"
            animate={{ opacity: [0.5, 1, 0.5], scale: [0.98, 1.02, 0.98] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            📊 Loading dashboard...
          </motion.div>
        </div>
      </div>
    );
  }

  if (!dashboard?.resolution) return null;

  const { resolution, current_plan, metrics, recent_checkins, latest_mirror, drift_triggered } = dashboard;

  // Get previous plan for diff
  const plans = dashboard.current_plan ? [dashboard.current_plan] : [];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground theme="dashboard" />
      <FloatingParticles count={20} />
      <FloatingShapes />
      <AnimatedDecorations />
      
      {/* Floating chart illustration */}
      <FloatingImage 
        src="/images/chart.svg" 
        alt="Chart illustration" 
        size={160} 
        position="top-right"
        delay={0.3}
      />
      
      <PageTransition className="relative z-10 py-6 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.div 
        className="flex items-start justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div>
          <motion.h1 
            className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {resolution.title}
          </motion.h1>
          {resolution.why && (
            <motion.p 
              className="text-sm text-calm-500 mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {resolution.why}
            </motion.p>
          )}
        </div>
        <div className="flex gap-2">
          <motion.button
            onClick={() => setShowDebug(!showDebug)}
            className="p-2 text-calm-400 hover:text-calm-600 rounded-lg hover:bg-white/50 transition-all"
            title="Debug Panel"
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
          >
            <Bug className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>

      {/* Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <MetricPills metrics={metrics} />
      </motion.div>

      {/* Drift Alert */}
      {drift_triggered && latest_mirror && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <Card className="p-4 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 backdrop-blur-sm shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <motion.p 
                  className="font-medium text-amber-800"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ⚠️ Pattern Detected
                </motion.p>
                <p className="text-sm text-amber-600">
                  We noticed some drift in your progress. View your mirror report for insights.
                </p>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => router.push('/mirror')}
                  variant="secondary"
                  size="sm"
                  className="gap-1"
                >
                  <Eye className="w-4 h-4" /> View Mirror
                </Button>
              </motion.div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Current Plan */}
      {current_plan && (
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, type: 'spring' }}
        >
          <Card className="p-4 backdrop-blur-sm bg-white/80 border-white/50 shadow-lg">
            <h2 className="text-sm font-medium text-calm-500 mb-2">Current Plan (v{current_plan.version})</h2>
            <div className="flex flex-wrap gap-3 text-sm">
              {[
                { value: `${current_plan.frequency_per_week}x/week`, icon: '📅' },
                { value: `${current_plan.min_minutes} min`, icon: '⏱' },
                { value: current_plan.time_window, icon: '🌅' },
              ].map((item, i) => (
                <motion.span 
                  key={i}
                  className="px-3 py-1.5 bg-gradient-to-r from-green-100 to-blue-100 text-calm-700 rounded-lg font-medium"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  {item.icon} {item.value}
                </motion.span>
              ))}
            </div>
            {current_plan.recovery_step && (
              <motion.p 
                className="text-sm text-calm-600 mt-3 italic p-2 bg-yellow-50/50 rounded-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                💡 {current_plan.recovery_step}
              </motion.p>
            )}
          </Card>
        </motion.div>
      )}

      {/* Plan Diff (if v2+) */}
      {current_plan && current_plan.version > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <PlanDiff
            oldPlan={{
              frequency_per_week: resolution.frequency_per_week,
              min_minutes: resolution.min_minutes,
              time_window: resolution.time_window,
            }}
            newPlan={current_plan}
          />
        </motion.div>
      )}

      {/* Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="text-sm font-medium text-calm-500 mb-3">Recent Check-ins</h2>
        {recent_checkins.length > 0 ? (
          <Timeline checkins={recent_checkins} />
        ) : (
          <Card className="p-6 text-center text-calm-500 backdrop-blur-sm bg-white/80">
            <motion.p
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ✨ No check-ins yet. Start your first one!
            </motion.p>
          </Card>
        )}
      </motion.div>

      {/* Actions */}
      <motion.div 
        className="space-y-3"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button 
            onClick={() => router.push('/checkin')} 
            size="lg" 
            className="w-full gap-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 shadow-lg shadow-green-500/30"
          >
            <Plus className="w-5 h-5" /> New Check-in
          </Button>
        </motion.div>

        {latest_mirror && (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => router.push('/mirror')}
              variant="secondary"
              size="lg"
              className="w-full gap-2 backdrop-blur-sm bg-white/80"
            >
              <Eye className="w-5 h-5" /> View Latest Mirror
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Demo Actions */}
      <motion.div 
        className="flex gap-2 pt-4 border-t border-calm-200/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleSeedDemo}
            variant="ghost"
            size="sm"
            className="gap-1 text-calm-500"
            disabled={seeding}
          >
            <Database className="w-4 h-4" /> {seeding ? 'Loading...' : 'Load Demo Data'}
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleClearData}
            variant="ghost"
            size="sm"
            className="gap-1 text-calm-500"
          >
            <Trash2 className="w-4 h-4" /> Clear Data
          </Button>
        </motion.div>
      </motion.div>

      {/* Debug Drawer */}
      {showDebug && (
        <DebugDrawer
          metrics={metrics}
          checkins={recent_checkins}
          onClose={() => setShowDebug(false)}
        />
      )}
        </div>
      </PageTransition>
    </div>
  );
}
