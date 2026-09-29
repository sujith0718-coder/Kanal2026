import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/lib/db/mock-db';
import { updateTopicMastery } from '@/lib/planner/mastery';
import { QuizAttempt } from '@/types';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quizId } = await params;
    const body = await req.json();
    const store = getMockStore();

    const quiz = store.quizzes.find((q) => q.id === quizId);
    if (!quiz) {
      return NextResponse.json({ success: false, error: 'Quiz not found' }, { status: 404 });
    }

    const userAnswers: Record<string, string> = body.answers || {};

    // Calculate score deterministically on backend
    let correctCount = 0;
    quiz.questions.forEach((q) => {
      const userAnswer = userAnswers[q.id];
      if (userAnswer && userAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
        correctCount++;
      }
    });

    const totalQuestions = quiz.questions.length;
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);

    const attempt: QuizAttempt = {
      id: `att-${Date.now()}`,
      quizId: quiz.id,
      userId: store.user.id,
      score: scorePercentage,
      correctAnswersCount: correctCount,
      totalQuestions,
      userAnswers,
      answeredAt: new Date().toISOString(),
    };

    store.quizAttempts.push(attempt);

    // Update topic estimated mastery
    let masteryUpdateResult = null;
    const topic = store.topics.find((t) => t.id === quiz.topicId);
    if (topic) {
      masteryUpdateResult = updateTopicMastery(topic, {
        score: scorePercentage,
        totalQuestions,
        correctAnswersCount: correctCount,
      });

      topic.estimatedMastery = masteryUpdateResult.newMastery;
      topic.masteryStatus = masteryUpdateResult.newStatus;

      // Sync state in masteryStates array
      const ms = store.masteryStates.find((m) => m.topicId === topic.id);
      if (ms) {
        ms.score = masteryUpdateResult.newMastery;
        ms.status = masteryUpdateResult.newStatus;
        ms.lastUpdated = new Date().toISOString();
      } else {
        store.masteryStates.push({
          id: `ms-${topic.id}`,
          userId: store.user.id,
          topicId: topic.id,
          score: masteryUpdateResult.newMastery,
          status: masteryUpdateResult.newStatus,
          lastUpdated: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      quizAttempt: attempt,
      scorePercentage,
      correctAnswersCount: correctCount,
      totalQuestions,
      topic,
      masteryUpdate: masteryUpdateResult,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
