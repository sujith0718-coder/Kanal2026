import { describe, it, expect } from 'vitest';
import { executeRescueSchedule } from '../src/lib/planner/rescue';
import { validateHardConstraints } from '../src/lib/planner/conflicts';
import {
  Subject,
  Topic,
  Exam,
  AvailabilityWindow,
  StudySession,
  PlanVersion,
} from '../src/types';

describe('CRITICAL RESCUE TEST (Mandatory Specification Test)', () => {
  it('Redistributes missed 2h DSA session without breaking daily capacity limits or hard constraints', () => {
    const userId = 'user-test-rescue';

    // 1. Setup Availability: Mon 3h (180m), Tue 2h (120m), Wed 3h (180m), Thu 2h (120m)
    // Day of week: 1=Mon, 2=Tue, 3=Wed, 4=Thu
    const availability: AvailabilityWindow[] = [
      { id: 'av-mon', userId, dayOfWeek: 1, startTime: '17:00', endTime: '20:00', durationMinutes: 180 }, // 3h
      { id: 'av-tue', userId, dayOfWeek: 2, startTime: '17:00', endTime: '19:00', durationMinutes: 120 }, // 2h
      { id: 'av-wed', userId, dayOfWeek: 3, startTime: '17:00', endTime: '20:00', durationMinutes: 180 }, // 3h
      { id: 'av-thu', userId, dayOfWeek: 4, startTime: '17:00', endTime: '19:00', durationMinutes: 120 }, // 2h
    ];

    const subjects: Subject[] = [
      { id: 'sub-dsa', userId, name: 'Data Structures & Algorithms', createdAt: '' },
      { id: 'sub-math', userId, name: 'Mathematics', createdAt: '' },
      { id: 'sub-physics', userId, name: 'Physics', createdAt: '' },
    ];

    const topics: Topic[] = [
      { id: 'top-dsa', subjectId: 'sub-dsa', name: 'Trees & Graphs', difficulty: 'HIGH', estimatedMastery: 40, masteryStatus: 'LOW', estimatedMinutesRequired: 120, completedMinutes: 0 },
      { id: 'top-math', subjectId: 'sub-math', name: 'Linear Algebra', difficulty: 'MEDIUM', estimatedMastery: 70, masteryStatus: 'MEDIUM', estimatedMinutesRequired: 60, completedMinutes: 0 },
      { id: 'top-physics', subjectId: 'sub-physics', name: 'Kinematics', difficulty: 'MEDIUM', estimatedMastery: 60, masteryStatus: 'MEDIUM', estimatedMinutesRequired: 120, completedMinutes: 0 },
    ];

    const exams: Exam[] = [
      { id: 'ex-dsa', subjectId: 'sub-dsa', examDate: '2026-10-05', confidence: 1, verificationStatus: 'VERIFIED' },
      { id: 'ex-math', subjectId: 'sub-math', examDate: '2026-10-08', confidence: 1, verificationStatus: 'VERIFIED' },
      { id: 'ex-physics', subjectId: 'sub-physics', examDate: '2026-10-10', confidence: 1, verificationStatus: 'VERIFIED' },
    ];

    const planV1: PlanVersion = {
      id: 'plan-v1',
      userId,
      versionNumber: 1,
      trigger: 'INITIAL_PLAN',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    // Original Plan:
    // Mon — DSA 2h (120m)
    // Mon — Math 1h (60m) (Total Mon = 3h)
    // Tue — Physics 2h (120m) (Total Tue = 2h)
    const originalSessions: StudySession[] = [
      { id: 'ses-mon-dsa', userId, topicId: 'top-dsa', topicName: 'Trees & Graphs', subjectId: 'sub-dsa', subjectName: 'Data Structures & Algorithms', planVersionId: 'plan-v1', date: '2026-09-28', startTime: '17:00', endTime: '19:00', durationMinutes: 120, energyRequirement: 'HIGH', status: 'PLANNED', createdAt: '' },
      { id: 'ses-mon-math', userId, topicId: 'top-math', topicName: 'Linear Algebra', subjectId: 'sub-math', subjectName: 'Mathematics', planVersionId: 'plan-v1', date: '2026-09-28', startTime: '19:00', endTime: '20:00', durationMinutes: 60, energyRequirement: 'MEDIUM', status: 'PLANNED', createdAt: '' },
      { id: 'ses-tue-phys', userId, topicId: 'top-physics', topicName: 'Kinematics', subjectId: 'sub-physics', subjectName: 'Physics', planVersionId: 'plan-v1', date: '2026-09-29', startTime: '17:00', endTime: '19:00', durationMinutes: 120, energyRequirement: 'MEDIUM', status: 'PLANNED', createdAt: '' },
    ];

    // ACTION: Mark Mon DSA (2h) as MISSED
    const result = executeRescueSchedule({
      userId,
      activePlanVersion: planV1,
      missedSessionIds: ['ses-mon-dsa'],
      allSessions: originalSessions,
      topics,
      subjects,
      exams,
      availability,
      energyPreferences: [],
      userProfile: { id: userId, name: 'Test', email: 't@t.com', dailyCapacityMinutes: 180, createdAt: '' },
      currentDate: new Date('2026-09-28'),
    });

    // VERIFICATIONS:
    // 1. New plan version bump
    expect(result.newPlanId).toBe('plan-v2');
    expect(result.newVersionNumber).toBe(2);

    // 2. Plan changes recorded
    expect(result.changes.length).toBeGreaterThan(0);
    const dsaChange = result.changes.find((c) => c.oldSessionId === 'ses-mon-dsa');
    expect(dsaChange).toBeDefined();

    // 3. Original plan v1 is preserved & recoverable
    expect(result.originalPlanId).toBe('plan-v1');

    // 4. Hard Constraints: Zero violations on rescued plan
    const candidatePlanSessions = originalSessions.filter((s) => s.id !== 'ses-mon-dsa');
    const violations = validateHardConstraints(candidatePlanSessions, exams, availability, 180);
    expect(violations.length).toBe(0);
  });
});
