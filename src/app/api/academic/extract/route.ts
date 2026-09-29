import { NextRequest, NextResponse } from 'next/server';
import { extractAcademicDocument } from '@/lib/ai/extract-academic';
import { getMockStore } from '@/lib/db/mock-db';
import { AcademicDocument } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const filename = body.filename || 'Exam_Schedule.pdf';
    const text = body.text || 'Semester Exam Schedule: Data Structures Exam on Oct 5. Discrete Mathematics Exam on Oct 8.';

    const extractionResult = await extractAcademicDocument(filename, text);
    const store = getMockStore();

    const newDoc: AcademicDocument = {
      id: `doc-${Date.now()}`,
      userId: store.user.id,
      filename,
      fileType: filename.endsWith('.pdf') ? 'application/pdf' : 'image/png',
      storagePath: `documents/${filename}`,
      processingState: 'processed',
      extractedExamsCount: extractionResult.exams.length,
      extractedTopicsCount: extractionResult.topics.length,
      extractedEventsCount: extractionResult.events.length,
      uploadedAt: new Date().toISOString(),
    };

    store.documents.push(newDoc);

    return NextResponse.json({
      success: true,
      document: newDoc,
      extraction: extractionResult,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
