'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Play, Pause, CheckCircle2, RotateCcw } from 'lucide-react';

function SessionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const topicId = searchParams.get('topicId') || 'top-dsa-trees';
  const duration = parseInt(searchParams.get('duration') || '45', 10);

  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase] = useState<'Recall' | 'Learn' | 'Practice' | 'WrapUp'>('Learn');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleComplete = () => {
    setIsRunning(false);
    router.push(`/quiz?topicId=${topicId}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      <div className="text-center space-y-2">
        <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-400 border border-blue-500/30">
          Structured Study Session
        </span>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Binary Search Trees &amp; AVL Rotations
        </h1>
        <p className="text-xs text-gray-400">Data Structures &amp; Algorithms (CS301)</p>
      </div>

      {/* Pomodoro Phase Progress Bar */}
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <div className={`rounded-xl border p-2 ${currentPhase === 'Recall' ? 'border-blue-500 bg-blue-500/20 text-blue-300 font-bold' : 'border-white/10 bg-slate-900/60 text-gray-400'}`}>
          5m Recall
        </div>
        <div className={`rounded-xl border p-2 ${currentPhase === 'Learn' ? 'border-blue-500 bg-blue-500/20 text-blue-300 font-bold' : 'border-white/10 bg-slate-900/60 text-gray-400'}`}>
          15m Learn
        </div>
        <div className={`rounded-xl border p-2 ${currentPhase === 'Practice' ? 'border-blue-500 bg-blue-500/20 text-blue-300 font-bold' : 'border-white/10 bg-slate-900/60 text-gray-400'}`}>
          15m Practice
        </div>
        <div className={`rounded-xl border p-2 ${currentPhase === 'WrapUp' ? 'border-purple-500 bg-purple-500/20 text-purple-300 font-bold' : 'border-white/10 bg-slate-900/60 text-gray-400'}`}>
          5m Quiz
        </div>
      </div>

      {/* Main Timer Display */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 p-12 text-center shadow-2xl">
        <div className="font-mono text-6xl sm:text-7xl font-bold tracking-wider text-white">
          {formatTime(timeLeft)}
        </div>
        <p className="mt-3 text-xs text-gray-400">
          Current Focus: <span className="text-blue-400 font-semibold">{currentPhase} Phase</span>
        </p>

        {/* Timer Control Buttons */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all active:scale-95"
          >
            {isRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5 fill-white" />}
          </button>
          <button
            onClick={() => setTimeLeft(duration * 60)}
            className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 transition-all"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Finish & Take Micro-Quiz CTA */}
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="text-xs text-gray-400 hover:text-white">
          ← Back to Today
        </Link>
        <button
          onClick={handleComplete}
          className="flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-600/30 hover:bg-purple-500 transition-all text-sm"
        >
          <CheckCircle2 className="h-5 w-5" />
          <span>Complete &amp; Take 2-Min Micro-Quiz</span>
        </button>
      </div>
    </div>
  );
}

export default function StudySessionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      }
    >
      <SessionContent />
    </Suspense>
  );
}
