'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Sparkles, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';

export default function Home() {
  const router = useRouter();
  const [hasResolution, setHasResolution] = useState<boolean | null>(null);

  useEffect(() => {
    api.getDashboard().then((data) => {
      setHasResolution(!!data.resolution);
      if (data.resolution) {
        router.push('/dashboard');
      }
    }).catch(() => setHasResolution(false));
  }, [router]);

  if (hasResolution === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-12">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-8 h-8 text-drift-500" />
          <h1 className="text-3xl font-bold text-gray-900">DriftMirror</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-md mx-auto">
          Track your goals. Reflect on your patterns. Adapt without judgment.
        </p>
      </div>

      <Card className="p-8 text-center space-y-6">
        <blockquote className="text-xl italic text-gray-700 border-l-4 border-drift-400 pl-4 text-left">
          "Start before you think about the value. Value comes after you start. Don't wait."
        </blockquote>
        
        <Button onClick={() => router.push('/onboarding')} size="lg" className="gap-2">
          Begin Your Journey <ArrowRight className="w-5 h-5" />
        </Button>
      </Card>

      <div className="grid gap-4 text-sm text-gray-600">
        <div className="flex items-start gap-3">
          <span className="text-drift-500 font-bold">1.</span>
          <span>Set a simple goal in under 30 seconds</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-drift-500 font-bold">2.</span>
          <span>Quick daily check-ins (15 seconds)</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-drift-500 font-bold">3.</span>
          <span>Get non-judgmental insights when you drift</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-drift-500 font-bold">4.</span>
          <span>Your plan adapts automatically to keep you going</span>
        </div>
      </div>
    </div>
  );
}
