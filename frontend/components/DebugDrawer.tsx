'use client';

import { motion } from 'framer-motion';
import { Card } from './ui/Card';
import { Tabs } from './ui/Tabs';
import { X } from 'lucide-react';
import { Metrics, Checkin } from '@/lib/api';

interface DebugDrawerProps {
  metrics: Metrics;
  checkins: Checkin[];
  onClose: () => void;
}

export function DebugDrawer({ metrics, checkins, onClose }: DebugDrawerProps) {
  const signalsContent = (
    <div className="space-y-2 text-xs font-mono">
      <p className="text-gray-500">Last 3 checkins analysis:</p>
      {checkins.slice(0, 3).map((c, i) => (
        <div key={c.id} className="p-2 bg-gray-50 rounded">
          <p>#{i + 1}: {c.completed ? '✓' : '✗'} friction={c.friction}</p>
          <p className="text-gray-500 truncate">planned: {c.planned}</p>
        </div>
      ))}
    </div>
  );

  const rulesContent = (
    <div className="space-y-2 text-xs font-mono">
      <div className="p-2 bg-gray-50 rounded">
        <p className="font-medium">Drift Calculation:</p>
        <p>• completion_weight: 0.4</p>
        <p>• friction_weight: 0.25</p>
        <p>• blocker_weight: 0.2</p>
        <p>• signal_weight: 0.15</p>
      </div>
      <div className="p-2 bg-gray-50 rounded">
        <p className="font-medium">Trigger Conditions:</p>
        <p>• drift_threshold: 0.4</p>
        <p>• min_checkins: 3</p>
        <p className="text-drift-600">
          Current: {metrics.drift_score > 0.4 && metrics.total_checkins >= 3 ? 'TRIGGERED' : 'not triggered'}
        </p>
      </div>
    </div>
  );

  const jsonContent = (
    <pre className="text-xs font-mono bg-gray-50 p-3 rounded overflow-auto max-h-48">
      {JSON.stringify({ metrics, checkins_count: checkins.length }, null, 2)}
    </pre>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-700">Debug Panel</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
        <Tabs
          tabs={[
            { id: 'signals', label: 'Signals', content: signalsContent },
            { id: 'rules', label: 'Rules', content: rulesContent },
            { id: 'json', label: 'JSON', content: jsonContent },
          ]}
        />
      </Card>
    </motion.div>
  );
}
