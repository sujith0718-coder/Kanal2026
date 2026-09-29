/**
 * StudyAI — Academic Change Interpretation Tests (with Gemini mocked)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("../client", () => ({
  generateText: vi.fn(),
  parseJSONResponse: vi.fn(),
}));

import { interpretAcademicChanges } from "../interpret-change";
import { generateText, parseJSONResponse } from "../client";
import type { AcademicExtractionResult } from "../types";

const mockGenerateText = vi.mocked(generateText);
const mockParseJSONResponse = vi.mocked(parseJSONResponse);

const existingData: AcademicExtractionResult = {
  exams: [
    {
      subject: "Data Structures",
      examDate: "2026-10-08",
      sourceDocument: "old_schedule.pdf",
      confidence: 0.92,
    },
  ],
  topics: [],
  events: [],
  documentType: "exam_timetable",
  rawSummary: "Original schedule",
};

const newData: AcademicExtractionResult = {
  exams: [
    {
      subject: "Data Structures",
      examDate: "2026-10-05",
      sourceDocument: "new_schedule.pdf",
      confidence: 0.95,
    },
  ],
  topics: [],
  events: [],
  documentType: "exam_timetable",
  rawSummary: "Updated schedule",
};

describe("interpretAcademicChanges", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns validated changes for date change", async () => {
    const mockChanges = {
      changes: [
        {
          type: "EXAM_DATE_CHANGED",
          subject: "Data Structures",
          field: "examDate",
          oldValue: "2026-10-08",
          newValue: "2026-10-05",
          confidence: 0.97,
          description: "Data Structures exam moved from Oct 8 to Oct 5",
        },
      ],
      summary: "One exam date was changed",
      hasSignificantChanges: true,
    };

    mockGenerateText.mockResolvedValue(JSON.stringify(mockChanges));
    mockParseJSONResponse.mockReturnValue(mockChanges);

    const result = await interpretAcademicChanges({
      existingData,
      newData,
      documentName: "new_schedule.pdf",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.changes).toHaveLength(1);
      expect(result.data.changes[0].type).toBe("EXAM_DATE_CHANGED");
      expect(result.data.hasSignificantChanges).toBe(true);
    }
  });

  it("returns no changes when documents are identical", async () => {
    const mockChanges = {
      changes: [],
      summary: "No changes detected",
      hasSignificantChanges: false,
    };

    mockGenerateText.mockResolvedValue(JSON.stringify(mockChanges));
    mockParseJSONResponse.mockReturnValue(mockChanges);

    const result = await interpretAcademicChanges({
      existingData,
      newData: existingData,
      documentName: "same_schedule.pdf",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.changes).toHaveLength(0);
      expect(result.data.hasSignificantChanges).toBe(false);
    }
  });

  it("returns error when Gemini fails", async () => {
    mockGenerateText.mockRejectedValue(new Error("Network error"));

    const result = await interpretAcademicChanges({
      existingData,
      newData,
      documentName: "new.pdf",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("AI_SERVICE_ERROR");
    }
  });
});
