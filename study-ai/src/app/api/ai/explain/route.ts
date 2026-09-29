/**
 * POST /api/ai/explain
 *
 * Generate human-readable explanations for plan scores or rescue sessions.
 *
 * Request body:
 * - type: "plan" | "rescue"
 *
 * For type="plan":
 * - subject: string
 * - score: number
 * - factors: { examUrgency, remainingSyllabus, masteryGap, difficulty }
 * - examDate?: string
 * - daysUntilExam?: number
 *
 * For type="rescue":
 * - subject: string
 * - topic: string
 * - originalDate: string
 * - originalDuration: string
 * - redistributedSessions: Array<{ date, duration }>
 * - reason: string
 */

import { NextRequest, NextResponse } from "next/server";
import { explainPlanScore, explainRescue } from "@/lib/ai";
import { PlanScoreInputSchema, RescueSessionInputSchema } from "@/lib/ai/schemas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { type } = body;

    if (type === "plan") {
      const validation = PlanScoreInputSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_INPUT",
              message: validation.error.issues.map((i) => i.message).join("; "),
            },
          },
          { status: 400 }
        );
      }

      const result = await explainPlanScore(validation.data);
      return NextResponse.json(result, {
        status: result.success ? 200 : 502,
      });
    }

    if (type === "rescue") {
      const validation = RescueSessionInputSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_INPUT",
              message: validation.error.issues.map((i) => i.message).join("; "),
            },
          },
          { status: 400 }
        );
      }

      const result = await explainRescue(validation.data);
      return NextResponse.json(result, {
        status: result.success ? 200 : 502,
      });
    }

    return NextResponse.json(
      { success: false, error: { code: "INVALID_INPUT", message: 'type must be "plan" or "rescue"' } },
      { status: 400 }
    );
  } catch (error) {
    console.error("[API /api/ai/explain] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error", retryable: false } },
      { status: 500 }
    );
  }
}
