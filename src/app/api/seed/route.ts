import { NextResponse } from 'next/server';
import { resetMockStore } from '@/lib/db/mock-db';

export async function POST() {
  try {
    const freshStore = resetMockStore();
    return NextResponse.json({
      success: true,
      message: 'Demo store successfully reset and seeded with Mathematics, DSA, COA, and OOP demo data.',
      storeSummary: {
        subjectsCount: freshStore.subjects.length,
        topicsCount: freshStore.topics.length,
        examsCount: freshStore.exams.length,
        sessionsCount: freshStore.studySessions.length,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
