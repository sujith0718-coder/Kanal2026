import { NextResponse } from 'next/server';
import { getMockStore } from '@/lib/db/mock-db';
import { calculatePlanFeasibility } from '@/lib/planner/feasibility';

export async function GET() {
  try {
    const store = getMockStore();
    const activeVersion = store.planVersions.find((pv) => pv.status === 'ACTIVE') || store.planVersions[0];
    const sessions = store.studySessions.filter((s) => s.planVersionId === activeVersion.id);

    const feasibility = calculatePlanFeasibility({
      topics: store.topics,
      exams: store.exams,
      availability: store.availability,
      userProfile: store.user,
    });

    return NextResponse.json({
      success: true,
      activeVersion,
      versions: store.planVersions,
      sessions,
      feasibility,
      changes: store.planChanges.filter((c) => c.planVersionId === activeVersion.id),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
