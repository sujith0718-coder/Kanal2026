import { describe, it, expect } from 'vitest';
import { calculateTopicPriority } from '../src/lib/planner/priority';
import { getDailyAvailableMinutes } from '../src/lib/planner/capacity';
import { validateHardConstraints } from '../src/lib/planner/conflicts';
import { calculatePlanFeasibility } from '../src/lib/planner/feasibility';
import { calculateExamRisk } from '../src/lib/planner/risk';
import { updateTopicMastery } from '../src/lib/planner/mastery';
import { generateCandidatePlan } from '../src/lib/planner/planner';
import { Topic, Exam, AvailabilityWindow, StudySession, Subject } from '../src/types';
import { addDays, format } from 'date-fns';

describe('StudyAI Planning Engine Unit Tests', () => {
  it('1. Priority Engine calculates correct 40/30/20/10 weights', () => {
    const topic: Topic = {
      id: 't1',
      subjectId: 's1',
      name: 'Test Topic',
      difficulty: 'HIGH', // 100
      estimatedMastery: 50,
      masteryStatus: 'MEDIUM', // Gap = 50
      estimatedMinutesRequired: 100,
      completedMinutes: 0, // Remaining = 100% (100)
    };

    const exam: Exam = {
      id: 'e1',
      subjectId: 's1',
      examDate: format(addDays(new Date(), 2), 'yyyy-MM-dd'), // 2 days away -> Urgency 85
      confidence: 1.0,
      verificationStatus: 'VERIFIED',
    };

    const result = calculateTopicPriority(topic, exam);

    // Expected: 85 * 0.40 + 100 * 0.30 + 50 * 0.20 + 100 * 0.10
    // = 34 + 30 + 10 + 10 = 84
    expect(result.finalPriority).toBe(84);
  });

  it('2. Daily Capacity respects availability windows and daily caps', () => {
    const windows: AvailabilityWindow[] = [
      { id: 'w1', userId: 'u1', dayOfWeek: 1, startTime: '17:00', endTime: '20:00', durationMinutes: 180 },
    ];

    const mondayDate = new Date(2026, 8, 28); // Sept 28 2026 is Monday (dayOfWeek 1)
    const cap = getDailyAvailableMinutes(mondayDate, windows, {
      id: 'u1',
      name: 'Alex',
      email: 'a@a.com',
      dailyCapacityMinutes: 240,
      createdAt: '',
    });

    expect(cap).toBe(180); // Window duration limit
  });

  it('3. Conflict Detector flags overlaps and study after exam date', () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const pastExamDate = format(addDays(new Date(), -1), 'yyyy-MM-dd');

    const sessions: StudySession[] = [
      { id: 's1', userId: 'u1', topicId: 't1', subjectId: 'sub1', planVersionId: 'v1', date: todayStr, startTime: '17:00', endTime: '18:00', durationMinutes: 60, energyRequirement: 'HIGH', status: 'PLANNED', createdAt: '' },
      { id: 's2', userId: 'u1', topicId: 't2', subjectId: 'sub1', planVersionId: 'v1', date: todayStr, startTime: '17:30', endTime: '18:30', durationMinutes: 60, energyRequirement: 'MEDIUM', status: 'PLANNED', createdAt: '' },
    ];

    const exams: Exam[] = [
      { id: 'e1', subjectId: 'sub1', examDate: pastExamDate, confidence: 1, verificationStatus: 'VERIFIED' },
    ];

    const violations = validateHardConstraints(sessions, exams, [], 240);
    expect(violations.some((v) => v.type === 'OVERLAP')).toBe(true);
    expect(violations.some((v) => v.type === 'STUDY_AFTER_EXAM')).toBe(true);
  });

  it('4. Feasibility Engine accurately identifies RED state with deficit calculation', () => {
    const topics: Topic[] = [
      { id: 't1', subjectId: 's1', name: 'Topic 1', difficulty: 'HIGH', estimatedMastery: 10, masteryStatus: 'LOW', estimatedMinutesRequired: 600, completedMinutes: 0 },
    ];

    const windows: AvailabilityWindow[] = [
      { id: 'w1', userId: 'u1', dayOfWeek: 1, startTime: '17:00', endTime: '19:00', durationMinutes: 120 },
    ];

    const result = calculatePlanFeasibility({
      topics,
      exams: [],
      availability: windows,
      planningHorizonDays: 2,
    });

    expect(result.feasible).toBe(false);
    expect(result.state).toBe('RED');
    expect(result.deficitMinutes).toBeGreaterThan(0);
  });

  it('5. Exam Risk Radar produces transparent risk levels & scores', () => {
    const subject: Subject = { id: 's1', userId: 'u1', name: 'Data Structures', createdAt: '' };
    const topics: Topic[] = [
      { id: 't1', subjectId: 's1', name: 'Trees', difficulty: 'HIGH', estimatedMastery: 30, masteryStatus: 'LOW', estimatedMinutesRequired: 120, completedMinutes: 0 },
    ];
    const exam: Exam = { id: 'e1', subjectId: 's1', examDate: format(addDays(new Date(), 2), 'yyyy-MM-dd'), confidence: 1, verificationStatus: 'VERIFIED' };

    const risk = calculateExamRisk(subject, topics, exam);
    expect(risk.level).toBe('HIGH');
    expect(risk.score).toBeGreaterThanOrEqual(66);
    expect(risk.reason).toContain('HIGH RISK');
  });

  it('6. Mastery Engine updates estimated mastery deterministically', () => {
    const topic: Topic = { id: 't1', subjectId: 's1', name: 'Trees', difficulty: 'HIGH', estimatedMastery: 50, masteryStatus: 'MEDIUM', estimatedMinutesRequired: 90, completedMinutes: 0 };

    // Quiz score 100% -> 50 * 0.4 + 100 * 0.6 = 80
    const result = updateTopicMastery(topic, { score: 100, totalQuestions: 5, correctAnswersCount: 5 });

    expect(result.newMastery).toBe(80);
    expect(result.newStatus).toBe('HIGH');
    expect(result.delta).toBe(30);
  });

  it('7. Candidate planner respects multiple availability windows without scheduling outside study hours', () => {
    const targetDay = new Date(2026, 8, 28);
    const availability: AvailabilityWindow[] = [
      { id: 'w1', userId: 'u1', dayOfWeek: 1, startTime: '09:00', endTime: '11:00', durationMinutes: 120 },
      { id: 'w2', userId: 'u1', dayOfWeek: 1, startTime: '18:00', endTime: '20:00', durationMinutes: 120 },
    ];

    const topics: Topic[] = [
      { id: 't1', subjectId: 's1', name: 'Topic 1', difficulty: 'HIGH', estimatedMastery: 55, masteryStatus: 'MEDIUM', estimatedMinutesRequired: 120, completedMinutes: 0 },
      { id: 't2', subjectId: 's2', name: 'Topic 2', difficulty: 'MEDIUM', estimatedMastery: 65, masteryStatus: 'MEDIUM', estimatedMinutesRequired: 90, completedMinutes: 0 },
    ];

    const result = generateCandidatePlan({
      userId: 'u1',
      planVersionId: 'v1',
      topics,
      subjects: [
        { id: 's1', userId: 'u1', name: 'Subject 1', createdAt: '' },
        { id: 's2', userId: 'u1', name: 'Subject 2', createdAt: '' },
      ],
      exams: [],
      availability,
      energyPreferences: [],
      userProfile: { id: 'u1', name: 'Alex', email: 'a@a.com', dailyCapacityMinutes: 240, createdAt: '' },
      currentDate: targetDay,
      planningHorizonDays: 1,
    });

    expect(result.violations.some((v) => v.type === 'UNAVAILABLE_TIME')).toBe(false);
    expect(result.sessions.every((s) => s.date === format(targetDay, 'yyyy-MM-dd'))).toBe(true);
    for (const session of result.sessions) {
      const sessionStart = Number(session.startTime.replace(':', '').slice(0, 2)) * 60 + Number(session.startTime.replace(':', '').slice(2, 4));
      const sessionEnd = Number(session.endTime.replace(':', '').slice(0, 2)) * 60 + Number(session.endTime.replace(':', '').slice(2, 4));
      const isWithinWindow = availability.some((window) => {
        const start = Number(window.startTime.replace(':', '').slice(0, 2)) * 60 + Number(window.startTime.replace(':', '').slice(2));
        const end = Number(window.endTime.replace(':', '').slice(0, 2)) * 60 + Number(window.endTime.replace(':', '').slice(2));
        return sessionStart >= start && sessionEnd <= end;
      });
      expect(isWithinWindow).toBe(true);
    }
  });
});
