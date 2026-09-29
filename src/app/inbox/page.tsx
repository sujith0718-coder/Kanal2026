'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Inbox, Upload, FileText, CheckCircle2, Sparkles, ArrowRight, GraduationCap, Link2, ExternalLink } from 'lucide-react';
import { VerificationStatus } from '@/types';

export default function AcademicInboxPage() {
  const [uploading, setUploading] = useState(false);
  const [classroomConnected, setClassroomConnected] = useState(false);
  const [connectingClassroom, setConnectingClassroom] = useState(false);
  const [extractedData, setExtractedData] = useState<{
    summary?: string;
    exams: Array<{
      subject: string;
      examDate: string;
      sourceDocument?: string;
      sourcePage?: number;
      confidence: number;
      verificationStatus: VerificationStatus;
      sourceType?: 'document' | 'classroom';
    }>;
    topics: Array<{
      subject: string;
      topicName: string;
      unit?: string;
      difficulty: string;
    }>;
  } | null>(null);

  const handleSimulatedUpload = async (filename: string, docType: string) => {
    setUploading(true);
    try {
      const sampleText =
        docType === 'exam'
          ? 'Semester Exam Schedule Fall 2026. Data Structures & Algorithms Exam on Oct 2 at 09:00 Page 2. Discrete Mathematics Exam on Oct 5 at 14:00 Page 2.'
          : 'CS301 Course Syllabus. Unit 3: Binary Search Trees & AVL. Unit 4: Graph Traversal (BFS/DFS). Unit 5: Dynamic Programming.';

      const res = await fetch('/api/academic/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, text: sampleText }),
      });
      const data = await res.json();

      if (data.success) {
        setExtractedData({
          summary: data.extraction.summary,
          exams: data.extraction.exams.map((e: { subject: string; examDate: string; sourceDocument?: string; sourcePage?: number; confidence: number }) => ({
            ...e,
            verificationStatus: 'UNVERIFIED',
            sourceType: 'document',
          })),
          topics: data.extraction.topics || [],
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleConnectClassroom = () => {
    setConnectingClassroom(true);
    setTimeout(() => {
      setClassroomConnected(true);
      setConnectingClassroom(false);
    }, 1000);
  };

  const toggleVerifyExam = (index: number) => {
    if (!extractedData) return;
    const updated = [...extractedData.exams];
    updated[index].verificationStatus =
      updated[index].verificationStatus === 'VERIFIED' ? 'UNVERIFIED' : 'VERIFIED';
    setExtractedData({ ...extractedData, exams: updated });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Inbox className="h-6 w-6 text-blue-400" />
          <span>Academic Inbox &amp; Data Integration</span>
        </h1>
        <p className="text-xs text-gray-400">
          Upload exam schedules, syllabi, or sync Google Classroom assignments into a unified academic inbox.
        </p>
      </div>

      {/* Upload Drop Zone Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          onClick={() => handleSimulatedUpload('Midterm_Exam_Schedule_Fall2026.pdf', 'exam')}
          className="cursor-pointer rounded-2xl border border-dashed border-blue-500/40 bg-slate-900/40 p-8 text-center hover:border-blue-500 hover:bg-slate-900/80 transition-all group"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400 group-hover:scale-110 transition-all">
            <Upload className="h-6 w-6" />
          </div>
          <h3 className="mt-4 font-bold text-white text-base">Upload Exam Schedule PDF</h3>
          <p className="mt-1 text-xs text-gray-400">Click to import &amp; extract exam dates, times, and page references.</p>
          <span className="mt-3 inline-block text-[11px] font-semibold text-blue-400 group-hover:underline">
            Import Exam Schedule →
          </span>
        </div>

        <div
          onClick={() => handleSimulatedUpload('CS301_DSA_Syllabus.pdf', 'syllabus')}
          className="cursor-pointer rounded-2xl border border-dashed border-purple-500/40 bg-slate-900/40 p-8 text-center hover:border-purple-500 hover:bg-slate-900/80 transition-all group"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 group-hover:scale-110 transition-all">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="mt-4 font-bold text-white text-base">Upload Syllabus PDF</h3>
          <p className="mt-1 text-xs text-gray-400">Click to import syllabus units, topic lists, and difficulty tags.</p>
          <span className="mt-3 inline-block text-[11px] font-semibold text-purple-400 group-hover:underline">
            Import Syllabus PDF →
          </span>
        </div>
      </div>

      {uploading && (
        <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-4 text-center text-sm text-blue-300 animate-pulse flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4 animate-spin text-blue-400" />
          <span>Processing document and running structured AI extraction...</span>
        </div>
      )}

      {/* Google Classroom Integration Section */}
      <section className="rounded-2xl border border-emerald-500/30 bg-slate-900/60 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Connect Google Classroom</h3>
              <p className="text-xs text-gray-400">Read-only academic integration to sync course deadlines and assignment due dates.</p>
            </div>
          </div>

          <button
            onClick={handleConnectClassroom}
            disabled={connectingClassroom || classroomConnected}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold transition-all ${
              classroomConnected
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20'
            }`}
          >
            <Link2 className="h-4 w-4" />
            <span>{classroomConnected ? '✓ Google Classroom Connected' : connectingClassroom ? 'Connecting...' : 'Connect Google Classroom'}</span>
          </button>
        </div>

        {classroomConnected && (
          <div className="space-y-3 pt-3 border-t border-white/10 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span>🎓 Synced Classroom Assignments</span>
              </h4>
              <span className="text-[11px] text-gray-400">Auto-synchronized</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-white/10 bg-slate-900/80 p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">OOP Assignment 2</span>
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-300">Not Submitted</span>
                </div>
                <p className="text-gray-400">Course: Object-Oriented Programming</p>
                <div className="flex items-center justify-between text-gray-400 text-[11px] pt-1">
                  <span>Due Tomorrow (23:59)</span>
                  <span className="text-emerald-400 flex items-center gap-1 hover:underline cursor-pointer">
                    View in Classroom <ExternalLink className="h-3 w-3" />
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-900/80 p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Math Tutorial 4</span>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300">Submitted</span>
                </div>
                <p className="text-gray-400">Course: Discrete Mathematics</p>
                <div className="flex items-center justify-between text-gray-400 text-[11px] pt-1">
                  <span>Due in 3 days</span>
                  <span className="text-emerald-400 flex items-center gap-1 hover:underline cursor-pointer">
                    View in Classroom <ExternalLink className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Extracted Information Verification View */}
      {extractedData && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> Extraction Result
              </span>
              <h3 className="text-lg font-bold text-white mt-1">
                {extractedData.summary || `Extracted ${extractedData.exams.length} exam(s) and ${extractedData.topics.length} topic(s)`}
              </h3>
            </div>
            <Link
              href="/plan"
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500"
            >
              <span>Generate Feasible Plan</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Exam Evidence Verification Cards */}
          {extractedData.exams.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-gray-300">Extracted Exam Schedule Records (Verify Evidence Below):</h4>

              <div className="space-y-3">
                {extractedData.exams.map((exam, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{exam.subject}</span>
                        <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs font-mono text-blue-300">
                          {exam.examDate}
                        </span>
                        <span className="rounded bg-gray-500/20 px-2 py-0.5 text-[10px] text-gray-300 flex items-center gap-1">
                          📄 Document
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>Source: {exam.sourceDocument || 'Uploaded PDF'} (Page {exam.sourcePage || 1})</span>
                        <span>Confidence: {Math.round(exam.confidence * 100)}%</span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleVerifyExam(idx)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        exam.verificationStatus === 'VERIFIED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{exam.verificationStatus === 'VERIFIED' ? '✓ Verified' : 'Verify Info'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extracted Syllabus Topics */}
          {extractedData.topics.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="font-semibold text-sm text-gray-300">Extracted Syllabus Topics:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {extractedData.topics.map((t, idx) => (
                  <div key={idx} className="rounded-xl border border-white/5 bg-slate-900/60 p-3 text-xs">
                    <span className="text-gray-400 font-mono">{t.unit || 'Unit'}</span>
                    <h5 className="font-bold text-white text-sm mt-0.5">{t.topicName}</h5>
                    <span className="mt-2 inline-block rounded bg-purple-500/20 px-2 py-0.5 text-[10px] text-purple-300">
                      Difficulty: {t.difficulty}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
