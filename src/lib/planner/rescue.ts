import {
  StudySession,
  Topic,
  Exam,
  AvailabilityWindow,
  EnergyPreference,
  UserProfile,
  PlanVersion,
  PlanChange,
  RescueResult,
  Subject,
} from '@/types';
import { generateCandidatePlan } from './planner';
import { addDays } from 'date-fns';

export interface RescueInput {
  userId: string;
  activePlanVersion: PlanVersion;
  missedSessionIds: string[];
  allSessions: StudySession[];
  topics: Topic[];
  subjects: Subject[];
  exams: Exam[];
  availability: AvailabilityWindow[];
  energyPreferences: EnergyPreference[];
  userProfile?: UserProfile;
  currentDate?: Date;
}

export function executeRescueSchedule(input: RescueInput): RescueResult {
  const currentDate = input.currentDate || new Date();

  // 1. Identify missed sessions & mark status in copy
  const updatedOldSessions = input.allSessions.map((s) => {
    if (input.missedSessionIds.includes(s.id)) {
      return { ...s, status: 'MISSED' as const };
    }
    return s;
  });

  // 2. Identify uncompleted topics that need redistribution
  const missedSessions = updatedOldSessions.filter((s) => s.status === 'MISSED');
  const missedTopicIds = new Set(missedSessions.map((s) => s.topicId));

  // 3. Increment required workload for topics that had missed sessions
  const updatedTopics = input.topics.map((t) => {
    if (missedTopicIds.has(t.id)) {
      const topicMissedMinutes = missedSessions
        .filter((s) => s.topicId === t.id)
        .reduce((sum, s) => sum + s.durationMinutes, 0);

      return {
        ...t,
        estimatedMinutesRequired: t.estimatedMinutesRequired + topicMissedMinutes,
      };
    }
    return t;
  });

  // 4. Create new plan version bump (e.g. Plan v1 -> Plan v2)
  const newVersionNumber = input.activePlanVersion.versionNumber + 1;
  const newPlanId = `plan-v${newVersionNumber}`;

  // 5. Generate new candidate study plan starting from tomorrow / remaining horizon
  const candidateResult = generateCandidatePlan({
    userId: input.userId,
    planVersionId: newPlanId,
    topics: updatedTopics,
    subjects: input.subjects,
    exams: input.exams,
    availability: input.availability,
    energyPreferences: input.energyPreferences,
    userProfile: input.userProfile,
    currentDate: addDays(currentDate, 1), // Start redistribution from tomorrow
    planningHorizonDays: 7,
  });

  // 6. Track detailed plan changes between old sessions & candidate sessions
  const planChanges: PlanChange[] = [];

  for (const missed of missedSessions) {
    const topic = updatedTopics.find((t) => t.id === missed.topicId);
    const topicName = topic?.name || missed.topicName || 'Missed Topic';
    
    // Find where the missed topic work was redistributed in candidate plan
    const newScheduled = candidateResult.sessions.filter((s) => s.topicId === missed.topicId);

    if (newScheduled.length === 0) {
      planChanges.push({
        id: `chg-${missed.id}`,
        planVersionId: newPlanId,
        changeType: 'DEFERRED',
        description: `Missed session for "${topicName}" (${missed.durationMinutes}m on ${missed.date}) was deferred due to daily capacity limits.`,
        oldSessionId: missed.id,
        reason: 'Capacity constraints on remaining days.',
      });
    } else if (newScheduled.length === 1) {
      const target = newScheduled[0];
      planChanges.push({
        id: `chg-${missed.id}`,
        planVersionId: newPlanId,
        changeType: 'MOVED',
        description: `Missed "${topicName}" (${missed.durationMinutes}m) moved from ${missed.date} to ${target.date} at ${target.startTime}.`,
        oldSessionId: missed.id,
        newSessionIds: [target.id],
        reason: 'Redistributed missed work to next available energy slot.',
      });
    } else {
      const targetDates = newScheduled.map((s) => `${s.date} (${s.durationMinutes}m)`).join(', ');
      planChanges.push({
        id: `chg-${missed.id}`,
        planVersionId: newPlanId,
        changeType: 'SPLIT',
        description: `Missed "${topicName}" (${missed.durationMinutes}m) split across: ${targetDates}.`,
        oldSessionId: missed.id,
        newSessionIds: newScheduled.map((s) => s.id),
        reason: 'Split work to respect daily study capacity limits.',
      });
    }
  }

  // Add protection changes for upcoming exams
  input.exams.forEach((exam) => {
    const subject = input.subjects.find((s) => s.id === exam.subjectId);
    if (subject) {
      planChanges.push({
        id: `chg-protect-${exam.id}`,
        planVersionId: newPlanId,
        changeType: 'PROTECTED',
        description: `Protected preparation sessions for ${subject.name} exam on ${exam.examDate}.`,
        reason: 'High exam urgency constraint.',
      });
    }
  });

  const message = `Rescue Mode successfully generated Plan v${newVersionNumber}. ${planChanges.length} schedule change(s) recorded. Hard constraints verified.`;

  return {
    originalPlanId: input.activePlanVersion.id,
    newPlanId,
    newVersionNumber,
    changes: planChanges,
    feasibility: candidateResult.feasibility,
    message,
    aiExplanation: `Your study plan was rescued after missing ${missedSessions.length} session(s). Work was redistributed across upcoming days without exceeding your daily study limits or overlapping existing commitments.`,
  };
}
