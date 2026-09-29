import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/lib/db/mock-db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: planVersionId } = await params;
    const store = getMockStore();

    const changes = store.planChanges.filter((c) => c.planVersionId === planVersionId);
    const version = store.planVersions.find((pv) => pv.id === planVersionId);

    return NextResponse.json({
      success: true,
      planVersion: version,
      changes,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
