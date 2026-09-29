'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Play,
  HelpCircle,
  Calendar,
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';
import { NextBestAction, StudySession, FeasibilityResult, ExamRiskResult } from '@/types';

export default function TodayPage() {
  const [loading, setLoading] = useState(true);
  const [nextAction, setNextAction] = useState<NextBestAction | null>(null);
  const [todaySessions, setTodaySessions] = useState<StudySession[]>([]);
  const [feasibility, setFeasibility] = useState<FeasibilityResult | null>(null);
  const [risks, setRisks] = useState<ExamRiskResult[]>([]);
  const [showWhyModal, setShowWhyModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const res = await fetch('/api/today');
        const data = await res.json();
        if (isMounted && data.success) {
          setNextAction(data.nextAction);
          setTodaySessions(data.todaySessions || []);
          setFeasibility(data.feasibility);
          setRisks(data.risks || []);
        }
      } catch (err) {
        console.error('Failed to load today page data', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const markComplete = async (sessionId: string) => {
    try {
      await fetch(`/api/sessions/${sessionId}/complete`, { method: 'POST' });
      const res = await fetch('/api/today');
      const data = await res.json();
      if (data.success) {
        setNextAction(data.nextAction);
        setTodaySessions(data.todaySessions || []);
        setFeasibility(data.feasibility);
        setRisks(data.risks || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markMissed = async (sessionId: string) => {
    try {
      await fetch(`/api/sessions/${sessionId}/miss`, { method: 'POST' });
      const res = await fetch('/api/today');
      const data = await res.json();
      if (data.success) {
        setNextAction(data.nextAction);
        setTodaySessions(data.todaySessions || []);
        setFeasibility(data.feasibility);
        setRisks(data.risks || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-sm text-gray-400">Loading your academic schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Plan Health / Feasibility Banner */}
      {feasibility && (
        <div
          className={`flex items-center justify-between rounded-xl border p-4 backdrop-blur-md transition-all ${
            feasibility.state === 'GREEN'
              ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
              : feasibility.state === 'YELLOW'
              ? 'border-amber-500/30 bg-amber-950/20 text-amber-300'
              : 'border-red-500/30 bg-red-950/30 text-red-300'
          }`}
        >
          <div className="flex items-center gap-3">
            {feasibility.state === 'GREEN' ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            ) : feasibility.state === 'YELLOW' ? (
              <AlertOctagon className="h-6 w-6 text-amber-400" />
            ) : (
              <AlertOctagon className="h-6 w-6 text-red-400" />
            )}
            <div>
              <div className="flex items-center gap-2 font-semibold">
                <span>Plan Feasibility: {feasibility.state}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-normal">
                  Available: {Math.round(feasibility.availableMinutes / 60)}h / Required: {Math.round(feasibility.requiredMinutes / 60)}h
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">{feasibility.explanation}</p>
            </div>
          </div>

          {feasibility.state === 'RED' && (
            <Link
              href="/rescue"
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg shadow-red-600/30 hover:bg-red-500"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Rescue Plan</span>
            </Link>
          )}
        </div>
      )}

      {/* Hero Section: Next Best Action */}
      <section className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 p-6 sm:p-8 shadow-2xl shadow-blue-500/10">
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
          <Sparkles className="h-4 w-4" />
          <span>Your Next Best Action</span>
        </div>

        {nextAction ? (
          <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="rounded-md bg-blue-500/20 px-2.5 py-1 text-xs font-semibold text-blue-300 border border-blue-500/30">
                  {nextAction.subjectName}
                </span>
                <span className="rounded-md bg-purple-500/20 px-2.5 py-1 text-xs font-semibold text-purple-300 border border-purple-500/30">
                  {nextAction.durationMinutes} min session
                </span>
                <span className="rounded-md bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-300">
                  Priority: {nextAction.priorityLevel} ({nextAction.priorityScore}/100)
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {nextAction.topicName}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-300">
                {nextAction.daysUntilExam !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-amber-400" />
                    <span>Exam in {nextAction.daysUntilExam} day(s) ({nextAction.examDate})</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span>Estimated Mastery: {nextAction.estimatedMastery}%</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/session?topicId=${nextAction.topicId}&duration=${nextAction.durationMinutes}`}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 active:scale-95 transition-all text-sm"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>Start Session</span>
              </Link>
              <button
                onClick={() => setShowWhyModal(!showWhyModal)}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all"
              >
                <HelpCircle className="h-4 w-4 text-blue-400" />
                <span>Why this?</span>
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-gray-400">No pending study session for today. Great job!</p>
        )}

        {/* Why this modal / accordion breakdown */}
        {showWhyModal && nextAction && (
          <div className="mt-6 rounded-xl border border-blue-500/20 bg-slate-900/90 p-4 text-xs space-y-2 animate-fadeIn">
            <h4 className="font-semibold text-blue-300">Transparent Planning Reasons:</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-300">
              {nextAction.reasonFactors.map((factor, idx) => (
                <li key={idx}>{factor}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Today's Remaining Sessions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-400" />
              <span>Today&apos;s Study Schedule</span>
            </h2>
            <Link href="/plan" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
              View Full Timetable <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {todaySessions.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-slate-900/40 p-6 text-center text-gray-400 text-sm">
                No sessions scheduled for today. Check your full plan!
              </div>
            ) : (
              todaySessions.map((session) => (
                <div
                  key={session.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 transition-all ${
                    session.status === 'COMPLETED'
                      ? 'border-emerald-500/30 bg-emerald-950/10 opacity-75'
                      : session.status === 'MISSED'
                      ? 'border-red-500/30 bg-red-950/10'
                      : 'border-white/10 bg-slate-900/60 hover:border-blue-500/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 font-semibold text-xs">
                      {session.startTime}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-blue-400">{session.subjectName}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          session.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : session.status === 'MISSED'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {session.status}
                        </span>
                      </div>
                      <h4 className="font-semibold text-white text-sm">{session.topicName || session.topicId}</h4>
                      <p className="text-xs text-gray-400">{session.durationMinutes} mins • {session.energyRequirement} Energy</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {session.status === 'PLANNED' && (
                      <>
                        <Link
                          href={`/session?topicId=${session.topicId}&duration=${session.durationMinutes}`}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500"
                        >
                          Start
                        </Link>
                        <button
                          onClick={() => markComplete(session.id)}
                          className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-900/50"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => markMissed(session.id)}
                          className="rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-900/50"
                        >
                          Missed
                        </button>
                      </>
                    )}
                    {session.status === 'COMPLETED' && (
                      <Link
                        href={`/quiz?topicId=${session.topicId}`}
                        className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-500"
                      >
                        Take Quiz
                      </Link>
                    )}
                    {session.status === 'MISSED' && (
                      <Link
                        href="/rescue"
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500"
                      >
                        Rescue
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: Risk Radar Quick Summary */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-400" />
              <span>Exam Risk Radar</span>
            </h2>
            <Link href="/risk" className="text-xs text-blue-400 hover:underline">
              Details
            </Link>
          </div>

          <div className="space-y-3">
            {risks.map((risk) => (
              <div
                key={risk.subjectId}
                className="rounded-xl border border-white/10 bg-slate-900/60 p-4 space-y-2 hover:border-white/20 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-white">{risk.subjectName}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      risk.level === 'HIGH'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : risk.level === 'MEDIUM'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {risk.level} ({risk.score}/100)
                  </span>
                </div>
                <p className="text-xs text-gray-400 line-clamp-2">{risk.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
