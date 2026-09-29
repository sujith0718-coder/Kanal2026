/**
 * POST /api/ai/change
 *
 * Interpret academic changes between old and new extractions.
 *
 * Request body:
 * - existingData: AcademicExtractionResult
 * - newData: AcademicExtractionResult
 * - documentName: string
 */

import { NextRequest, NextResponse } from "next/server";
import { interpretAcademicChanges } from "@/lib/ai";
import { AcademicExtractionResultSchema } from "@/lib/ai/schemas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { existingData, newData, documentName } = body;

    if (!documentName || typeof documentName !== "string") {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "documentName is required" } },
        { status: 400 }
      );
    }

    const existingValidation = AcademicExtractionResultSchema.safeParse(existingData);
    if (!existingValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: `existingData is invalid: ${existingValidation.error.issues.map((i) => i.message).join("; ")}`,
          },
        },
        { status: 400 }
      );
    }

    const newValidation = AcademicExtractionResultSchema.safeParse(newData);
    if (!newValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: `newData is invalid: ${newValidation.error.issues.map((i) => i.message).join("; ")}`,
          },
        },
        { status: 400 }
      );
    }

    const result = await interpretAcademicChanges({
      existingData: existingValidation.data,
      newData: newValidation.data,
      documentName,
    });

    return NextResponse.json(result, {
      status: result.success ? 200 : 502,
    });
  } catch (error) {
    console.error("[API /api/ai/change] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error", retryable: false } },
      { status: 500 }
    );
  }
}
