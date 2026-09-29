/**
 * StudyAI — TypeScript Interfaces for AI Layer
 *
 * These interfaces define the contracts between the AI layer
 * and the rest of the application. Other team members should
 * import these types for integration.
 *
 * NOTE: These are pure TypeScript types (no Zod dependency).
 * See schemas.ts for the runtime-validated Zod versions.
 */

// ─── Confidence ──────────────────────────────────────────────

/** Normalized confidence score: 0.0 to 1.0 */
export type ConfidenceScore = number;

/** Human-readable confidence level */
export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

/** Convert numeric confidence to level */
export function toConfidenceLevel(score: ConfidenceScore): ConfidenceLevel {
  if (score >= 0.85) return "HIGH";
  if (score >= 0.60) return "MEDIUM";
  return "LOW";
}

// ─── Source Evidence ─────────────────────────────────────────

/** Provenance for every AI-extracted fact */
export interface SourceEvidence {
  sourceDocument: string;
  sourcePage?: number;
  confidence: ConfidenceScore;
  confidenceLevel: ConfidenceLevel;
  extractedAt: string; // ISO timestamp
}

// ─── Academic Extraction ─────────────────────────────────────

export interface ExtractedExam {
  subject: string;
  examDate: string; // ISO date string YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  sourceDocument: string;
  sourcePage?: number;
  confidence: ConfidenceScore;
}

export interface ExtractedTopic {
  subject: string;
  name: string;
  unit?: string;
  sourceDocument: string;
  sourcePage?: number;
  confidence: ConfidenceScore;
}

export interface ExtractedAcademicEvent {
  subject?: string;
  eventType: string;
  date: string; // ISO date string YYYY-MM-DD
  description?: string;
  sourceDocument: string;
  sourcePage?: number;
  confidence: ConfidenceScore;
}

export interface AcademicExtractionResult {
  exams: ExtractedExam[];
  topics: ExtractedTopic[];
  events: ExtractedAcademicEvent[];
  documentType: "exam_timetable" | "syllabus" | "college_timetable" | "academic_notice" | "unknown";
  rawSummary: string;
}

// ─── Academic Change Interpretation ──────────────────────────

export type AcademicChangeType =
  | "EXAM_DATE_CHANGED"
  | "EXAM_TIME_CHANGED"
  | "EXAM_ADDED"
  | "EXAM_REMOVED"
  | "TOPIC_ADDED"
  | "TOPIC_REMOVED"
  | "EVENT_ADDED"
  | "EVENT_CHANGED"
  | "EVENT_REMOVED";

export interface AcademicChange {
  type: AcademicChangeType;
  subject: string;
  field: string;
  oldValue?: string;
  newValue?: string;
  confidence: ConfidenceScore;
  description: string;
}

export interface AcademicChangeResult {
  changes: AcademicChange[];
  summary: string;
  hasSignificantChanges: boolean;
}

// ─── Quiz Generation ─────────────────────────────────────────

export type QuestionType = "mcq" | "concept" | "code_output";

export interface QuizQuestion {
  question: string;
  type: QuestionType;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface GeneratedQuiz {
  topic: string;
  subject: string;
  questions: QuizQuestion[];
  generatedAt: string; // ISO timestamp
}

// ─── Plan Explanation ────────────────────────────────────────

/** Input from the deterministic planning engine */
export interface PlanScoreInput {
  subject: string;
  score: number;
  factors: {
    examUrgency: number;
    remainingSyllabus: number;
    masteryGap: number;
    difficulty: number;
  };
  examDate?: string;
  daysUntilExam?: number;
}

export interface PlanExplanation {
  subject: string;
  explanation: string;
  keyFactors: string[];
  recommendation: string;
}

// ─── Rescue Explanation ──────────────────────────────────────

export interface RescueSessionInput {
  subject: string;
  topic: string;
  originalDate: string;
  originalDuration: string;
  redistributedSessions: Array<{
    date: string;
    duration: string;
  }>;
  reason: string;
}

export interface RescueExplanation {
  subject: string;
  explanation: string;
  impactSummary: string;
}

// ─── Generic AI Response Wrapper ─────────────────────────────

export type AIResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; retryable: boolean } };

/**
 * Helper to create a successful AIResult
 */
export function aiSuccess<T>(data: T): AIResult<T> {
  return { success: true, data };
}

/**
 * Helper to create a failed AIResult
 */
export function aiFailure<T>(code: string, message: string, retryable: boolean): AIResult<T> {
  return { success: false, error: { code, message, retryable } };
}
