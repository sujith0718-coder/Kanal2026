import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/lib/db/mock-db';
import { compareAcademicExams } from '@/lib/planner/academic-change';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = getMockStore();
    const newExams = body.exams || [];

    const comparison = compareAcademicExams(store.exams, store.subjects, newExams);

    return NextResponse.json({
      success: true,
      comparison,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
