import { StudySession, Exam, AvailabilityWindow, AcademicEvent } from '@/types';
import { parseISO, isAfter } from 'date-fns';

export interface ConstraintViolation {
  sessionId?: string;
  type:
    | 'OVERLAP'
    | 'CAPACITY_EXCEEDED'
    | 'STUDY_AFTER_EXAM'
    | 'UNAVAILABLE_TIME'
    | 'INVALID_DURATION';
  message: string;
}

/**
 * Validates all hard constraints for a set of study sessions
 */
export function validateHardConstraints(
  sessions: StudySession[],
  exams: Exam[],
  availability: AvailabilityWindow[],
  dailyCapacityMinutes: number = 240,
  academicEvents: AcademicEvent[] = []
): ConstraintViolation[] {
  const violations: ConstraintViolation[] = [];

  // Group sessions by date
  const sessionsByDate: Record<string, StudySession[]> = {};
  for (const session of sessions) {
    if (!sessionsByDate[session.date]) {
      sessionsByDate[session.date] = [];
    }
    sessionsByDate[session.date].push(session);
  }

  // 1. Check daily capacity limits & overlaps per date
  for (const [dateStr, daySessions] of Object.entries(sessionsByDate)) {
    const dateObj = parseISO(dateStr);
    const dayWindows = availability.filter((w) => w.dayOfWeek === dateObj.getDay());
    const totalDayMinutes = daySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const availableWindowMinutes = dayWindows.reduce((sum, w) => sum + w.durationMinutes, 0);
    const effectiveDailyCap = Math.min(dailyCapacityMinutes, availableWindowMinutes || dailyCapacityMinutes);

    if (totalDayMinutes > effectiveDailyCap) {
      violations.push({
        type: 'CAPACITY_EXCEEDED',
        message: `Date ${dateStr} has total scheduled study time of ${totalDayMinutes}m exceeding daily limit of ${effectiveDailyCap}m`,
      });
    }

    // Check overlaps within the same day
    for (let i = 0; i < daySessions.length; i++) {
      for (let j = i + 1; j < daySessions.length; j++) {
        const s1 = daySessions[i];
        const s2 = daySessions[j];

        if (checkTimeOverlap(s1.startTime, s1.endTime, s2.startTime, s2.endTime)) {
          violations.push({
            sessionId: s1.id,
            type: 'OVERLAP',
            message: `Session ${s1.topicName || s1.id} (${s1.startTime}-${s1.endTime}) overlaps with ${s2.topicName || s2.id} (${s2.startTime}-${s2.endTime}) on ${dateStr}`,
          });
        }
      }
    }

    // Check that each session falls within at least one allowed availability window.
    if (dayWindows.length > 0) {
      for (const session of daySessions) {
        const sessionStart = toMinutes(session.startTime);
        const sessionEnd = toMinutes(session.endTime);
        const coveredMinutes = mergeAndCoverWindows(dayWindows, sessionStart, sessionEnd);

        if (coveredMinutes < sessionEnd - sessionStart) {
          violations.push({
            sessionId: session.id,
            type: 'UNAVAILABLE_TIME',
            message: `Session ${session.topicName || session.id} (${session.startTime}-${session.endTime}) falls outside the available windows on ${dateStr}`,
          });
        }
      }
    }
  }

  // 2. Check study after exam date constraint
  const examDateMap: Record<string, string> = {}; // subjectId -> examDate
  exams.forEach((exam) => {
    examDateMap[exam.subjectId] = exam.examDate;
  });

  for (const session of sessions) {
    if (session.subjectId && examDateMap[session.subjectId]) {
      const examDateStr = examDateMap[session.subjectId];
      const sessionDate = parseISO(session.date);
      const examDate = parseISO(examDateStr);

      if (isAfter(sessionDate, examDate)) {
        violations.push({
          sessionId: session.id,
          type: 'STUDY_AFTER_EXAM',
          message: `Session for topic ${session.topicName || session.topicId} on ${session.date} is scheduled AFTER the exam on ${examDateStr}`,
        });
      }
    }

    // Check invalid duration
    if (session.durationMinutes < 15 || session.durationMinutes > 180) {
      violations.push({
        sessionId: session.id,
        type: 'INVALID_DURATION',
        message: `Session ${session.id} duration of ${session.durationMinutes}m is outside valid limits (15-180m)`,
      });
    }
  }

  return violations;
}

/**
 * Helper to test if two time ranges (HH:mm) overlap
 */
export function checkTimeOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const [h1s, m1s] = start1.split(':').map(Number);
  const [h1e, m1e] = end1.split(':').map(Number);
  const [h2s, m2s] = start2.split(':').map(Number);
  const [h2e, m2e] = end2.split(':').map(Number);

  const t1s = h1s * 60 + m1s;
  const t1e = h1e * 60 + m1e;
  const t2s = h2s * 60 + m2s;
  const t2e = h2e * 60 + m2e;

  return Math.max(t1s, t2s) < Math.min(t1e, t2e);
}

function mergeAndCoverWindows(windows: AvailabilityWindow[], sessionStart: number, sessionEnd: number): number {
  const ranges = windows
    .map((window) => [toMinutes(window.startTime), toMinutes(window.endTime)] as const)
    .sort((a, b) => a[0] - b[0]);

  const merged: Array<[number, number]> = [];
  for (const [start, end] of ranges) {
    if (merged.length === 0) {
      merged.push([start, end]);
      continue;
    }

    const last = merged[merged.length - 1];
    if (start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }

  let covered = 0;
  for (const [start, end] of merged) {
    const overlapStart = Math.max(start, sessionStart);
    const overlapEnd = Math.min(end, sessionEnd);
    if (overlapEnd > overlapStart) {
      covered += overlapEnd - overlapStart;
    }
  }

  return covered;
}

function toMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}
