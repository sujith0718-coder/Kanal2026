'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Clock, FileCheck, Layers } from 'lucide-react';
import { Subject, Topic, Exam } from '@/types';

interface SubjectWithDetails extends Subject {
  topics: Topic[];
  exam?: Exam;
}

export default function SubjectsPage() {
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<SubjectWithDetails[]>([]);

  useEffect(() => {
    fetch('/api/subjects')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSubjects(data.subjects || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-blue-400" />
          <span>Subjects &amp; Syllabus Topics</span>
        </h1>
        <p className="text-xs text-gray-400">Academic structure extracted from syllabi and verified exam schedules.</p>
      </div>

      <div className="space-y-8">
        {subjects.map((subject) => (
          <div
            key={subject.id}
            className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-4"
          >
            {/* Subject Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: subject.color || '#3B82F6' }}
                ></div>
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {subject.name}
                    {subject.code && (
                      <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-mono text-gray-300">
                        {subject.code}
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-gray-400">{subject.topics.length} Syllabus Topic(s)</p>
                </div>
              </div>

              {/* Verified Exam Badge */}
              {subject.exam ? (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-3 py-1.5 text-xs text-emerald-300">
                  <FileCheck className="h-4 w-4 text-emerald-400" />
                  <div>
                    <span className="font-semibold">Exam: {subject.exam.examDate}</span>
                    {subject.exam.sourceDocumentName && (
                      <p className="text-[10px] text-gray-400">
                        Source: {subject.exam.sourceDocumentName} (Page {subject.exam.sourcePage || 1})
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <span className="text-xs text-gray-500">No exam date set</span>
              )}
            </div>

            {/* Topics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subject.topics.map((topic) => (
                <div
                  key={topic.id}
                  className="rounded-xl border border-white/5 bg-white/5 p-4 space-y-3 hover:border-blue-500/30 transition-all"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5 text-purple-400" />
                      {topic.unit || 'General'}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        topic.difficulty === 'HIGH'
                          ? 'bg-red-500/20 text-red-300'
                          : topic.difficulty === 'MEDIUM'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {topic.difficulty} DIFFICULTY
                    </span>
                  </div>

                  <h4 className="font-bold text-white text-sm">{topic.name}</h4>

                  {/* Progress & Mastery Bar */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-gray-300">
                      <span>Estimated Mastery</span>
                      <span className="font-semibold text-blue-400">
                        {topic.masteryStatus === 'UNKNOWN' ? 'Unknown' : `${topic.estimatedMastery}% (${topic.masteryStatus})`}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                        style={{ width: `${topic.estimatedMastery}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {topic.completedMinutes}m / {topic.estimatedMinutesRequired}m
                    </span>

                    <Link
                      href={`/quiz?topicId=${topic.id}`}
                      className="text-purple-400 hover:underline font-medium"
                    >
                      Quiz →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
