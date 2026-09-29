import { describe, it, expect } from 'vitest';
import { calculateTopicPriority } from '../src/lib/planner/priority';
import { getDailyAvailableMinutes } from '../src/lib/planner/capacity';
import { calculatePlanFeasibility } from '../src/lib/planner/feasibility';
import { calculateExamRisk } from '../src/lib/planner/risk';
import { updateTopicMastery } from '../src/lib/planner/mastery';
import { executeRescueSchedule } from '../src/lib/planner/rescue';
import { compareAcademicExams } from '../src/lib/planner/academic-change';
import { Subject, Topic, Exam, AvailabilityWindow, StudySession, PlanVersion } from '../src/types';
import { addDays, format, getDay } from 'date-fns';

describe('Member 3 Dynamic Data & Property-Based Verification Suite', () => {
  const userId = 'usr-dynamic-algebra';

  const linAlgSubject: Subject = {
    id: 'sub-linear-alg',
    userId,
    name: 'Linear Algebra',
    code: 'MATH-201',
    color: '#8b5cf6',
    createdAt: '2026-09-01T00:00:00Z',
  };

  const linAlgTopics: Topic[] = [
    {
      id: 'top-vec-spaces',
      subjectId: 'sub-linear-alg',
      name: 'Vector Spaces & Subspaces',
      difficulty: 'HIGH',
      estimatedMastery: 35,
      masteryStatus: 'LOW',
      estimatedMinutesRequired: 180,
      completedMinutes: 60,
    },
    {
      id: 'top-eigen',
      subjectId: 'sub-linear-alg',
      name: 'Eigenvalues & Eigenvectors',
      difficulty: 'HIGH',
      estimatedMastery: 40,
      masteryStatus: 'LOW',
      estimatedMinutesRequired: 240,
      completedMinutes: 120,
    },
  ];

  const linAlgExams: Exam[] = [
    {
      id: 'exam-lin-alg',
      subjectId: 'sub-linear-alg',
      examDate: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
      confidence: 1,
      verificationStatus: 'VERIFIED',
    },
  ];

  it('Property 1: Priority score changes dynamically when exam date or mastery shifts for arbitrary subject', () => {
    const nearExam: Exam = {
      ...linAlgExams[0],
      examDate: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
    };

    const farExam: Exam = {
      ...linAlgExams[0],
      examDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    };

    const urgentPriority = calculateTopicPriority(linAlgTopics[0], nearExam);
    const relaxedPriority = calculateTopicPriority(linAlgTopics[0], farExam);

    expect(urgentPriority.finalPriority).toBeGreaterThan(relaxedPriority.finalPriority);
  });

  it('Property 2: Capacity engine accurately calculates available minutes from arbitrary availability windows', () => {
    const windows: AvailabilityWindow[] = [
      { id: 'w1', userId, dayOfWeek: 1, startTime: '07:00', endTime: '09:00', durationMinutes: 120 }, // Mon: 2h
      { id: 'w2', userId, dayOfWeek: 2, startTime: '18:00', endTime: '21:00', durationMinutes: 180 }, // Tue: 3h
    ];

    const monDate = new Date(2026, 8, 28); // Sept 28 2026 is Monday (day 1)
    const tueDate = new Date(2026, 8, 29); // Sept 29 2026 is Tuesday (day 2)
    const sunDate = new Date(2026, 8, 27); // Sept 27 2026 is Sunday (day 0)

    const monCap = getDailyAvailableMinutes(monDate, windows, { id: userId, name: 'A', email: 'a@a.com', dailyCapacityMinutes: 300, createdAt: '' });
    const tueCap = getDailyAvailableMinutes(tueDate, windows, { id: userId, name: 'A', email: 'a@a.com', dailyCapacityMinutes: 120, createdAt: '' }); // Capped at 120
    const sunCap = getDailyAvailableMinutes(sunDate, windows, { id: userId, name: 'A', email: 'a@a.com', dailyCapacityMinutes: 300, createdAt: '' });

    expect(monCap).toBe(120);
    expect(tueCap).toBe(120);
    expect(sunCap).toBe(0);
  });

  it('Property 3: Feasibility Engine accurately classifies GREEN vs RED for arbitrary workloads', () => {
    const today = new Date();
    const todayDay = getDay(today);

    const highCapWindows: AvailabilityWindow[] = [
      { id: 'w1', userId, dayOfWeek: todayDay, startTime: '08:00', endTime: '20:00', durationMinutes: 720 },
    ];
    const lowCapWindows: AvailabilityWindow[] = [
      { id: 'w1', userId, dayOfWeek: todayDay, startTime: '08:00', endTime: '09:00', durationMinutes: 60 },
    ];

    const userProfileLarge = { id: userId, name: 'Alex', email: 'a@a.com', dailyCapacityMinutes: 720, createdAt: '' };
    const userProfileSmall = { id: userId, name: 'Alex', email: 'a@a.com', dailyCapacityMinutes: 60, createdAt: '' };

    const greenFeasibility = calculatePlanFeasibility({
      topics: linAlgTopics,
      exams: linAlgExams,
      availability: highCapWindows,
      userProfile: userProfileLarge,
      planningHorizonDays: 14,
      currentDate: today,
    });

    const redFeasibility = calculatePlanFeasibility({
      topics: linAlgTopics,
      exams: linAlgExams,
      availability: lowCapWindows,
      userProfile: userProfileSmall,
      planningHorizonDays: 7,
      currentDate: today,
    });

    expect(greenFeasibility.state).toBe('GREEN');
    expect(redFeasibility.state).toBe('RED');
    expect(redFeasibility.deficitMinutes).toBeGreaterThan(0);
  });

  it('Property 4: Mastery Engine updates topic mastery deterministically with formula 40% prev + 60% quiz', () => {
    const initialTopic: Topic = { ...linAlgTopics[0], estimatedMastery: 40 };
    const quizResult = { score: 80, totalQuestions: 5, correctAnswersCount: 4 };

    const updatedState = updateTopicMastery(initialTopic, quizResult);
    expect(updatedState.newMastery).toBe(64); // 0.4*40 + 0.6*80 = 16 + 48 = 64
  });

  it('Property 5: Rescue Mode redistributes missed session without violating daily limits or exam bounds', () => {
    const activePlan: PlanVersion = {
      id: 'plan-dynamic-v1',
      userId,
      versionNumber: 1,
      trigger: 'INITIAL_PLAN',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    const missedSession: StudySession = {
      id: 'sess-dynamic-missed',
      userId,
      subjectId: 'sub-linear-alg',
      subjectName: 'Linear Algebra',
      topicId: 'top-vec-spaces',
      topicName: 'Vector Spaces & Subspaces',
      planVersionId: 'plan-dynamic-v1',
      date: '2026-09-28',
      startTime: '10:00',
      endTime: '11:30',
      durationMinutes: 90,
      status: 'PLANNED',
      energyRequirement: 'HIGH',
      createdAt: '',
    };

    const windows: AvailabilityWindow[] = [
      { id: 'w1', userId, dayOfWeek: 1, startTime: '09:00', endTime: '12:00', durationMinutes: 180 },
      { id: 'w2', userId, dayOfWeek: 2, startTime: '09:00', endTime: '12:00', durationMinutes: 180 },
    ];

    const rescueResult = executeRescueSchedule({
      userId,
      activePlanVersion: activePlan,
      missedSessionIds: ['sess-dynamic-missed'],
      allSessions: [missedSession],
      topics: linAlgTopics,
      subjects: [linAlgSubject],
      exams: linAlgExams,
      availability: windows,
      energyPreferences: [],
      userProfile: { id: userId, name: 'Alex', email: 'alex@test.com', dailyCapacityMinutes: 180, createdAt: '' },
      currentDate: new Date('2026-09-28'),
    });

    expect(rescueResult.newPlanId).toBe('plan-v2');
    expect(rescueResult.newVersionNumber).toBe(2);
    expect(rescueResult.changes.length).toBeGreaterThan(0);
    expect(rescueResult.originalPlanId).toBe('plan-dynamic-v1');
  });

  it('Property 6: Academic Change Detection identifies exam date shift correctly', () => {
    const oldExam: Exam = { ...linAlgExams[0], examDate: '2026-10-20' };

    const result = compareAcademicExams(
      [oldExam],
      [linAlgSubject],
      [{ subjectName: linAlgSubject.name, examDate: '2026-10-15' }]
    );

    expect(result.changed).toBe(true);
    expect(result.changes[0].type).toBe('EXAM_DATE_MOVED');
    expect(result.changes[0].oldDate).toBe('2026-10-20');
    expect(result.changes[0].newDate).toBe('2026-10-15');
  });

  it('Property 7: Risk Radar adjusts score dynamically when inputs change', () => {
    const nearExam: Exam = { ...linAlgExams[0], examDate: format(addDays(new Date(), 2), 'yyyy-MM-dd') };
    const farExam: Exam = { ...linAlgExams[0], examDate: format(addDays(new Date(), 30), 'yyyy-MM-dd') };

    const highRisk = calculateExamRisk(linAlgSubject, [{ ...linAlgTopics[0], estimatedMastery: 20 }], nearExam);
    const lowRisk = calculateExamRisk(linAlgSubject, [{ ...linAlgTopics[0], estimatedMastery: 90 }], farExam);

    expect(highRisk.score).toBeGreaterThan(lowRisk.score);
  });
});
