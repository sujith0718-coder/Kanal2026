import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/lib/db/mock-db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const store = getMockStore();

    const session = store.studySessions.find((s) => s.id === id);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    session.status = 'SKIPPED';

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
