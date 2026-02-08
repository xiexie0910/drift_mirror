import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CelebrationProvider } from '@/components/CelebrationProvider';
import { LazyMochiMascot } from '@/components/LazyMochiMascot';

/**
 * DriftMirror Root Layout
 * 
 * Design: Calm Futurism with Glass Depth
 * - Ambient gradient background
 * - Floating orbs for 3D depth
 * - Premium glass materials
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
        {/* Floating orbs for 3D depth - MORE teal */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          {/* Large teal orb top-right */}
          <div 
            className="orb orb-teal-strong animate-float-slow"
            style={{
              width: '600px',
              height: '600px',
              top: '-150px',
              right: '-100px',
            }}
          />
          {/* Cyan orb center-right */}
          <div 
            className="orb orb-cyan animate-float"
            style={{
              width: '400px',
              height: '400px',
              top: '30%',
              right: '5%',
            }}
          />
          {/* Teal orb left side */}
          <div 
            className="orb orb-teal animate-float-delayed"
            style={{
              width: '350px',
              height: '350px',
              top: '50%',
              left: '-50px',
            }}
          />
          {/* Purple accent orb */}
          <div 
            className="orb orb-purple animate-float-slow"
            style={{
              width: '300px',
              height: '300px',
              bottom: '-50px',
              left: '10%',
            }}
          />
          {/* Small teal orb bottom-right */}
          <div 
            className="orb orb-teal animate-pulse-soft"
            style={{
              width: '250px',
              height: '250px',
              bottom: '10%',
              right: '20%',
              opacity: 0.5,
            }}
          />
          {/* Extra small accent orb */}
          <div 
            className="orb orb-cyan animate-float"
            style={{
              width: '150px',
              height: '150px',
              top: '20%',
              left: '30%',
              opacity: 0.4,
            }}
          />
          
          {/* Decorative grid lines */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(20, 184, 166, 0.5) 1px, transparent 1px),
                linear-gradient(90deg, rgba(20, 184, 166, 0.5) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }}
          />
        </div>
        
        {/* Main content */}
        <div className="relative z-10">
          {children}
        </div>
        
        {/* Mochi Mascot - friendly companion */}
        <LazyMochiMascot />
        </CelebrationProvider>
      </body>
    </html>
  );
}
