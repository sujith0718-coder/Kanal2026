/**
 * StudyAI — Micro-Quiz Generation
 *
 * Generates 3–5 quiz questions on a topic using Gemini.
 * All outputs are Zod-validated before acceptance.
 *
 * IMPORTANT: Gemini only supplies questions + correct answers + explanations.
 * Score calculation is done by application code, NEVER by Gemini.
 */

import "server-only";

import { generateText, parseJSONResponse } from "./client";
import { toAIError } from "./errors";
import { QUIZ_GENERATION_PROMPT } from "./prompts";
import { GeneratedQuizSchema } from "./schemas";
import type { GeneratedQuiz, AIResult } from "./types";
import { aiSuccess, aiFailure } from "./types";

// ─── Quiz Generation ─────────────────────────────────────────

export interface GenerateQuizOptions {
  /** The topic to generate questions about */
  topic: string;
  /** The subject the topic belongs to */
  subject: string;
  /** Number of questions to generate (3–5 recommended) */
  numQuestions?: number;
  /** Optional additional context (e.g., from syllabus) */
  context?: string;
}

/**
 * Generate a micro-quiz for a study topic.
 *
 * @returns AIResult wrapping the validated quiz, or a typed error
 */
export async function generateQuiz(
  options: GenerateQuizOptions
): Promise<AIResult<GeneratedQuiz>> {
  const {
    topic,
    subject,
    numQuestions = 4,
    context,
  } = options;

  // Clamp to safe range
  const safeNumQuestions = Math.max(2, Math.min(numQuestions, 10));

  try {
    const prompt = QUIZ_GENERATION_PROMPT(topic, subject, safeNumQuestions, context);

    const rawResponse = await generateText(prompt);

    const parsed = parseJSONResponse(rawResponse);

    const result = GeneratedQuizSchema.safeParse(parsed);

    if (!result.success) {
      const issues = result.error.issues.map((i) => ({
        path: i.path.map(String).join("."),
        message: i.message,
      }));
      return aiFailure(
        "AI_VALIDATION_ERROR",
        `Quiz output failed validation: ${issues.map((i) => i.message).join("; ")}`,
        true
      );
    }

    const quiz = result.data as GeneratedQuiz;

    // Post-validation: ensure correctAnswer is in options
    for (const q of quiz.questions) {
      if (!q.options.includes(q.correctAnswer)) {
        return aiFailure(
          "AI_VALIDATION_ERROR",
          `Quiz question "${q.question.slice(0, 50)}..." has correctAnswer not in options`,
          true
        );
      }
    }

    return aiSuccess(quiz);
  } catch (error) {
    const aiError = toAIError(error);
    return aiFailure(aiError.code, aiError.message, aiError.retryable);
  }
}
