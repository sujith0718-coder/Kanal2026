import { Topic, Exam, AvailabilityWindow, UserProfile, FeasibilityResult, FeasibilityState } from '@/types';
import { calculateTopicPriority } from './priority';
import { getDailyAvailableMinutes } from './capacity';
import { addDays, parseISO, isAfter } from 'date-fns';

export interface FeasibilityInput {
  topics: Topic[];
  exams: Exam[];
  availability: AvailabilityWindow[];
  userProfile?: UserProfile;
  planningHorizonDays?: number; // default 7 or 14 days
  currentDate?: Date;
}

/**
 * Calculates feasibility of the workload vs capacity for an academic horizon
 */
export function calculatePlanFeasibility(input: FeasibilityInput): FeasibilityResult {
  const currentDate = input.currentDate || new Date();
  const horizonDays = input.planningHorizonDays || 14;

  // 1. Calculate Total Available Minutes over horizon
  let totalAvailableMinutes = 0;
  const dateRange: Date[] = [];
  for (let i = 0; i < horizonDays; i++) {
    const dayDate = addDays(currentDate, i);
    dateRange.push(dayDate);
    totalAvailableMinutes += getDailyAvailableMinutes(dayDate, input.availability, input.userProfile);
  }

  // 2. Calculate Total Required Workload Minutes
  let totalRequiredMinutes = 0;
  const topicPriorityList: Array<{ topic: Topic; priorityScore: number }> = [];

  for (const topic of input.topics) {
    const exam = input.exams.find((e) => e.subjectId === topic.subjectId);
    
    // Only count topic workload if the exam is within our planning horizon
    if (exam && exam.examDate) {
      const examDate = parseISO(exam.examDate);
      if (isAfter(examDate, addDays(currentDate, horizonDays))) {
        continue; // Exam is beyond planning horizon
      }
    }

    const remainingMinutes = Math.max(0, topic.estimatedMinutesRequired - topic.completedMinutes);
    totalRequiredMinutes += remainingMinutes;

    const p = calculateTopicPriority(topic, exam, currentDate);
    topicPriorityList.push({ topic, priorityScore: p.finalPriority });
  }

  // Sort topics by priority descending
  topicPriorityList.sort((a, b) => b.priorityScore - a.priorityScore);

  const deficitMinutes = Math.max(0, totalRequiredMinutes - totalAvailableMinutes);

  let state: FeasibilityState = 'GREEN';
  let explanation = '';
  const protectedTopicIds: string[] = [];
  const deferredTopicIds: string[] = [];

  if (totalAvailableMinutes >= totalRequiredMinutes * 1.15) {
    state = 'GREEN';
    explanation = `Your schedule is comfortable. Available capacity (${Math.round(totalAvailableMinutes / 60)}h) comfortably covers required workload (${Math.round(totalRequiredMinutes / 60)}h).`;
  } else if (totalAvailableMinutes >= totalRequiredMinutes) {
    state = 'YELLOW';
    explanation = `Your schedule is tight but feasible. Required workload (${Math.round(totalRequiredMinutes / 60)}h) fits into available capacity (${Math.round(totalAvailableMinutes / 60)}h) with little buffer.`;
  } else {
    state = 'RED';
    explanation = `Your required study workload is ${Math.round(totalRequiredMinutes / 60)}h, but your available capacity is ${Math.round(totalAvailableMinutes / 60)}h. Deficit: ${Math.round(deficitMinutes / 60)}h (${deficitMinutes}m). High-priority exam prep is protected while low-priority topics are deferred.`;
  }

  // Partition topics into protected vs deferred when RED
  let accumulatedMinutes = 0;
  for (const item of topicPriorityList) {
    const rem = Math.max(0, item.topic.estimatedMinutesRequired - item.topic.completedMinutes);
    if (accumulatedMinutes + rem <= totalAvailableMinutes || state !== 'RED') {
      protectedTopicIds.push(item.topic.id);
      accumulatedMinutes += rem;
    } else {
      deferredTopicIds.push(item.topic.id);
    }
  }

  return {
    feasible: state !== 'RED',
    state,
    requiredMinutes: totalRequiredMinutes,
    availableMinutes: totalAvailableMinutes,
    deficitMinutes,
    explanation,
    protectedTopicIds,
    deferredTopicIds,
  };
}
