import { Topic, Exam, PriorityFactors } from '@/types';
import { differenceInDays, parseISO, startOfDay } from 'date-fns';

export interface PriorityWeights {
  examUrgencyWeight: number; // 0.40
  remainingSyllabusWeight: number; // 0.30
  masteryGapWeight: number; // 0.20
  difficultyWeight: number; // 0.10
}

export const DEFAULT_PRIORITY_WEIGHTS: PriorityWeights = {
  examUrgencyWeight: 0.40,
  remainingSyllabusWeight: 0.30,
  masteryGapWeight: 0.20,
  difficultyWeight: 0.10,
};

/**
 * Calculates normalized Exam Urgency (0 - 100) based on days until exam
 * - Exam in 0-1 days: 100
 * - Exam in 2-3 days: 85
 * - Exam in 4-7 days: 65
 * - Exam in 8-14 days: 40
 * - Exam in 15+ days: 15
 * - No exam scheduled: 10
 */
export function calculateExamUrgency(exam?: Exam, currentDate: Date = new Date()): number {
  if (!exam || !exam.examDate) return 10;
  
  const examDate = parseISO(exam.examDate);
  const daysRemaining = differenceInDays(startOfDay(examDate), startOfDay(currentDate));

  if (daysRemaining <= 1) return 100;
  if (daysRemaining <= 3) return 85;
  if (daysRemaining <= 7) return 65;
  if (daysRemaining <= 14) return 40;
  if (daysRemaining <= 30) return 25;
  return 15;
}

/**
 * Calculates Remaining Syllabus Factor (0 - 100)
 */
export function calculateRemainingSyllabusFactor(topic: Topic): number {
  const req = topic.estimatedMinutesRequired || 90;
  const comp = topic.completedMinutes || 0;
  const remainingRatio = Math.max(0, req - comp) / req;
  return Math.min(100, Math.round(remainingRatio * 100));
}

/**
 * Calculates Mastery Gap Factor (0 - 100)
 * Baseline policy if status is UNKNOWN: default gap is 75 (assume baseline mastery 25)
 */
export function calculateMasteryGapFactor(topic: Topic): number {
  if (topic.masteryStatus === 'UNKNOWN') {
    return 75; // Baseline policy for unassessed topics
  }
  return Math.max(0, 100 - (topic.estimatedMastery || 0));
}

/**
 * Calculates Difficulty Factor (0 - 100)
 */
export function calculateDifficultyFactor(topic: Topic): number {
  switch (topic.difficulty) {
    case 'HIGH':
      return 100;
    case 'MEDIUM':
      return 60;
    case 'LOW':
      return 30;
    default:
      return 50;
  }
}

/**
 * Main Priority Score Engine
 * Priority = 40% Exam Urgency + 30% Remaining Syllabus + 20% Mastery Gap + 10% Difficulty
 */
export function calculateTopicPriority(
  topic: Topic,
  exam?: Exam,
  currentDate: Date = new Date(),
  weights: PriorityWeights = DEFAULT_PRIORITY_WEIGHTS
): PriorityFactors {
  const examUrgency = calculateExamUrgency(exam, currentDate);
  const remainingSyllabus = calculateRemainingSyllabusFactor(topic);
  const masteryGap = calculateMasteryGapFactor(topic);
  const difficulty = calculateDifficultyFactor(topic);

  const finalPriority = Math.round(
    examUrgency * weights.examUrgencyWeight +
    remainingSyllabus * weights.remainingSyllabusWeight +
    masteryGap * weights.masteryGapWeight +
    difficulty * weights.difficultyWeight
  );

  return {
    examUrgency,
    remainingSyllabus,
    masteryGap,
    difficulty,
    finalPriority: Math.min(100, Math.max(0, finalPriority)),
  };
}
