/**
 * POST /api/ai/quiz
 *
 * Generate a micro-quiz for a study topic.
 *
 * Request body:
 * - topic: string
 * - subject: string
 * - numQuestions?: number (default 4, range 2-10)
 * - context?: string
 */

import { NextRequest, NextResponse } from "next/server";
import { generateQuiz } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { topic, subject, numQuestions, context } = body;

    if (!topic || typeof topic !== "string") {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "topic is required" } },
        { status: 400 }
      );
    }

    if (!subject || typeof subject !== "string") {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "subject is required" } },
        { status: 400 }
      );
    }

    const result = await generateQuiz({
      topic,
      subject,
      numQuestions: typeof numQuestions === "number" ? numQuestions : undefined,
      context: typeof context === "string" ? context : undefined,
    });

    return NextResponse.json(result, {
      status: result.success ? 200 : 502,
    });
  } catch (error) {
    console.error("[API /api/ai/quiz] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error", retryable: false } },
      { status: 500 }
    );
  }
}
