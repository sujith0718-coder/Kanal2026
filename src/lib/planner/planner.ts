import {
  StudySession,
  Topic,
  Exam,
  AvailabilityWindow,
  EnergyPreference,
  UserProfile,
  Subject,
} from '@/types';
import { calculateTopicPriority } from './priority';
import { getDailyAvailableMinutes } from './capacity';
import { validateHardConstraints } from './conflicts';
import { calculatePlanFeasibility } from './feasibility';
import { addDays, format, parseISO, isAfter } from 'date-fns';

export interface GeneratePlanOptions {
  userId: string;
  planVersionId: string;
  topics: Topic[];
  subjects: Subject[];
  exams: Exam[];
  availability: AvailabilityWindow[];
  energyPreferences: EnergyPreference[];
  userProfile?: UserProfile;
  currentDate?: Date;
  planningHorizonDays?: number; // Default 7 days
  existingSessions?: StudySession[];
}

export function generateCandidatePlan(options: GeneratePlanOptions): {
  sessions: StudySession[];
  feasibility: ReturnType<typeof calculatePlanFeasibility>;
  violations: ReturnType<typeof validateHardConstraints>;
} {
  const currentDate = options.currentDate || new Date();
  const horizonDays = options.planningHorizonDays || 7;

  // 1. Calculate feasibility & topic priorities
  const feasibility = calculatePlanFeasibility({
    topics: options.topics,
    exams: options.exams,
    availability: options.availability,
    userProfile: options.userProfile,
    planningHorizonDays: horizonDays,
    currentDate,
  });

  // Filter topics (exclude deferred if infeasible)
  const candidateTopics = options.topics.filter(
    (t) => !feasibility.deferredTopicIds.includes(t.id)
  );

  // Calculate priority for each topic
  const topicPriorities = candidateTopics.map((topic) => {
    const exam = options.exams.find((e) => e.subjectId === topic.subjectId);
    const p = calculateTopicPriority(topic, exam, currentDate);
    return {
      topic,
      exam,
      priority: p,
      remainingMinutes: Math.max(0, topic.estimatedMinutesRequired - topic.completedMinutes),
    };
  });

  // Sort by priority descending
  topicPriorities.sort((a, b) => b.priority.finalPriority - a.priority.finalPriority);

  const newSessions: StudySession[] = [];
  const dailyCap = options.userProfile?.dailyCapacityMinutes || 240;

  // Helper mapping for subject details
  const subjectMap = new Map(options.subjects.map((s) => [s.id, s]));

  // Track scheduled minutes per day
  const dayScheduledMinutes: Record<string, number> = {};

  // For each day in planning horizon
  for (let dayOffset = 0; dayOffset < horizonDays; dayOffset++) {
    const dayDate = addDays(currentDate, dayOffset);
    const dateStr = format(dayDate, 'yyyy-MM-dd');
    const dayOfWeek = dayDate.getDay();

    const maxDayCap = getDailyAvailableMinutes(dayDate, options.availability, options.userProfile);
    dayScheduledMinutes[dateStr] = 0;

    // Retrieve availability windows for this day
    const dayWindows = options.availability.filter((w) => w.dayOfWeek === dayOfWeek);
    let currentWindowStart = dayWindows.length > 0 ? dayWindows[0].startTime : '17:00';

    for (const item of topicPriorities) {
      if (item.remainingMinutes <= 0) continue;

      // Check exam date hard constraint: Do not schedule study after exam date
      if (item.exam && item.exam.examDate) {
        const examDate = parseISO(item.exam.examDate);
        if (isAfter(dayDate, examDate)) {
          continue; // Exam has passed or is today
        }
      }

      // Check daily capacity remaining
      const availableToday = maxDayCap - dayScheduledMinutes[dateStr];
      if (availableToday < 30) break; // Day capacity reached

      const sessionDuration = Math.min(45, availableToday, item.remainingMinutes);
      if (sessionDuration < 30 && item.remainingMinutes >= 30) continue; // Minimum 30m chunk

      // Compute start and end times
      const startTime = currentWindowStart;
      const endTime = addMinutesToTimeStr(startTime, sessionDuration);

      const subject = subjectMap.get(item.topic.subjectId);

      const session: StudySession = {
        id: `ses-${item.topic.id}-${dateStr}-${startTime.replace(':', '')}`,
        userId: options.userId,
        topicId: item.topic.id,
        topicName: item.topic.name,
        subjectId: item.topic.subjectId,
        subjectName: subject ? subject.name : 'Academic Subject',
        planVersionId: options.planVersionId,
        date: dateStr,
        startTime,
        endTime,
        durationMinutes: sessionDuration,
        energyRequirement: item.topic.difficulty,
        status: 'PLANNED',
        createdAt: new Date().toISOString(),
      };

      newSessions.push(session);

      dayScheduledMinutes[dateStr] += sessionDuration;
      item.remainingMinutes -= sessionDuration;

      // Advance window start time for next session with a 15 min break
      currentWindowStart = addMinutesToTimeStr(endTime, 15);
    }
  }

  // Validate hard constraints
  const violations = validateHardConstraints(
    newSessions,
    options.exams,
    options.availability,
    dailyCap
  );

  return {
    sessions: newSessions,
    feasibility,
    violations,
  };
}

function addMinutesToTimeStr(timeStr: string, minsToAdd: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  const totalMins = (h * 60 + m + minsToAdd) % (24 * 60);
  const newH = Math.floor(totalMins / 60);
  const newM = totalMins % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}
