/**
 * StudyAI — Extract Academic Tests (with Gemini mocked)
 *
 * Tests the extraction pipeline with mocked Gemini responses.
 * Covers: valid extraction, invalid Gemini output, Zod validation failure.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the client module BEFORE importing the extraction module
vi.mock("server-only", () => ({}));
vi.mock("../client", () => ({
  generateFromFile: vi.fn(),
  generateText: vi.fn(),
  parseJSONResponse: vi.fn(),
}));

import { extractAcademicData, extractAcademicDataFromText } from "../extract-academic";
import { generateFromFile, generateText, parseJSONResponse } from "../client";

const mockGenerateFromFile = vi.mocked(generateFromFile);
const mockGenerateText = vi.mocked(generateText);
const mockParseJSONResponse = vi.mocked(parseJSONResponse);

// ─── Valid Extraction ────────────────────────────────────────

describe("extractAcademicData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns validated extraction for valid Gemini response", async () => {
    const mockResult = {
      exams: [
        {
          subject: "Data Structures",
          examDate: "2026-10-05",
          startTime: "09:00",
          endTime: "12:00",
          sourceDocument: "exam_schedule.pdf",
          sourcePage: 1,
          confidence: 0.95,
        },
      ],
      topics: [],
      events: [],
      documentType: "exam_timetable",
      rawSummary: "Exam schedule with 1 exam",
    };

    mockGenerateFromFile.mockResolvedValue(JSON.stringify(mockResult));
    mockParseJSONResponse.mockReturnValue(mockResult);

    const result = await extractAcademicData({
      documentName: "exam_schedule.pdf",
      fileData: "base64data",
      mimeType: "application/pdf",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.exams).toHaveLength(1);
      expect(result.data.exams[0].subject).toBe("Data Structures");
      expect(result.data.documentType).toBe("exam_timetable");
    }
  });

  it("returns error for invalid Gemini output (fails Zod)", async () => {
    const invalidResult = {
      exams: [
        {
          subject: "", // empty — fails min(1)
          examDate: "not-a-date", // fails regex
          sourceDocument: "exam.pdf",
          confidence: 2.0, // > 1
        },
      ],
      topics: [],
      events: [],
      documentType: "exam_timetable",
      rawSummary: "Test",
    };

    mockGenerateFromFile.mockResolvedValue(JSON.stringify(invalidResult));
    mockParseJSONResponse.mockReturnValue(invalidResult);

    const result = await extractAcademicData({
      documentName: "exam.pdf",
      fileData: "base64data",
      mimeType: "application/pdf",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("AI_VALIDATION_ERROR");
    }
  });

  it("returns error when Gemini throws", async () => {
    mockGenerateFromFile.mockRejectedValue(new Error("API down"));

    const result = await extractAcademicData({
      documentName: "test.pdf",
      fileData: "base64data",
      mimeType: "application/pdf",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("AI_SERVICE_ERROR");
      expect(result.error.retryable).toBe(true);
    }
  });
});

// ─── Text Extraction ─────────────────────────────────────────

describe("extractAcademicDataFromText", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns validated extraction for text input", async () => {
    const mockResult = {
      exams: [
        {
          subject: "Mathematics",
          examDate: "2026-10-10",
          sourceDocument: "pasted_text",
          confidence: 0.80,
        },
      ],
      topics: [],
      events: [],
      documentType: "exam_timetable",
      rawSummary: "Single exam date pasted",
    };

    mockGenerateText.mockResolvedValue(JSON.stringify(mockResult));
    mockParseJSONResponse.mockReturnValue(mockResult);

    const result = await extractAcademicDataFromText({
      documentName: "pasted_text",
      textContent: "Mathematics exam: October 10, 2026",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.exams[0].subject).toBe("Mathematics");
    }
  });
});
