/**
 * StudyAI — Client & Error Tests
 *
 * Tests the JSON parsing helper, error types, and error utilities.
 * Gemini API calls are mocked — no real API calls.
 */

import { describe, it, expect, vi } from "vitest";

// Mock server-only since we're in a test environment
vi.mock("server-only", () => ({}));

import {
  AIError,
  AIServiceError,
  AIParseError,
  AIValidationError,
  AIQuotaError,
  AITimeoutError,
  AIConfigError,
  isAIError,
  toAIError,
} from "../errors";
import { parseJSONResponse } from "../client";

// ─── Error Types ─────────────────────────────────────────────

describe("AIError hierarchy", () => {
  it("AIServiceError has correct properties", () => {
    const err = new AIServiceError("API failed", 500);
    expect(err.code).toBe("AI_SERVICE_ERROR");
    expect(err.retryable).toBe(true);
    expect(err.statusCode).toBe(500);
    expect(err).toBeInstanceOf(AIError);
    expect(err).toBeInstanceOf(Error);
  });

  it("AIParseError truncates raw output", () => {
    const longOutput = "x".repeat(1000);
    const err = new AIParseError("parse failed", longOutput);
    expect(err.rawOutput?.length).toBe(500);
  });

  it("AIValidationError carries issues", () => {
    const err = new AIValidationError("validation failed", [
      { path: "exams.0.subject", message: "Required" },
    ]);
    expect(err.validationIssues).toHaveLength(1);
    expect(err.code).toBe("AI_VALIDATION_ERROR");
    expect(err.retryable).toBe(true);
  });

  it("AIQuotaError is not retryable", () => {
    const err = new AIQuotaError();
    expect(err.retryable).toBe(false);
    expect(err.code).toBe("AI_QUOTA_ERROR");
  });

  it("AITimeoutError has correct timeout", () => {
    const err = new AITimeoutError(30000);
    expect(err.timeoutMs).toBe(30000);
    expect(err.retryable).toBe(true);
  });

  it("AIConfigError is not retryable", () => {
    const err = new AIConfigError();
    expect(err.retryable).toBe(false);
  });

  it("toJSON produces clean serialization", () => {
    const err = new AIServiceError("test error");
    const json = err.toJSON();
    expect(json).toHaveProperty("name", "AIServiceError");
    expect(json).toHaveProperty("code", "AI_SERVICE_ERROR");
    expect(json).toHaveProperty("message", "test error");
    expect(json).toHaveProperty("retryable", true);
    expect(json).toHaveProperty("timestamp");
  });
});

// ─── Error Guards ────────────────────────────────────────────

describe("isAIError", () => {
  it("returns true for AIError instances", () => {
    expect(isAIError(new AIServiceError("test"))).toBe(true);
    expect(isAIError(new AIParseError("test"))).toBe(true);
    expect(isAIError(new AIQuotaError())).toBe(true);
  });

  it("returns false for regular errors", () => {
    expect(isAIError(new Error("test"))).toBe(false);
    expect(isAIError("string error")).toBe(false);
    expect(isAIError(null)).toBe(false);
  });
});

describe("toAIError", () => {
  it("passes through existing AIErrors", () => {
    const original = new AIQuotaError();
    expect(toAIError(original)).toBe(original);
  });

  it("detects quota errors from message", () => {
    const err = new Error("Request failed with status 429");
    const wrapped = toAIError(err);
    expect(wrapped).toBeInstanceOf(AIQuotaError);
  });

  it("wraps regular errors as AIServiceError", () => {
    const err = new Error("Connection refused");
    const wrapped = toAIError(err);
    expect(wrapped).toBeInstanceOf(AIServiceError);
    expect(wrapped.message).toBe("Connection refused");
  });

  it("wraps non-Error values", () => {
    const wrapped = toAIError("string error");
    expect(wrapped).toBeInstanceOf(AIServiceError);
    expect(wrapped.message).toBe("string error");
  });
});

// ─── JSON Parsing ────────────────────────────────────────────

describe("parseJSONResponse", () => {
  it("parses clean JSON", () => {
    const result = parseJSONResponse('{"key": "value"}');
    expect(result).toEqual({ key: "value" });
  });

  it("strips markdown code fences", () => {
    const result = parseJSONResponse('```json\n{"key": "value"}\n```');
    expect(result).toEqual({ key: "value" });
  });

  it("strips generic code fences", () => {
    const result = parseJSONResponse('```\n{"key": "value"}\n```');
    expect(result).toEqual({ key: "value" });
  });

  it("handles whitespace around JSON", () => {
    const result = parseJSONResponse('  \n {"key": "value"} \n ');
    expect(result).toEqual({ key: "value" });
  });

  it("throws AIParseError for invalid JSON", () => {
    expect(() => parseJSONResponse("not json at all")).toThrow(AIParseError);
  });

  it("throws AIParseError for empty string", () => {
    expect(() => parseJSONResponse("")).toThrow(AIParseError);
  });

  it("parses arrays", () => {
    const result = parseJSONResponse('[1, 2, 3]');
    expect(result).toEqual([1, 2, 3]);
  });
});
