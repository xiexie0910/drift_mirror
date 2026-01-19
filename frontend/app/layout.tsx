import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DriftMirror',
  description: 'Track your goals, reflect on your progress, adapt your plans.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <main className="max-w-2xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
