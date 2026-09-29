/**
 * StudyAI — AI Error Types
 *
 * Typed error hierarchy for all AI operations.
 * These errors are returned (not thrown unexpectedly) so the
 * application can degrade gracefully when Gemini is unavailable.
 */

/** Base class for all AI-related errors */
export class AIError extends Error {
  public readonly code: string;
  public readonly retryable: boolean;
  public readonly timestamp: string;

  constructor(message: string, code: string, retryable: boolean) {
    super(message);
    this.name = "AIError";
    this.code = code;
    this.retryable = retryable;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      retryable: this.retryable,
      timestamp: this.timestamp,
    };
  }
}

/** Gemini API returned an error (5xx, network failure, etc.) */
export class AIServiceError extends AIError {
  public readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message, "AI_SERVICE_ERROR", true);
    this.name = "AIServiceError";
    this.statusCode = statusCode;
  }
}

/** Gemini returned unparseable / malformed JSON */
export class AIParseError extends AIError {
  public readonly rawOutput?: string;

  constructor(message: string, rawOutput?: string) {
    super(message, "AI_PARSE_ERROR", true);
    this.name = "AIParseError";
    this.rawOutput = rawOutput?.slice(0, 500); // truncate for safety
  }
}

/** Gemini output parsed as JSON but failed Zod validation */
export class AIValidationError extends AIError {
  public readonly validationIssues: Array<{ path: string; message: string }>;

  constructor(
    message: string,
    issues: Array<{ path: string; message: string }>
  ) {
    super(message, "AI_VALIDATION_ERROR", true);
    this.name = "AIValidationError";
    this.validationIssues = issues;
  }
}

/** API quota exceeded — do NOT retry immediately */
export class AIQuotaError extends AIError {
  constructor(message: string = "Gemini API quota exceeded") {
    super(message, "AI_QUOTA_ERROR", false);
    this.name = "AIQuotaError";
  }
}

/** Request timed out */
export class AITimeoutError extends AIError {
  public readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`Gemini request timed out after ${timeoutMs}ms`, "AI_TIMEOUT_ERROR", true);
    this.name = "AITimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

/** API key is missing or invalid */
export class AIConfigError extends AIError {
  constructor(message: string = "Gemini API key is not configured") {
    super(message, "AI_CONFIG_ERROR", false);
    this.name = "AIConfigError";
  }
}

/**
 * Type guard: is this an AIError?
 */
export function isAIError(error: unknown): error is AIError {
  return error instanceof AIError;
}

/**
 * Utility: wrap unknown errors into AIError
 */
export function toAIError(error: unknown): AIError {
  if (error instanceof AIError) return error;

  if (error instanceof Error) {
    // Detect quota errors from Gemini SDK
    if (
      error.message.includes("429") ||
      error.message.toLowerCase().includes("quota")
    ) {
      return new AIQuotaError(error.message);
    }

    return new AIServiceError(error.message);
  }

  return new AIServiceError(String(error));
}
