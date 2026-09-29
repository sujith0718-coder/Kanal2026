/**
 * StudyAI — Plan & Rescue Explanation Tests (with Gemini mocked)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("../client", () => ({
  generateText: vi.fn(),
  parseJSONResponse: vi.fn(),
}));

import { explainPlanScore, explainRescue } from "../explain-plan";
import { generateText, parseJSONResponse } from "../client";

const mockGenerateText = vi.mocked(generateText);
const mockParseJSONResponse = vi.mocked(parseJSONResponse);

describe("explainPlanScore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns validated explanation for valid Gemini response", async () => {
    const mockExplanation = {
      subject: "Data Structures",
      explanation:
        "Data Structures is currently at high risk because the exam is in 6 days and several required topics remain weak.",
      keyFactors: [
        "Exam is in 6 days — very close deadline",
        "30% of syllabus still unreviewed",
      ],
      recommendation:
        "Focus on Binary Trees and Graph Traversal — the highest-weight remaining topics.",
    };

    mockGenerateText.mockResolvedValue(JSON.stringify(mockExplanation));
    mockParseJSONResponse.mockReturnValue(mockExplanation);

    const result = await explainPlanScore({
      subject: "Data Structures",
      score: 78,
      factors: {
        examUrgency: 85,
        remainingSyllabus: 70,
        masteryGap: 80,
        difficulty: 75,
      },
      examDate: "2026-10-05",
      daysUntilExam: 6,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.subject).toBe("Data Structures");
      expect(result.data.keyFactors).toHaveLength(2);
    }
  });

  it("returns error when Gemini is unavailable", async () => {
    mockGenerateText.mockRejectedValue(new Error("timeout"));

    const result = await explainPlanScore({
      subject: "Math",
      score: 50,
      factors: {
        examUrgency: 50,
        remainingSyllabus: 50,
        masteryGap: 50,
        difficulty: 50,
      },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("AI_SERVICE_ERROR");
    }
  });
});

describe("explainRescue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns validated rescue explanation", async () => {
    const mockExplanation = {
      subject: "Data Structures",
      explanation:
        "Your missed Trees session was split across Tuesday and Wednesday to stay within your daily study limit while protecting upcoming Mathematics preparation.",
      impactSummary:
        "Overall plan timeline remains on track with minimal disruption.",
    };

    mockGenerateText.mockResolvedValue(JSON.stringify(mockExplanation));
    mockParseJSONResponse.mockReturnValue(mockExplanation);

    const result = await explainRescue({
      subject: "Data Structures",
      topic: "Trees",
      originalDate: "2026-10-01",
      originalDuration: "2h",
      redistributedSessions: [
        { date: "2026-10-02", duration: "1h" },
        { date: "2026-10-03", duration: "1h" },
      ],
      reason: "Student missed the session",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.subject).toBe("Data Structures");
    }
  });
});
