/**
 * StudyAI — Zod Schemas for AI Layer
 *
 * Runtime validation schemas for all Gemini outputs.
 * Every AI response is parsed through these schemas before
 * being accepted by the application.
 *
 * Convention: confidence is 0.0–1.0 (normalized float)
 */

import { z } from "zod/v4";

// ─── Shared Primitives ──────────────────────────────────────

/** Confidence score: 0.0 to 1.0 */
const confidenceScore = z.number().min(0).max(1);

/** ISO date string: YYYY-MM-DD */
const isoDate = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  "Expected ISO date format YYYY-MM-DD"
);

/** Time string: HH:mm */
const timeString = z.string().regex(
  /^\d{2}:\d{2}$/,
  "Expected time format HH:mm"
);

// ─── Academic Extraction Schemas ─────────────────────────────

export const ExtractedExamSchema = z.object({
  subject: z.string().min(1, "Subject name is required"),
  examDate: isoDate,
  startTime: timeString.optional(),
  endTime: timeString.optional(),
  sourceDocument: z.string().min(1),
  sourcePage: z.number().int().positive().optional(),
  confidence: confidenceScore,
});

export const ExtractedTopicSchema = z.object({
  subject: z.string().min(1, "Subject name is required"),
  name: z.string().min(1, "Topic name is required"),
  unit: z.string().optional(),
  sourceDocument: z.string().min(1),
  sourcePage: z.number().int().positive().optional(),
  confidence: confidenceScore,
});

export const ExtractedAcademicEventSchema = z.object({
  subject: z.string().optional(),
  eventType: z.string().min(1, "Event type is required"),
  date: isoDate,
  description: z.string().optional(),
  sourceDocument: z.string().min(1),
  sourcePage: z.number().int().positive().optional(),
  confidence: confidenceScore,
});

export const DocumentTypeSchema = z.enum([
  "exam_timetable",
  "syllabus",
  "college_timetable",
  "academic_notice",
  "unknown",
]);

export const AcademicExtractionResultSchema = z.object({
  exams: z.array(ExtractedExamSchema),
  topics: z.array(ExtractedTopicSchema),
  events: z.array(ExtractedAcademicEventSchema),
  documentType: DocumentTypeSchema,
  rawSummary: z.string(),
});

// ─── Academic Change Schemas ─────────────────────────────────

export const AcademicChangeTypeSchema = z.enum([
  "EXAM_DATE_CHANGED",
  "EXAM_TIME_CHANGED",
  "EXAM_ADDED",
  "EXAM_REMOVED",
  "TOPIC_ADDED",
  "TOPIC_REMOVED",
  "EVENT_ADDED",
  "EVENT_CHANGED",
  "EVENT_REMOVED",
]);

export const AcademicChangeSchema = z.object({
  type: AcademicChangeTypeSchema,
  subject: z.string().min(1),
  field: z.string().min(1),
  oldValue: z.string().optional(),
  newValue: z.string().optional(),
  confidence: confidenceScore,
  description: z.string().min(1),
});

export const AcademicChangeResultSchema = z.object({
  changes: z.array(AcademicChangeSchema),
  summary: z.string().min(1),
  hasSignificantChanges: z.boolean(),
});

// ─── Quiz Schemas ────────────────────────────────────────────

export const QuestionTypeSchema = z.enum(["mcq", "concept", "code_output"]);

export const QuizQuestionSchema = z.object({
  question: z.string().min(10, "Question is too short"),
  type: QuestionTypeSchema,
  options: z.array(z.string().min(1)).min(2).max(6),
  correctAnswer: z.string().min(1, "Correct answer is required"),
  explanation: z.string().min(10, "Explanation is too short"),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

export const GeneratedQuizSchema = z.object({
  topic: z.string().min(1),
  subject: z.string().min(1),
  questions: z.array(QuizQuestionSchema).min(1).max(10),
  generatedAt: z.string(),
});

// ─── Plan Explanation Schemas ────────────────────────────────

export const PlanScoreInputSchema = z.object({
  subject: z.string().min(1),
  score: z.number().min(0).max(100),
  factors: z.object({
    examUrgency: z.number().min(0).max(100),
    remainingSyllabus: z.number().min(0).max(100),
    masteryGap: z.number().min(0).max(100),
    difficulty: z.number().min(0).max(100),
  }),
  examDate: z.string().optional(),
  daysUntilExam: z.number().int().optional(),
});

export const PlanExplanationSchema = z.object({
  subject: z.string().min(1),
  explanation: z.string().min(20),
  keyFactors: z.array(z.string()).min(1),
  recommendation: z.string().min(10),
});

// ─── Rescue Explanation Schemas ──────────────────────────────

export const RescueSessionInputSchema = z.object({
  subject: z.string().min(1),
  topic: z.string().min(1),
  originalDate: z.string().min(1),
  originalDuration: z.string().min(1),
  redistributedSessions: z.array(
    z.object({
      date: z.string().min(1),
      duration: z.string().min(1),
    })
  ).min(1),
  reason: z.string().min(1),
});

export const RescueExplanationSchema = z.object({
  subject: z.string().min(1),
  explanation: z.string().min(20),
  impactSummary: z.string().min(10),
});

// ─── Inferred Types from Schemas ─────────────────────────────
// These can be used as an alternative to the manual types in types.ts

export type ExtractedExamZ = z.infer<typeof ExtractedExamSchema>;
export type ExtractedTopicZ = z.infer<typeof ExtractedTopicSchema>;
export type ExtractedAcademicEventZ = z.infer<typeof ExtractedAcademicEventSchema>;
export type AcademicExtractionResultZ = z.infer<typeof AcademicExtractionResultSchema>;
export type AcademicChangeZ = z.infer<typeof AcademicChangeSchema>;
export type AcademicChangeResultZ = z.infer<typeof AcademicChangeResultSchema>;
export type QuizQuestionZ = z.infer<typeof QuizQuestionSchema>;
export type GeneratedQuizZ = z.infer<typeof GeneratedQuizSchema>;
export type PlanExplanationZ = z.infer<typeof PlanExplanationSchema>;
export type RescueExplanationZ = z.infer<typeof RescueExplanationSchema>;
