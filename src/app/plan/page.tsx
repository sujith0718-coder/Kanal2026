'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Clock,
  AlertTriangle,
  Sparkles,
  GitBranch,
  ArrowRightLeft,
} from 'lucide-react';
import { PlanVersion, StudySession, PlanChange, FeasibilityResult } from '@/types';

export default function PlanPage() {
  const [loading, setLoading] = useState(true);
  const [versions, setVersions] = useState<PlanVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [changes, setChanges] = useState<PlanChange[]>([]);
  const [feasibility, setFeasibility] = useState<FeasibilityResult | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const res = await fetch('/api/plan');
        const data = await res.json();
        if (isMounted && data.success) {
          setVersions(data.versions || []);
          const active = data.activeVersion;
          if (active) {
            setSelectedVersionId(active.id);
          }
          setSessions(data.sessions || []);
          setChanges(data.changes || []);
          setFeasibility(data.feasibility);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleVersionChange = async (vId: string) => {
    setSelectedVersionId(vId);
    try {
      const res = await fetch(`/api/plan/${vId}/changes`);
      const data = await res.json();
      if (data.success) {
        setChanges(data.changes || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const generateNewPlan = async () => {
    setLoading(true);
    try {
      await fetch('/api/plan/generate', { method: 'POST' });
      const res = await fetch('/api/plan');
      const data = await res.json();
      if (data.success) {
        setVersions(data.versions || []);
        const active = data.activeVersion;
        if (active) setSelectedVersionId(active.id);
        setSessions(data.sessions || []);
        setChanges(data.changes || []);
        setFeasibility(data.feasibility);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Group sessions by date
  const groupedSessions: Record<string, StudySession[]> = {};
  sessions.forEach((s) => {
    if (!groupedSessions[s.date]) groupedSessions[s.date] = [];
    groupedSessions[s.date].push(s);
  });

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Version Selector & Replan CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-blue-400" />
            <span>Study Plan &amp; Timetable</span>
          </h1>
          <p className="text-xs text-gray-400">Deterministic candidate schedule respecting daily capacities and hard constraints.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Plan Version Selector */}
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-3 py-1.5 text-xs text-gray-300">
            <GitBranch className="h-4 w-4 text-purple-400" />
            <select
              value={selectedVersionId}
              onChange={(e) => handleVersionChange(e.target.value)}
              className="bg-transparent font-medium text-white focus:outline-none"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id} className="bg-slate-900 text-white">
                  Plan v{v.versionNumber} ({v.trigger}) {v.status === 'ACTIVE' ? '★ Active' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={generateNewPlan}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Regenerate Plan</span>
          </button>
        </div>
      </div>

      {/* Plan Feasibility Indicator */}
      {feasibility && (
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs">
            <span className={`rounded-md px-2.5 py-1 font-bold ${
              feasibility.state === 'GREEN'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : feasibility.state === 'YELLOW'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              Feasibility: {feasibility.state}
            </span>
            <span className="text-gray-300">
              Required: {Math.round(feasibility.requiredMinutes / 60)}h | Available: {Math.round(feasibility.availableMinutes / 60)}h
            </span>
          </div>

          {feasibility.state === 'RED' && (
            <Link
              href="/rescue"
              className="flex items-center gap-1.5 text-xs font-medium text-red-400 hover:underline"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Infeasible schedule detected. Open Rescue Mode</span>
            </Link>
          )}
        </div>
      )}

      {/* Timetable View Grouped by Date */}
      <div className="space-y-6">
        {Object.keys(groupedSessions).length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-12 text-center text-gray-400">
            No sessions scheduled for this plan version. Click Regenerate Plan to create candidate schedule.
          </div>
        ) : (
          Object.entries(groupedSessions).map(([dateStr, daySessions]) => (
            <div key={dateStr} className="space-y-3">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <CalendarDays className="h-4 w-4 text-blue-400" />
                <h3 className="font-bold text-white text-sm">{dateStr}</h3>
                <span className="text-xs text-gray-400">
                  ({daySessions.reduce((sum, s) => sum + s.durationMinutes, 0)} mins total)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {daySessions.map((session) => (
                  <div
                    key={session.id}
                    className={`rounded-xl border p-4 transition-all ${
                      session.status === 'COMPLETED'
                        ? 'border-emerald-500/30 bg-emerald-950/20'
                        : session.status === 'MISSED'
                        ? 'border-red-500/30 bg-red-950/20'
                        : 'border-white/10 bg-slate-900/60 hover:border-blue-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-blue-400">{session.subjectName}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          session.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : session.status === 'MISSED'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}
                      >
                        {session.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-white text-sm">{session.topicName || session.topicId}</h4>

                    <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        <span>{session.startTime} - {session.endTime} ({session.durationMinutes}m)</span>
                      </div>
                      <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-gray-300">
                        {session.energyRequirement} Energy
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Plan Changes / Version Changelog Section */}
      {changes.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-purple-400" />
            <span>Plan Version Changelog &amp; Diffs</span>
          </h3>

          <div className="space-y-3 text-xs">
            {changes.map((change) => (
              <div
                key={change.id}
                className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/5 p-3"
              >
                <span
                  className={`rounded px-2 py-0.5 font-bold uppercase text-[10px] ${
                    change.changeType === 'SPLIT'
                      ? 'bg-purple-500/20 text-purple-300'
                      : change.changeType === 'MOVED'
                      ? 'bg-blue-500/20 text-blue-300'
                      : change.changeType === 'DEFERRED'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {change.changeType}
                </span>
                <div>
                  <p className="font-medium text-gray-200">{change.description}</p>
                  <p className="text-gray-400 mt-0.5">Reason: {change.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
