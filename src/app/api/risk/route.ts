import { NextResponse } from 'next/server';
import { getMockStore } from '@/lib/db/mock-db';
import { calculateExamRisk } from '@/lib/planner/risk';
import { explainExamRisk } from '@/lib/ai/explain-plan';

export async function GET() {
  try {
    const store = getMockStore();

    const risks = await Promise.all(
      store.subjects.map(async (subject) => {
        const exam = store.exams.find((e) => e.subjectId === subject.id);
        const riskResult = calculateExamRisk(subject, store.topics, exam);
        const aiExp = await explainExamRisk(riskResult);
        return {
          ...riskResult,
          aiExplanation: aiExp,
        };
      })
    );

    return NextResponse.json({
      success: true,
      risks,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
