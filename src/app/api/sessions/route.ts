import { NextResponse } from 'next/server';
import { getMockStore } from '@/lib/db/mock-db';

export async function GET() {
  try {
    const store = getMockStore();
    return NextResponse.json({
      success: true,
      sessions: store.studySessions,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
