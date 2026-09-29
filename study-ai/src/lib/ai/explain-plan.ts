/**
 * StudyAI — Plan & Rescue Explanation
 *
 * Turns deterministic planning engine scores into human-readable explanations.
 *
 * CRITICAL RULE: Gemini must NEVER change or recalculate scores.
 * Gemini only explains what the deterministic engine has decided.
 */

import "server-only";

import { generateText, parseJSONResponse } from "./client";
import { toAIError } from "./errors";
import {
  PLAN_EXPLANATION_PROMPT,
  RESCUE_EXPLANATION_PROMPT,
} from "./prompts";
import {
  PlanExplanationSchema,
  RescueExplanationSchema,
} from "./schemas";
import type {
  PlanScoreInput,
  PlanExplanation,
  RescueSessionInput,
  RescueExplanation,
  AIResult,
} from "./types";
import { aiSuccess, aiFailure } from "./types";

// ─── Plan Explanation ────────────────────────────────────────

/**
 * Generate a human-readable explanation of a plan risk score.
 *
 * Input: deterministic score + factors (from planning engine)
 * Output: natural language explanation (from Gemini)
 *
 * Gemini does NOT change the score.
 */
export async function explainPlanScore(
  input: PlanScoreInput
): Promise<AIResult<PlanExplanation>> {
  try {
    const prompt = PLAN_EXPLANATION_PROMPT(
      input.subject,
      input.score,
      input.factors,
      input.examDate,
      input.daysUntilExam
    );

    const rawResponse = await generateText(prompt);

    const parsed = parseJSONResponse(rawResponse);

    const result = PlanExplanationSchema.safeParse(parsed);

    if (!result.success) {
      const issues = result.error.issues.map((i) => ({
        path: i.path.map(String).join("."),
        message: i.message,
      }));
      return aiFailure(
        "AI_VALIDATION_ERROR",
        `Plan explanation failed validation: ${issues.map((i) => i.message).join("; ")}`,
        true
      );
    }

    return aiSuccess(result.data as PlanExplanation);
  } catch (error) {
    const aiError = toAIError(error);
    return aiFailure(aiError.code, aiError.message, aiError.retryable);
  }
}

// ─── Rescue Explanation ──────────────────────────────────────

/**
 * Generate a human-readable explanation of a rescue session redistribution.
 *
 * Input: original session + redistributed sessions (from rescue engine)
 * Output: natural language explanation (from Gemini)
 *
 * Gemini does NOT choose the redistribution — only explains it.
 */
export async function explainRescue(
  input: RescueSessionInput
): Promise<AIResult<RescueExplanation>> {
  try {
    const prompt = RESCUE_EXPLANATION_PROMPT(
      input.subject,
      input.topic,
      input.originalDate,
      input.originalDuration,
      input.redistributedSessions,
      input.reason
    );

    const rawResponse = await generateText(prompt);

    const parsed = parseJSONResponse(rawResponse);

    const result = RescueExplanationSchema.safeParse(parsed);

    if (!result.success) {
      const issues = result.error.issues.map((i) => ({
        path: i.path.map(String).join("."),
        message: i.message,
      }));
      return aiFailure(
        "AI_VALIDATION_ERROR",
        `Rescue explanation failed validation: ${issues.map((i) => i.message).join("; ")}`,
        true
      );
    }

    return aiSuccess(result.data as RescueExplanation);
  } catch (error) {
    const aiError = toAIError(error);
    return aiFailure(aiError.code, aiError.message, aiError.retryable);
  }
}
