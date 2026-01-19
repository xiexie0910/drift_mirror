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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!dashboard?.resolution) return null;

  const { resolution, current_plan, metrics, recent_checkins, latest_mirror, drift_triggered } = dashboard;

  // Get previous plan for diff
  const plans = dashboard.current_plan ? [dashboard.current_plan] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{resolution.title}</h1>
          {resolution.why && (
            <p className="text-sm text-gray-500 mt-1">{resolution.why}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            title="Debug Panel"
          >
            <Bug className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Metrics */}
      <MetricPills metrics={metrics} />

      {/* Drift Alert */}
      {drift_triggered && latest_mirror && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-4 border-amber-300 bg-amber-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-amber-800">Pattern Detected</p>
                <p className="text-sm text-amber-600">
                  We noticed some drift in your progress. View your mirror report for insights.
                </p>
              </div>
              <Button
                onClick={() => router.push('/mirror')}
                variant="secondary"
                size="sm"
                className="gap-1"
              >
                <Eye className="w-4 h-4" /> View Mirror
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Current Plan */}
      {current_plan && (
        <Card className="p-4">
          <h2 className="text-sm font-medium text-gray-500 mb-2">Current Plan (v{current_plan.version})</h2>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="px-2 py-1 bg-drift-100 text-drift-700 rounded">
              {current_plan.frequency_per_week}x/week
            </span>
            <span className="px-2 py-1 bg-drift-100 text-drift-700 rounded">
              {current_plan.min_minutes} min
            </span>
            <span className="px-2 py-1 bg-drift-100 text-drift-700 rounded">
              {current_plan.time_window}
            </span>
          </div>
          {current_plan.recovery_step && (
            <p className="text-sm text-gray-600 mt-3 italic">
              💡 {current_plan.recovery_step}
            </p>
          )}
        </Card>
      )}

      {/* Plan Diff (if v2+) */}
      {current_plan && current_plan.version > 1 && (
        <PlanDiff
          oldPlan={{
            frequency_per_week: resolution.frequency_per_week,
            min_minutes: resolution.min_minutes,
            time_window: resolution.time_window,
          }}
          newPlan={current_plan}
        />
      )}

      {/* Timeline */}
      <div>
        <h2 className="text-sm font-medium text-gray-500 mb-3">Recent Check-ins</h2>
        {recent_checkins.length > 0 ? (
          <Timeline checkins={recent_checkins} />
        ) : (
          <Card className="p-6 text-center text-gray-500">
            <p>No check-ins yet. Start your first one!</p>
          </Card>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button onClick={() => router.push('/checkin')} size="lg" className="w-full gap-2">
          <Plus className="w-5 h-5" /> New Check-in
        </Button>

        {latest_mirror && (
          <Button
            onClick={() => router.push('/mirror')}
            variant="secondary"
            size="lg"
            className="w-full gap-2"
          >
            <Eye className="w-5 h-5" /> View Latest Mirror
          </Button>
        )}
      </div>

      {/* Demo Actions */}
      <div className="flex gap-2 pt-4 border-t">
        <Button
          onClick={handleSeedDemo}
          variant="ghost"
          size="sm"
          className="gap-1 text-gray-500"
          disabled={seeding}
        >
          <Database className="w-4 h-4" /> {seeding ? 'Loading...' : 'Load Demo Data'}
        </Button>
        <Button
          onClick={handleClearData}
          variant="ghost"
          size="sm"
          className="gap-1 text-gray-500"
        >
          <Trash2 className="w-4 h-4" /> Clear Data
        </Button>
      </div>

      {/* Debug Drawer */}
      {showDebug && (
        <DebugDrawer
          metrics={metrics}
          checkins={recent_checkins}
          onClose={() => setShowDebug(false)}
        />
      )}
    </div>
  );
}
