import { NextResponse } from 'next/server';
import { getMockStore } from '@/lib/db/mock-db';

export async function GET() {
  try {
    const store = getMockStore();
    
    const subjectsWithDetails = store.subjects.map((s) => {
      const topics = store.topics.filter((t) => t.subjectId === s.id);
      const exam = store.exams.find((e) => e.subjectId === s.id);
      return {
        ...s,
        topics,
        exam,
      };
    });

    return NextResponse.json({
      success: true,
      subjects: subjectsWithDetails,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
