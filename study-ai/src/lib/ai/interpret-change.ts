/**
 * StudyAI — Academic Change Interpretation
 *
 * Compares existing academic data with newly extracted data
 * and identifies structured changes (e.g., exam date moved).
 *
 * Lightweight — not a full document-diff system.
 */

import "server-only";

import { generateText, parseJSONResponse } from "./client";
import { toAIError } from "./errors";
import { ACADEMIC_CHANGE_PROMPT } from "./prompts";
import { AcademicChangeResultSchema } from "./schemas";
import type { AcademicChangeResult, AcademicExtractionResult, AIResult } from "./types";
import { aiSuccess, aiFailure } from "./types";

// ─── Change Interpretation ───────────────────────────────────

export interface InterpretChangeOptions {
  /** Previously known academic data */
  existingData: AcademicExtractionResult;
  /** Newly extracted academic data */
  newData: AcademicExtractionResult;
  /** Name of the new document that was processed */
  documentName: string;
}

/**
 * Interpret changes between old and new academic extractions.
 *
 * @returns Structured list of changes with confidence and descriptions
 */
export async function interpretAcademicChanges(
  options: InterpretChangeOptions
): Promise<AIResult<AcademicChangeResult>> {
  const { existingData, newData, documentName } = options;

  try {
    const prompt = ACADEMIC_CHANGE_PROMPT(
      JSON.stringify(existingData, null, 2),
      JSON.stringify(newData, null, 2),
      documentName
    );

    const rawResponse = await generateText(prompt);

    const parsed = parseJSONResponse(rawResponse);

    const result = AcademicChangeResultSchema.safeParse(parsed);

    if (!result.success) {
      const issues = result.error.issues.map((i) => ({
        path: i.path.map(String).join("."),
        message: i.message,
      }));
      return aiFailure(
        "AI_VALIDATION_ERROR",
        `Change interpretation failed validation: ${issues.map((i) => i.message).join("; ")}`,
        true
      );
    }

    return aiSuccess(result.data as AcademicChangeResult);
  } catch (error) {
    const aiError = toAIError(error);
    return aiFailure(aiError.code, aiError.message, aiError.retryable);
  }
}
