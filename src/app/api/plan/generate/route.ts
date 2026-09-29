import { NextResponse } from 'next/server';
import { getMockStore } from '@/lib/db/mock-db';
import { generateCandidatePlan } from '@/lib/planner/planner';
import { PlanVersion } from '@/types';

export async function POST() {
  try {
    const store = getMockStore();
    const newVersionNumber = store.planVersions.length + 1;
    const newPlanId = `plan-v${newVersionNumber}`;

    const newVersion: PlanVersion = {
      id: newPlanId,
      userId: store.user.id,
      versionNumber: newVersionNumber,
      trigger: 'MANUAL_REPLAN',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    // Archive previous versions
    store.planVersions.forEach((pv) => {
      pv.status = 'ARCHIVED';
    });
    store.planVersions.push(newVersion);

    const planResult = generateCandidatePlan({
      userId: store.user.id,
      planVersionId: newPlanId,
      topics: store.topics,
      subjects: store.subjects,
      exams: store.exams,
      availability: store.availability,
      energyPreferences: store.energyPreferences,
      userProfile: store.user,
    });

    store.studySessions = [...store.studySessions, ...planResult.sessions];

    return NextResponse.json({
      success: true,
      planVersion: newVersion,
      sessionsCount: planResult.sessions.length,
      feasibility: planResult.feasibility,
      violations: planResult.violations,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
