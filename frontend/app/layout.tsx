import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { MochiMascot } from '@/components/MochiMascot';
import { CelebrationProvider } from '@/components/CelebrationProvider';

/**
 * DriftMirror Root Layout
 * 
 * Design: Calm Futurism with Glass Depth
 * - Ambient gradient background
 * - Floating orbs for 3D depth
 * - Premium reflective glass materials (Mirror effect)
 */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DriftMirror',
  description: 'A system for self-alignment. Track behavior, observe patterns, adapt plans.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} overflow-x-hidden`}>
      <body className="min-h-screen font-sans text-neutral-800 antialiased ambient-bg overflow-y-auto overflow-x-hidden">
        <CelebrationProvider>
        {/* Main content - orbs are now handled by ParallaxOrbs component on pages that need them */}
        <div className="relative z-10">
          {children}
        </div>
        
        {/* Mochi Mascot - friendly companion */}
        <MochiMascot />
        </CelebrationProvider>
      </body>
    </html>
  );
}
