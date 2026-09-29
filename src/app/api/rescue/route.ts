import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/lib/db/mock-db';
import { executeRescueSchedule } from '@/lib/planner/rescue';
import { PlanVersion } from '@/types';
import { explainPlanChanges } from '@/lib/ai/explain-plan';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const store = getMockStore();

    let missedSessionIds: string[] = body.missedSessionIds || [];
    if (missedSessionIds.length === 0) {
      // Pick all missed sessions
      missedSessionIds = store.studySessions
        .filter((s) => s.status === 'MISSED')
        .map((s) => s.id);
    }

    if (missedSessionIds.length === 0 && store.studySessions.length > 0) {
      // If no session marked MISSED yet, automatically mark the first planned session as missed for demo
      const firstPlanned = store.studySessions.find((s) => s.status === 'PLANNED');
      if (firstPlanned) {
        firstPlanned.status = 'MISSED';
        missedSessionIds = [firstPlanned.id];
      }
    }

    const activeVersion =
      store.planVersions.find((pv) => pv.status === 'ACTIVE') || store.planVersions[0];

    const rescueResult = executeRescueSchedule({
      userId: store.user.id,
      activePlanVersion: activeVersion,
      missedSessionIds,
      allSessions: store.studySessions,
      topics: store.topics,
      subjects: store.subjects,
      exams: store.exams,
      availability: store.availability,
      energyPreferences: store.energyPreferences,
      userProfile: store.user,
    });

    // Create new Plan Version in Store
    const newVersion: PlanVersion = {
      id: rescueResult.newPlanId,
      userId: store.user.id,
      versionNumber: rescueResult.newVersionNumber,
      trigger: 'SESSION_MISSED',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    // Archive previous active plan version
    store.planVersions.forEach((pv) => {
      pv.status = 'ARCHIVED';
    });
    store.planVersions.push(newVersion);

    // Save logged changes
    store.planChanges.push(...rescueResult.changes);

    // AI Explanation for rescue changes
    const aiExplanation = await explainPlanChanges(
      rescueResult.changes,
      missedSessionIds.length
    );

    return NextResponse.json({
      success: true,
      rescueResult: {
        ...rescueResult,
        aiExplanation: aiExplanation.summary,
        keyChanges: aiExplanation.keyChanges,
      },
      activeVersion: newVersion,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
