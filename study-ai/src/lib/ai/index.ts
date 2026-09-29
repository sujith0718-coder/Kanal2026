/**
 * StudyAI — AI Layer Barrel Export
 *
 * Single import point for the entire AI layer.
 * Usage: import { extractAcademicData, generateQuiz, ... } from "@/lib/ai";
 */

// ─── Core Client (not typically imported directly) ───────────
export { generateText, generateFromFile, parseJSONResponse } from "./client";

// ─── Academic Extraction ─────────────────────────────────────
export { extractAcademicData, extractAcademicDataFromText } from "./extract-academic";
export type { ExtractAcademicOptions, ExtractFromTextOptions } from "./extract-academic";

// ─── Quiz Generation ─────────────────────────────────────────
export { generateQuiz } from "./generate-quiz";
export type { GenerateQuizOptions } from "./generate-quiz";

// ─── Plan & Rescue Explanations ──────────────────────────────
export { explainPlanScore, explainRescue } from "./explain-plan";

// ─── Academic Change Interpretation ──────────────────────────
export { interpretAcademicChanges } from "./interpret-change";
export type { InterpretChangeOptions } from "./interpret-change";

// ─── Types ───────────────────────────────────────────────────
export type {
  ConfidenceScore,
  ConfidenceLevel,
  SourceEvidence,
  ExtractedExam,
  ExtractedTopic,
  ExtractedAcademicEvent,
  AcademicExtractionResult,
  AcademicChangeType,
  AcademicChange,
  AcademicChangeResult,
  QuestionType,
  QuizQuestion,
  GeneratedQuiz,
  PlanScoreInput,
  PlanExplanation,
  RescueSessionInput,
  RescueExplanation,
  AIResult,
} from "./types";

export { aiSuccess, aiFailure, toConfidenceLevel } from "./types";

// ─── Schemas (for external validation) ───────────────────────
export {
  ExtractedExamSchema,
  ExtractedTopicSchema,
  ExtractedAcademicEventSchema,
  AcademicExtractionResultSchema,
  AcademicChangeSchema,
  AcademicChangeResultSchema,
  QuizQuestionSchema,
  GeneratedQuizSchema,
  PlanExplanationSchema,
  RescueExplanationSchema,
  PlanScoreInputSchema,
  RescueSessionInputSchema,
} from "./schemas";

// ─── Errors ──────────────────────────────────────────────────
export {
  AIError,
  AIServiceError,
  AIParseError,
  AIValidationError,
  AIQuotaError,
  AITimeoutError,
  AIConfigError,
  isAIError,
  toAIError,
} from "./errors";
