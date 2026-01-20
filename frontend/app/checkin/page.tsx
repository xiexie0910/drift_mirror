'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Slider } from '@/components/ui/Slider';
import { Toggle } from '@/components/ui/Toggle';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { api, Dashboard } from '@/lib/api';
import { 
  AnimatedBackground, 
  FloatingParticles, 
  FloatingShapes,
  AnimatedDecorations,
  PageTransition,
  FloatingImage 
} from '@/components/animations/AnimatedBackground';

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
      <div className="min-h-screen relative">
        <AnimatedBackground theme="checkin" />
        <FloatingParticles count={15} />
        <div className="flex items-center justify-center min-h-screen">
          <motion.div 
            className="text-yellow-500 text-xl font-medium"
            animate={{ opacity: [0.5, 1, 0.5], scale: [0.98, 1.02, 0.98] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ⏱ Loading...
          </motion.div>
        </div>
      </div>
    );
  }

  const frictionLabels = ['Low', 'Medium', 'High'];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground theme="checkin" />
      <FloatingParticles count={25} />
      <FloatingShapes />
      <AnimatedDecorations />
      
      {/* Floating checklist illustration */}
      <FloatingImage 
        src="/images/checklist.svg" 
        alt="Checklist illustration" 
        size={150} 
        position="top-right"
        delay={0.3}
      />
      
      <PageTransition className="relative z-10 py-6 px-4">
        <div className="max-w-lg mx-auto space-y-6">
          <motion.div 
            className="text-center space-y-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.h1 
              className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Daily Check-in
            </motion.h1>
            <motion.p 
              className="text-calm-500 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              ⏱ 15 seconds to reflect
            </motion.p>
            <motion.p 
              className="text-yellow-600 font-medium"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {dashboard.resolution.title}
            </motion.p>
          </motion.div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          <Card className="p-4 space-y-4 backdrop-blur-sm bg-white/80 border-white/50 shadow-lg">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-medium text-calm-700 mb-1">
                What did you plan to do?
              </label>
              <Input
                value={form.planned}
                onChange={(e) => setForm({ ...form, planned: e.target.value })}
                placeholder="e.g., Complete one lesson"
                required
                autoFocus
                className="bg-white/50"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-medium text-calm-700 mb-1">
                What actually happened?
              </label>
              <Input
                value={form.actual}
                onChange={(e) => setForm({ ...form, actual: e.target.value })}
                placeholder="e.g., Did half, got distracted"
                required
                className="bg-white/50"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="block text-sm font-medium text-calm-700 mb-1">
                Any blockers? (optional)
              </label>
              <Input
                value={form.blocker}
                onChange={(e) => setForm({ ...form, blocker: e.target.value })}
                placeholder="e.g., Kids needed attention"
                className="bg-white/50"
              />
            </motion.div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, type: 'spring' }}
        >
          <Card className="p-4 space-y-4 backdrop-blur-sm bg-white/80 border-white/50 shadow-lg">
            <motion.div 
              className="flex items-center justify-between"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <label className="text-sm font-medium text-calm-700">
                Did you complete it?
              </label>
              <Toggle
                checked={form.completed}
                onChange={(v) => setForm({ ...form, completed: v })}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-calm-700">
                  How much friction?
                </label>
                <motion.span 
                  className={`text-sm font-medium px-2 py-0.5 rounded-lg ${
                    form.friction === 1 ? 'text-green-600 bg-green-100' :
                    form.friction === 2 ? 'text-yellow-600 bg-yellow-100' : 'text-red-600 bg-red-100'
                  }`}
                  key={form.friction}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  {frictionLabels[form.friction - 1]}
                </motion.span>
              </div>
              <Slider
                min={1}
                max={3}
                value={form.friction}
                onChange={(v) => setForm({ ...form, friction: v })}
              />
              <div className="flex justify-between text-xs text-calm-400 mt-1">
                <span>😊 Easy</span>
                <span>😰 Hard</span>
              </div>
            </motion.div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button 
            type="submit" 
            size="lg" 
            className="w-full gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-lg shadow-yellow-500/30" 
            disabled={loading}
          >
            {loading ? '✨ Saving...' : 'Log Check-in'} <CheckCircle className="w-5 h-5" />
          </Button>
        </motion.div>
      </form>

      <motion.button
        onClick={() => router.push('/dashboard')}
        className="w-full text-center text-sm text-calm-500 hover:text-calm-700 py-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        whileHover={{ x: -5 }}
      >
        ← Back to Dashboard
      </motion.button>
        </div>
      </PageTransition>
    </div>
  );
}
