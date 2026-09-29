/**
 * StudyAI — Academic Document Extraction
 *
 * Pipeline: Upload (PDF/Image) → Gemini → Structured JSON → Zod Validation → Typed Result
 *
 * Supports: exam timetables, syllabi, college timetables, academic notices.
 * Every extracted fact includes source provenance and confidence.
 */

import "server-only";

import { generateFromFile, generateText, parseJSONResponse } from "./client";
import { AIValidationError, toAIError } from "./errors";
import { ACADEMIC_EXTRACTION_PROMPT } from "./prompts";
import { AcademicExtractionResultSchema } from "./schemas";
import type { AcademicExtractionResult, AIResult } from "./types";
import { aiSuccess, aiFailure } from "./types";

// ─── Main Extraction Function ────────────────────────────────

export interface ExtractAcademicOptions {
  /** Name of the uploaded document */
  documentName: string;
  /** Base64-encoded file content */
  fileData: string;
  /** MIME type: image/png, image/jpeg, application/pdf, etc. */
  mimeType: string;
}

/**
 * Extract academic data from an uploaded document.
 *
 * Flow: File → Gemini (multimodal) → JSON → Zod validation → AcademicExtractionResult
 *
 * @returns AIResult wrapping the validated extraction, or a typed error
 */
export async function extractAcademicData(
  options: ExtractAcademicOptions
): Promise<AIResult<AcademicExtractionResult>> {
  const { documentName, fileData, mimeType } = options;

  try {
    const prompt = ACADEMIC_EXTRACTION_PROMPT(documentName);

    const rawResponse = await generateFromFile(prompt, fileData, mimeType);

    const parsed = parseJSONResponse(rawResponse);

    const result = AcademicExtractionResultSchema.safeParse(parsed);

    if (!result.success) {
      const issues = result.error.issues.map((i) => ({
        path: i.path.map(String).join("."),
        message: i.message,
      }));
      return aiFailure(
        "AI_VALIDATION_ERROR",
        `Extraction output failed validation: ${issues.map((i) => i.message).join("; ")}`,
        true
      );
    }

    return aiSuccess(result.data as AcademicExtractionResult);
  } catch (error) {
    const aiError = toAIError(error);
    return aiFailure(aiError.code, aiError.message, aiError.retryable);
  }
}

// ─── Text-Only Extraction (for pre-extracted text) ───────────

export interface ExtractFromTextOptions {
  /** Name/label for the source */
  documentName: string;
  /** Plain text content to extract from */
  textContent: string;
}

/**
 * Extract academic data from plain text (e.g., pasted schedule).
 * Useful when the document has already been OCR'd or copied.
 */
export async function extractAcademicDataFromText(
  options: ExtractFromTextOptions
): Promise<AIResult<AcademicExtractionResult>> {
  const { documentName, textContent } = options;

  try {
    const prompt =
      ACADEMIC_EXTRACTION_PROMPT(documentName) +
      "\n\nDocument content:\n" +
      textContent;

    const rawResponse = await generateText(prompt);

    const parsed = parseJSONResponse(rawResponse);

    const result = AcademicExtractionResultSchema.safeParse(parsed);

    if (!result.success) {
      const issues = result.error.issues.map((i) => ({
        path: i.path.map(String).join("."),
        message: i.message,
      }));
      return aiFailure(
        "AI_VALIDATION_ERROR",
        `Text extraction output failed validation: ${issues.map((i) => i.message).join("; ")}`,
        true
      );
    }

    return aiSuccess(result.data as AcademicExtractionResult);
  } catch (error) {
    const aiError = toAIError(error);
    return aiFailure(aiError.code, aiError.message, aiError.retryable);
  }
}
