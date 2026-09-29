'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, ArrowRight, Sparkles, ShieldCheck, ArrowRightLeft } from 'lucide-react';
import { RescueResult } from '@/types';

export default function RescueModePage() {
  const [rescuing, setRescuing] = useState(false);
  const [rescueResult, setRescueResult] = useState<RescueResult | null>(null);

  const handleTriggerRescue = async () => {
    setRescuing(true);
    try {
      const res = await fetch('/api/rescue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missedSessionIds: [] }),
      });
      const data = await res.json();
      if (data.success) {
        setRescueResult(data.rescueResult);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRescuing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-600 to-amber-600 text-white shadow-xl shadow-red-600/30">
          <AlertTriangle className="h-7 w-7 animate-pulse text-amber-200" />
        </div>

        <h1 className="text-3xl font-bold text-white tracking-tight">
          Rescue Mode — Adaptive Recovery
        </h1>
        <p className="text-xs sm:text-sm text-gray-300 max-w-xl mx-auto">
          Life happens. Missed study sessions do not mean your semester is ruined. Rescue Mode redistributes remaining workload across available capacity while protecting upcoming exams.
        </p>
      </div>

      {/* Trigger Rescue Action Button */}
      {!rescueResult ? (
        <div className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-slate-900 via-red-950/20 to-slate-900 p-8 text-center space-y-6 shadow-2xl">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">Ready to Rebuild Your Schedule?</h3>
            <p className="text-xs text-gray-400">
              The engine will recalculate topic priorities, respect your daily capacity limit (4h max), protect your high-urgency exams, and create Plan v2.
            </p>
          </div>

          <button
            onClick={handleTriggerRescue}
            disabled={rescuing}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-red-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-red-600/30 hover:from-red-500 hover:to-amber-500 transition-all active:scale-95 disabled:opacity-50"
          >
            {rescuing ? (
              <>
                <RotateCcw className="h-5 w-5 animate-spin" />
                <span>Recalculating Feasible Plan...</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5" />
                <span>🚨 Rescue My Schedule Now</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* Rescue Result View: Original vs Rescued Plan */
        <div className="space-y-6 animate-fadeIn">
          {/* Success Banner */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-300">Plan v2 Created Successfully!</h3>
              <p className="text-xs text-gray-300 mt-0.5">{rescueResult.message}</p>
            </div>
          </div>

          {/* AI Explanation of Changes */}
          {rescueResult.aiExplanation && (
            <div className="rounded-2xl border border-blue-500/30 bg-slate-900/80 p-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
                <Sparkles className="h-4 w-4" /> AI Explanation of Changes
              </div>
              <p className="text-xs sm:text-sm text-gray-200">{rescueResult.aiExplanation}</p>
            </div>
          )}

          {/* Schedule Changes Diffs List */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-purple-400" />
              <span>Logged Schedule Changes ({rescueResult.changes.length})</span>
            </h3>

            <div className="space-y-3">
              {rescueResult.changes.map((change) => (
                <div
                  key={change.id}
                  className="rounded-xl border border-white/5 bg-white/5 p-4 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded px-2 py-0.5 font-bold uppercase text-[10px] ${
                        change.changeType === 'SPLIT'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : change.changeType === 'MOVED'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : change.changeType === 'DEFERRED'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {change.changeType}
                    </span>
                  </div>
                  <p className="font-semibold text-white text-sm">{change.description}</p>
                  <p className="text-gray-400">Reason: {change.reason}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Link
              href="/plan"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 text-sm"
            >
              <span>View Rescued Timetable</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
