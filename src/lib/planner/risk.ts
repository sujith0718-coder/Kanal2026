import { Subject, Topic, Exam, ExamRiskResult, RiskLevel } from '@/types';
import {
  calculateExamUrgency,
  calculateRemainingSyllabusFactor,
  calculateMasteryGapFactor,
  calculateDifficultyFactor,
} from './priority';
import { differenceInDays, parseISO } from 'date-fns';

export function calculateExamRisk(
  subject: Subject,
  topics: Topic[],
  exam?: Exam,
  currentDate: Date = new Date()
): ExamRiskResult {
  const subjectTopics = topics.filter((t) => t.subjectId === subject.id);

  if (subjectTopics.length === 0) {
    return {
      subjectId: subject.id,
      subjectName: subject.name,
      score: 10,
      level: 'LOW',
      factors: { examUrgency: 10, remainingSyllabus: 0, masteryGap: 0, difficulty: 30 },
      reason: `${subject.name} has no remaining syllabus topics scheduled.`,
    };
  }

  // 1. Calculate Exam Urgency
  const examUrgency = calculateExamUrgency(exam, currentDate);

  // 2. Average Remaining Syllabus across topics
  const remainingSyllabus = Math.round(
    subjectTopics.reduce((sum, t) => sum + calculateRemainingSyllabusFactor(t), 0) /
      subjectTopics.length
  );

  // 3. Average Mastery Gap across topics
  const masteryGap = Math.round(
    subjectTopics.reduce((sum, t) => sum + calculateMasteryGapFactor(t), 0) / subjectTopics.length
  );

  // 4. Max Difficulty across topics
  const difficulty = Math.max(...subjectTopics.map((t) => calculateDifficultyFactor(t)));

  // Weighted Risk Score Formula:
  // Risk = 45% Exam Urgency + 25% Mastery Gap + 20% Remaining Syllabus + 10% Difficulty
  const rawScore = Math.round(
    examUrgency * 0.45 + masteryGap * 0.25 + remainingSyllabus * 0.20 + difficulty * 0.10
  );
  const score = Math.min(100, Math.max(0, rawScore));

  let level: RiskLevel = 'LOW';
  if (score >= 66) level = 'HIGH';
  else if (score >= 36) level = 'MEDIUM';

  // Construct transparent reason explanation
  const daysUntilExam = exam ? differenceInDays(parseISO(exam.examDate), currentDate) : null;
  const reasonBullets: string[] = [];

  if (daysUntilExam !== null) {
    if (daysUntilExam <= 3) {
      reasonBullets.push(`exam is only ${daysUntilExam} day(s) away (${exam?.examDate})`);
    } else {
      reasonBullets.push(`exam is in ${daysUntilExam} days`);
    }
  }

  const unmasteredCount = subjectTopics.filter((t) => t.estimatedMastery < 60).length;
  if (unmasteredCount > 0) {
    reasonBullets.push(`${unmasteredCount} of ${subjectTopics.length} topic(s) have low estimated mastery`);
  }

  const avgMastery = Math.round(
    subjectTopics.reduce((sum, t) => sum + t.estimatedMastery, 0) / subjectTopics.length
  );
  reasonBullets.push(`average mastery estimate is ${avgMastery}%`);

  if (difficulty >= 80) {
    reasonBullets.push(`contains high-difficulty topics`);
  }

  const reason = `${subject.name} is ${level} RISK because: ${reasonBullets.join('; ')}.`;

  return {
    subjectId: subject.id,
    subjectName: subject.name,
    score,
    level,
    factors: {
      examUrgency,
      remainingSyllabus,
      masteryGap,
      difficulty,
    },
    reason,
  };
}
