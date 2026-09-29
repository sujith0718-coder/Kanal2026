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

    // Retrieve availability windows for this day, sorted by start time.
    const dayWindows = options.availability
      .filter((w) => w.dayOfWeek === dayOfWeek)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    let currentWindowStart = dayWindows.length > 0 ? dayWindows[0].startTime : '17:00';
    let currentWindowEnd = dayWindows.length > 0 ? dayWindows[0].endTime : '20:00';
    let windowIndex = 0;

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

      // Find the next available slot in the day's windows, respecting each window's end time.
      let chosenStart = currentWindowStart;
      let chosenEnd = currentWindowEnd;
      let sessionDuration = 0;

      while (windowIndex < dayWindows.length) {
        const windowStartMinutes = timeToMinutes(currentWindowStart);
        const windowEndMinutes = timeToMinutes(currentWindowEnd);
        const remainingInWindow = Math.max(0, windowEndMinutes - windowStartMinutes);

        if (remainingInWindow >= 30) {
          sessionDuration = Math.min(45, availableToday, item.remainingMinutes, remainingInWindow);
          if (sessionDuration >= 30) {
            chosenStart = currentWindowStart;
            chosenEnd = addMinutesToTimeStr(chosenStart, sessionDuration);
            break;
          }
        }

        windowIndex += 1;
        if (windowIndex >= dayWindows.length) {
          chosenStart = '';
          chosenEnd = '';
          break;
        }

        currentWindowStart = dayWindows[windowIndex].startTime;
        currentWindowEnd = dayWindows[windowIndex].endTime;
      }

      if (!chosenStart || !chosenEnd || sessionDuration < 30) {
        continue;
      }

      const subject = subjectMap.get(item.topic.subjectId);

      const session: StudySession = {
        id: `ses-${item.topic.id}-${dateStr}-${chosenStart.replace(':', '')}`,
        userId: options.userId,
        topicId: item.topic.id,
        topicName: item.topic.name,
        subjectId: item.topic.subjectId,
        subjectName: subject ? subject.name : 'Academic Subject',
        planVersionId: options.planVersionId,
        date: dateStr,
        startTime: chosenStart,
        endTime: chosenEnd,
        durationMinutes: sessionDuration,
        energyRequirement: item.topic.difficulty,
        status: 'PLANNED',
        createdAt: new Date().toISOString(),
      };

      newSessions.push(session);

      dayScheduledMinutes[dateStr] += sessionDuration;
      item.remainingMinutes -= sessionDuration;

      // Advance window start time for next session with a 15 minute break.
      currentWindowStart = addMinutesToTimeStr(chosenEnd, 15);
      if (dayWindows.length > 0) {
        // If the cursor moved beyond the active window, jump to the next available window.
        if (timeToMinutes(currentWindowStart) >= timeToMinutes(currentWindowEnd)) {
          windowIndex += 1;
          if (windowIndex < dayWindows.length) {
            currentWindowStart = dayWindows[windowIndex].startTime;
            currentWindowEnd = dayWindows[windowIndex].endTime;
          }
        }
      } else {
        currentWindowEnd = '20:00';
      }
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

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}
