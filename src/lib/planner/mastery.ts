import { Topic, MasteryStatus } from '@/types';

export interface QuizResultInput {
  score: number; // 0 - 100
  totalQuestions: number;
  correctAnswersCount: number;
}

export function updateTopicMastery(
  topic: Topic,
  quizResult: QuizResultInput
): {
  newMastery: number;
  newStatus: MasteryStatus;
  delta: number;
  previousMastery: number;
} {
  const prevMastery = topic.estimatedMastery || 0;
  const isFirstAssessment = topic.masteryStatus === 'UNKNOWN';

  let newMastery = 0;
  if (isFirstAssessment) {
    // First assessment directly sets the initial mastery benchmark
    newMastery = Math.round(quizResult.score);
  } else {
    // Weighted moving average: 40% historical mastery + 60% latest quiz performance
    newMastery = Math.round(prevMastery * 0.4 + quizResult.score * 0.6);
  }

  // Bound to 0 - 100
  newMastery = Math.min(100, Math.max(0, newMastery));

  let newStatus: MasteryStatus = 'LOW';
  if (newMastery >= 75) newStatus = 'HIGH';
  else if (newMastery >= 45) newStatus = 'MEDIUM';

  const delta = newMastery - prevMastery;

  return {
    newMastery,
    newStatus,
    delta,
    previousMastery: prevMastery,
  };
}
