'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Award, Sparkles, ArrowRight, TrendingUp } from 'lucide-react';
import { Quiz } from '@/types';

function QuizContent() {
  const searchParams = useSearchParams();
  const topicId = searchParams.get('topicId') || 'top-dsa-trees';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    scorePercentage: number;
    correctAnswersCount: number;
    totalQuestions: number;
    masteryUpdate?: {
      previousMastery: number;
      newMastery: number;
      newStatus: string;
      delta: number;
    };
  } | null>(null);

  useEffect(() => {
    // Fetch mock/generated quiz for topic
    fetch(`/api/today`)
      .then(() => {
        setQuiz({
          id: 'quiz-dsa-trees-1',
          topicId,
          topicName: 'Academic Topic',
          title: '2-Minute Mastery Check',
          createdAt: new Date().toISOString(),
          questions: [
            {
              id: 'q1',
              question: 'What is the worst-case time complexity of searching an unbalanced Binary Search Tree with N nodes?',
              options: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'],
              correctAnswer: 'O(N)',
              explanation: 'In the worst case, an unbalanced BST degenerates into a single linked list, resulting in O(N) search time.',
            },
            {
              id: 'q2',
              question: 'In an AVL Tree, what balance factor triggers a Left-Right (LR) double rotation?',
              options: [
                'Node is heavy (+2) and its left child is right-heavy (-1)',
                'Node is right-heavy (-2) and left child is left-heavy (+1)',
                'Node balance factor is 0',
                'Left child balance factor is +2',
              ],
              correctAnswer: 'Node is heavy (+2) and its left child is right-heavy (-1)',
              explanation: 'An LR rotation is performed when a node has a balance factor of +2 and its left subtree is right-heavy (-1).',
            },
            {
              id: 'q3',
              question: 'Which tree traversal algorithm outputs the elements of a BST in strictly sorted ascending order?',
              options: ['Pre-order traversal', 'In-order traversal', 'Post-order traversal', 'Level-order traversal'],
              correctAnswer: 'In-order traversal',
              explanation: 'In-order traversal (Left, Root, Right) yields the key values in non-decreasing order for any valid BST.',
            },
          ],
        });
      })
      .finally(() => setLoading(false));
  }, [topicId]);

  const handleSelectOption = (qId: string, option: string) => {
    if (result) return; // Locked after submit
    setSelectedAnswers({ ...selectedAnswers, [qId]: option });
  };

  const handleSubmitQuiz = async () => {
    if (!quiz) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/quiz/${quiz.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: selectedAnswers }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({
          scorePercentage: data.scorePercentage,
          correctAnswersCount: data.correctAnswersCount,
          totalQuestions: data.totalQuestions,
          masteryUpdate: data.masteryUpdate,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !quiz) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      {/* Quiz Header */}
      <div className="text-center space-y-2">
        <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-300 border border-purple-500/30 inline-flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5" /> 2-Minute AI Micro-Quiz
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{quiz.title}</h1>
        <p className="text-xs text-gray-400">Verify learning evidence immediately after studying.</p>
      </div>

      {/* Quiz Questions List */}
      <div className="space-y-6">
        {quiz.questions.map((q, idx) => (
          <div key={q.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-4">
            <h3 className="font-semibold text-white text-base">
              {idx + 1}. {q.question}
            </h3>

            <div className="space-y-2">
              {q.options.map((option, optIdx) => {
                const isSelected = selectedAnswers[q.id] === option;
                const isCorrect = result && option === q.correctAnswer;
                const isWrongSelection = result && isSelected && option !== q.correctAnswer;

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(q.id, option)}
                    disabled={Boolean(result)}
                    className={`w-full text-left rounded-xl p-3.5 text-xs sm:text-sm font-medium transition-all flex items-center justify-between ${
                      isCorrect
                        ? 'border-2 border-emerald-500 bg-emerald-950/40 text-emerald-200'
                        : isWrongSelection
                        ? 'border-2 border-red-500 bg-red-950/40 text-red-200'
                        : isSelected
                        ? 'border border-purple-500 bg-purple-500/20 text-white'
                        : 'border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <span>{option}</span>
                    {isCorrect && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                    {isWrongSelection && <XCircle className="h-5 w-5 text-red-400" />}
                  </button>
                );
              })}
            </div>

            {/* Explanation after submit */}
            {result && (
              <div className="mt-3 rounded-xl border border-white/5 bg-slate-950 p-3 text-xs text-gray-300">
                <span className="font-semibold text-blue-400">Explanation: </span>
                {q.explanation}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Submit Button or Score Summary Result Card */}
      {!result ? (
        <div className="flex justify-end">
          <button
            onClick={handleSubmitQuiz}
            disabled={submitting || Object.keys(selectedAnswers).length === 0}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-600/30 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 transition-all text-sm"
          >
            {submitting ? 'Scoring Answers...' : 'Submit Answers'}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-900 via-purple-950/30 to-slate-900 p-6 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-300">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Quiz Completed!</h3>
                <p className="text-xs text-gray-300">
                  Score: {result.scorePercentage}% ({result.correctAnswersCount}/{result.totalQuestions} correct)
                </p>
              </div>
            </div>

            {result.masteryUpdate && (
              <div className="text-right">
                <span className="text-xs text-gray-400 block">Estimated Mastery Update</span>
                <div className="flex items-center gap-1 font-bold text-emerald-400 text-lg">
                  <TrendingUp className="h-5 w-5" />
                  <span>{result.masteryUpdate.previousMastery}% → {result.masteryUpdate.newMastery}%</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"
            >
              <span>Return to Today</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MicroQuizPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
        </div>
      }
    >
      <QuizContent />
    </Suspense>
  );
}
