'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert, Sparkles, TrendingUp, Calendar, BookOpen, BarChart3 } from 'lucide-react';
import { ExamRiskResult } from '@/types';

export default function RiskPage() {
  const [loading, setLoading] = useState(true);
  const [risks, setRisks] = useState<ExamRiskResult[]>([]);

  useEffect(() => {
    fetch('/api/risk')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRisks(data.risks || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-amber-400" />
          <span>Exam Risk Radar</span>
        </h1>
        <p className="text-xs text-gray-400">
          Transparent study-planning risk scores calculated deterministically from urgency, syllabus workload, and mastery gaps.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {risks.map((risk) => (
          <div
            key={risk.subjectId}
            className={`rounded-2xl border p-6 space-y-4 backdrop-blur-md transition-all ${
              risk.level === 'HIGH'
                ? 'border-red-500/30 bg-gradient-to-br from-slate-900 via-red-950/20 to-slate-900'
                : risk.level === 'MEDIUM'
                ? 'border-amber-500/30 bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900'
                : 'border-emerald-500/30 bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-900'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">{risk.subjectName}</h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  risk.level === 'HIGH'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : risk.level === 'MEDIUM'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {risk.level} RISK ({risk.score}/100)
              </span>
            </div>

            {/* Transparent Bullet Reason */}
            <div className="rounded-xl border border-white/5 bg-slate-900/60 p-4 text-xs text-gray-300">
              <span className="font-semibold text-white block mb-1">Deterministic Assessment:</span>
              <p>{risk.reason}</p>
            </div>

            {/* Factor Breakdown Bars */}
            <div className="space-y-3 pt-2 text-xs">
              <h4 className="font-bold text-gray-300 uppercase tracking-wider text-[10px]">
                Risk Contribution Factors
              </h4>

              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-gray-300">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-amber-400" /> Exam Urgency (45%)
                    </span>
                    <span className="font-mono">{risk.factors.examUrgency}/100</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-amber-500" style={{ width: `${risk.factors.examUrgency}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-gray-300">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5 text-purple-400" /> Mastery Gap (25%)
                    </span>
                    <span className="font-mono">{risk.factors.masteryGap}/100</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-purple-500" style={{ width: `${risk.factors.masteryGap}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-gray-300">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5 text-blue-400" /> Remaining Syllabus (20%)
                    </span>
                    <span className="font-mono">{risk.factors.remainingSyllabus}/100</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-blue-500" style={{ width: `${risk.factors.remainingSyllabus}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-gray-300">
                    <span className="flex items-center gap-1">
                      <BarChart3 className="h-3.5 w-3.5 text-red-400" /> Topic Difficulty (10%)
                    </span>
                    <span className="font-mono">{risk.factors.difficulty}/100</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-red-500" style={{ width: `${risk.factors.difficulty}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Narrative Explanation */}
            {risk.aiExplanation && (
              <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-950/20 p-3 text-xs text-blue-200 flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <p>{risk.aiExplanation}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
