'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Slider } from '@/components/ui/Slider';
import { Toggle } from '@/components/ui/Toggle';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { api, Dashboard } from '@/lib/api';

export default function CheckinPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    planned: '',
    actual: '',
    blocker: '',
    completed: false,
    friction: 2,
  });

  useEffect(() => {
    api.getDashboard().then(setDashboard).catch(() => router.push('/'));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashboard?.resolution || !form.planned || !form.actual) return;

    setLoading(true);
    try {
      await api.createCheckin({
        resolution_id: dashboard.resolution.id,
        ...form,
        blocker: form.blocker || undefined,
      });
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!dashboard?.resolution) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  const frictionLabels = ['Low', 'Medium', 'High'];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Daily Check-in</h1>
        <p className="text-gray-500 text-sm">15 seconds to reflect</p>
        <p className="text-drift-600 font-medium">{dashboard.resolution.title}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What did you plan to do?
            </label>
            <Input
              value={form.planned}
              onChange={(e) => setForm({ ...form, planned: e.target.value })}
              placeholder="e.g., Complete one lesson"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What actually happened?
            </label>
            <Input
              value={form.actual}
              onChange={(e) => setForm({ ...form, actual: e.target.value })}
              placeholder="e.g., Did half, got distracted"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Any blockers? (optional)
            </label>
            <Input
              value={form.blocker}
              onChange={(e) => setForm({ ...form, blocker: e.target.value })}
              placeholder="e.g., Kids needed attention"
            />
          </div>
        </Card>

        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Did you complete it?
            </label>
            <Toggle
              checked={form.completed}
              onChange={(v) => setForm({ ...form, completed: v })}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                How much friction?
              </label>
              <span className={`text-sm font-medium ${
                form.friction === 1 ? 'text-green-600' :
                form.friction === 2 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {frictionLabels[form.friction - 1]}
              </span>
            </div>
            <Slider
              min={1}
              max={3}
              value={form.friction}
              onChange={(v) => setForm({ ...form, friction: v })}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Easy</span>
              <span>Hard</span>
            </div>
          </div>
        </Card>

        <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
          {loading ? 'Saving...' : 'Log Check-in'} <CheckCircle className="w-5 h-5" />
        </Button>
      </form>

      <button
        onClick={() => router.push('/dashboard')}
        className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
      >
        ← Back to Dashboard
      </button>
    </div>
  );
}
