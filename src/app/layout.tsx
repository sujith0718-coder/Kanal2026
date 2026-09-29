import type { Metadata } from 'next';
import './globals.css';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'StudyAI — Adaptive Academic Planner',
  description: 'A study plan should not break just because the student day did. Adaptive scheduling, exam risk radar, micro-quizzes, and rescue mode.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-gray-100 antialiased min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
          {children}
        </main>
        <footer className="border-t border-white/5 py-4 text-center text-xs text-gray-500">
          StudyAI Adaptive Academic Planner &copy; 2026. Deterministic backend &amp; AI-assisted system.
        </footer>
      </body>
    </html>
  );
}
