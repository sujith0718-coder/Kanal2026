import { NextResponse } from 'next/server';
import { getMockStore } from '@/lib/db/mock-db';
import { getNextBestAction } from '@/lib/planner/next-action';
import { calculatePlanFeasibility } from '@/lib/planner/feasibility';
import { calculateExamRisk } from '@/lib/planner/risk';
import { format } from 'date-fns';

export async function GET() {
  try {
    const store = getMockStore();
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    // Filter sessions for today
    const todaySessions = store.studySessions.filter((s) => s.date === todayStr);

    // Compute Next Best Action
    const nextAction = getNextBestAction(
      store.studySessions,
      store.topics,
      store.subjects,
      store.exams
    );

    // Compute Feasibility / Plan Health
    const feasibility = calculatePlanFeasibility({
      topics: store.topics,
      exams: store.exams,
      availability: store.availability,
      userProfile: store.user,
    });

    // Compute Risk for all subjects
    const risks = store.subjects.map((sub) =>
      calculateExamRisk(sub, store.topics, store.exams.find((e) => e.subjectId === sub.id))
    );

    return NextResponse.json({
      success: true,
      todayDate: todayStr,
      user: store.user,
      nextAction,
      todaySessions,
      feasibility,
      risks,
      activePlanVersion: store.planVersions.find((pv) => pv.status === 'ACTIVE') || store.planVersions[0],
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
