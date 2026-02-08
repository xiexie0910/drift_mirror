'use client';

import dynamic from 'next/dynamic';

const MochiMascot = dynamic(
  () => import('@/components/MochiMascot').then(mod => ({ default: mod.MochiMascot })),
  { ssr: false }
);

export function LazyMochiMascot() {
  return <MochiMascot />;
}
