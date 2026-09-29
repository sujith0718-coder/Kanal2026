/**
 * StudyAI — Quiz Generation Tests (with Gemini mocked)
 *
 * Tests quiz generation, validation, and correctAnswer-in-options check.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("../client", () => ({
  generateText: vi.fn(),
  parseJSONResponse: vi.fn(),
}));

import { generateQuiz } from "../generate-quiz";
import { generateText, parseJSONResponse } from "../client";

const mockGenerateText = vi.mocked(generateText);
const mockParseJSONResponse = vi.mocked(parseJSONResponse);

describe("generateQuiz", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns validated quiz for valid Gemini response", async () => {
    const mockQuiz = {
      topic: "Binary Trees",
      subject: "Data Structures",
      questions: [
        {
          question: "What is the maximum number of nodes at level k in a binary tree?",
          type: "mcq",
          options: ["k", "2^k", "2k", "k^2"],
          correctAnswer: "2^k",
          explanation: "At level k, a binary tree can have at most 2^k nodes.",
          difficulty: "medium",
        },
        {
          question: "Which traversal visits the root node first?",
          type: "mcq",
          options: ["Inorder", "Preorder", "Postorder", "Level-order"],
          correctAnswer: "Preorder",
          explanation: "Preorder traversal visits root, then left, then right.",
          difficulty: "easy",
        },
        {
          question: "What is the height of a complete binary tree with 15 nodes?",
          type: "concept",
          options: ["3", "4", "5", "7"],
          correctAnswer: "3",
          explanation: "Height = floor(log2(15)) = 3 (0-indexed).",
          difficulty: "hard",
        },
      ],
      generatedAt: new Date().toISOString(),
    };

    mockGenerateText.mockResolvedValue(JSON.stringify(mockQuiz));
    mockParseJSONResponse.mockReturnValue(mockQuiz);

    const result = await generateQuiz({
      topic: "Binary Trees",
      subject: "Data Structures",
      numQuestions: 3,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.questions).toHaveLength(3);
      expect(result.data.topic).toBe("Binary Trees");
    }
  });

  it("rejects quiz where correctAnswer is not in options", async () => {
    const mockQuiz = {
      topic: "Binary Trees",
      subject: "Data Structures",
      questions: [
        {
          question: "What is the maximum number of children in a binary tree node?",
          type: "mcq",
          options: ["1", "2", "3", "4"],
          correctAnswer: "Two", // NOT in options (should be "2")
          explanation: "Each node in a binary tree has at most 2 children.",
          difficulty: "easy",
        },
      ],
      generatedAt: new Date().toISOString(),
    };

    mockGenerateText.mockResolvedValue(JSON.stringify(mockQuiz));
    mockParseJSONResponse.mockReturnValue(mockQuiz);

    const result = await generateQuiz({
      topic: "Binary Trees",
      subject: "Data Structures",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("AI_VALIDATION_ERROR");
      expect(result.error.message).toContain("correctAnswer not in options");
    }
  });

  it("returns error when Gemini output fails Zod validation", async () => {
    const invalidQuiz = {
      topic: "Trees",
      subject: "DS",
      questions: [
        {
          question: "Q?", // too short
          type: "mcq",
          options: [],  // empty
          correctAnswer: "",
          explanation: "E",
          difficulty: "easy",
        },
      ],
      generatedAt: new Date().toISOString(),
    };

    mockGenerateText.mockResolvedValue(JSON.stringify(invalidQuiz));
    mockParseJSONResponse.mockReturnValue(invalidQuiz);

    const result = await generateQuiz({
      topic: "Trees",
      subject: "Data Structures",
    });

    expect(result.success).toBe(false);
  });

  it("returns error when Gemini is unavailable", async () => {
    mockGenerateText.mockRejectedValue(new Error("Service unavailable"));

    const result = await generateQuiz({
      topic: "Sorting",
      subject: "Algorithms",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("AI_SERVICE_ERROR");
    }
  });

  it("clamps numQuestions to safe range", async () => {
    const mockQuiz = {
      topic: "Test",
      subject: "Test",
      questions: [
        {
          question: "What is the purpose of testing in software development?",
          type: "concept",
          options: ["Quality", "Speed", "Cost", "None"],
          correctAnswer: "Quality",
          explanation: "Testing ensures software quality and correctness.",
          difficulty: "easy",
        },
        {
          question: "What is unit testing in software engineering?",
          type: "concept",
          options: [
            "Testing individual units",
            "Testing the whole system",
            "Testing performance",
            "Testing security",
          ],
          correctAnswer: "Testing individual units",
          explanation: "Unit testing targets individual functions or methods.",
          difficulty: "easy",
        },
      ],
      generatedAt: new Date().toISOString(),
    };

    mockGenerateText.mockResolvedValue(JSON.stringify(mockQuiz));
    mockParseJSONResponse.mockReturnValue(mockQuiz);

    // Should not crash with extreme values
    const result = await generateQuiz({
      topic: "Test",
      subject: "Test",
      numQuestions: 100, // will be clamped to 10
    });

    expect(result.success).toBe(true);
  });
});
