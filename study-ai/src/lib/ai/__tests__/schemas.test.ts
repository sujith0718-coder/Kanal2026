/**
 * StudyAI — Schema Validation Tests
 *
 * Tests that Zod schemas correctly accept valid data
 * and reject invalid data.
 */

import { describe, it, expect } from "vitest";
import {
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
} from "../schemas";

// ─── Exam Schema ─────────────────────────────────────────────

describe("ExtractedExamSchema", () => {
  it("accepts valid exam data", () => {
    const valid = {
      subject: "Data Structures",
      examDate: "2026-10-05",
      startTime: "09:00",
      endTime: "12:00",
      sourceDocument: "exam_schedule.pdf",
      sourcePage: 2,
      confidence: 0.92,
    };
    expect(ExtractedExamSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts exam without optional fields", () => {
    const minimal = {
      subject: "Algorithms",
      examDate: "2026-10-08",
      sourceDocument: "schedule.pdf",
      confidence: 0.85,
    };
    expect(ExtractedExamSchema.safeParse(minimal).success).toBe(true);
  });

  it("rejects exam with invalid date format", () => {
    const invalid = {
      subject: "Math",
      examDate: "Oct 5, 2026", // wrong format
      sourceDocument: "schedule.pdf",
      confidence: 0.9,
    };
    expect(ExtractedExamSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects exam with confidence > 1", () => {
    const invalid = {
      subject: "Math",
      examDate: "2026-10-05",
      sourceDocument: "schedule.pdf",
      confidence: 1.5,
    };
    expect(ExtractedExamSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects exam with empty subject", () => {
    const invalid = {
      subject: "",
      examDate: "2026-10-05",
      sourceDocument: "schedule.pdf",
      confidence: 0.9,
    };
    expect(ExtractedExamSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects exam with invalid time format", () => {
    const invalid = {
      subject: "Physics",
      examDate: "2026-10-05",
      startTime: "9:00 AM", // wrong format
      sourceDocument: "schedule.pdf",
      confidence: 0.8,
    };
    expect(ExtractedExamSchema.safeParse(invalid).success).toBe(false);
  });
});

// ─── Topic Schema ────────────────────────────────────────────

describe("ExtractedTopicSchema", () => {
  it("accepts valid topic data", () => {
    const valid = {
      subject: "Data Structures",
      name: "Binary Trees",
      unit: "Unit 3",
      sourceDocument: "syllabus.pdf",
      sourcePage: 5,
      confidence: 0.88,
    };
    expect(ExtractedTopicSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects topic with empty name", () => {
    const invalid = {
      subject: "Data Structures",
      name: "",
      sourceDocument: "syllabus.pdf",
      confidence: 0.8,
    };
    expect(ExtractedTopicSchema.safeParse(invalid).success).toBe(false);
  });
});

// ─── Academic Event Schema ───────────────────────────────────

describe("ExtractedAcademicEventSchema", () => {
  it("accepts valid event data", () => {
    const valid = {
      subject: "Physics",
      eventType: "lab",
      date: "2026-09-30",
      description: "Lab session",
      sourceDocument: "timetable.pdf",
      confidence: 0.75,
    };
    expect(ExtractedAcademicEventSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts event without optional subject", () => {
    const valid = {
      eventType: "holiday",
      date: "2026-10-02",
      description: "Gandhi Jayanti",
      sourceDocument: "calendar.pdf",
      confidence: 0.99,
    };
    expect(ExtractedAcademicEventSchema.safeParse(valid).success).toBe(true);
  });
});

// ─── Full Extraction Result ──────────────────────────────────

describe("AcademicExtractionResultSchema", () => {
  it("accepts a complete extraction result", () => {
    const valid = {
      exams: [
        {
          subject: "Data Structures",
          examDate: "2026-10-05",
          sourceDocument: "exam.pdf",
          confidence: 0.92,
        },
      ],
      topics: [
        {
          subject: "Data Structures",
          name: "Binary Trees",
          sourceDocument: "syllabus.pdf",
          confidence: 0.88,
        },
      ],
      events: [],
      documentType: "exam_timetable" as const,
      rawSummary: "Semester exam schedule with 5 exams",
    };
    expect(AcademicExtractionResultSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts result with empty arrays", () => {
    const valid = {
      exams: [],
      topics: [],
      events: [],
      documentType: "unknown" as const,
      rawSummary: "Could not identify document content",
    };
    expect(AcademicExtractionResultSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects invalid document type", () => {
    const invalid = {
      exams: [],
      topics: [],
      events: [],
      documentType: "random_type",
      rawSummary: "Test",
    };
    expect(AcademicExtractionResultSchema.safeParse(invalid).success).toBe(false);
  });
});

// ─── Academic Change Schema ──────────────────────────────────

describe("AcademicChangeSchema", () => {
  it("accepts valid change", () => {
    const valid = {
      type: "EXAM_DATE_CHANGED" as const,
      subject: "Data Structures",
      field: "examDate",
      oldValue: "2026-10-08",
      newValue: "2026-10-05",
      confidence: 0.97,
      description: "Exam date moved forward by 3 days",
    };
    expect(AcademicChangeSchema.safeParse(valid).success).toBe(true);
  });
});

describe("AcademicChangeResultSchema", () => {
  it("accepts result with no changes", () => {
    const valid = {
      changes: [],
      summary: "No changes detected between the documents",
      hasSignificantChanges: false,
    };
    expect(AcademicChangeResultSchema.safeParse(valid).success).toBe(true);
  });
});

// ─── Quiz Schema ─────────────────────────────────────────────

describe("QuizQuestionSchema", () => {
  it("accepts valid MCQ question", () => {
    const valid = {
      question: "What is the time complexity of binary search?",
      type: "mcq" as const,
      options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
      correctAnswer: "O(log n)",
      explanation:
        "Binary search divides the search space in half each step, giving O(log n).",
      difficulty: "medium" as const,
    };
    expect(QuizQuestionSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects question with too-short text", () => {
    const invalid = {
      question: "Why?", // too short
      type: "mcq",
      options: ["A", "B"],
      correctAnswer: "A",
      explanation: "This is the correct answer because of reasons.",
      difficulty: "easy",
    };
    expect(QuizQuestionSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects question with no options", () => {
    const invalid = {
      question: "What is the time complexity of binary search?",
      type: "mcq",
      options: [],
      correctAnswer: "O(log n)",
      explanation: "Binary search divides the search space in half.",
      difficulty: "easy",
    };
    expect(QuizQuestionSchema.safeParse(invalid).success).toBe(false);
  });
});

describe("GeneratedQuizSchema", () => {
  it("accepts valid quiz with multiple questions", () => {
    const valid = {
      topic: "Binary Trees",
      subject: "Data Structures",
      questions: [
        {
          question: "What is a binary tree? Describe its basic structure.",
          type: "concept" as const,
          options: [
            "A tree with at most 2 children per node",
            "A tree with exactly 2 children per node",
            "A graph with no cycles",
            "A linked list with two pointers",
          ],
          correctAnswer: "A tree with at most 2 children per node",
          explanation:
            "A binary tree is a tree data structure where each node has at most two children.",
          difficulty: "easy" as const,
        },
      ],
      generatedAt: new Date().toISOString(),
    };
    expect(GeneratedQuizSchema.safeParse(valid).success).toBe(true);
  });
});

// ─── Plan Explanation Schema ─────────────────────────────────

describe("PlanScoreInputSchema", () => {
  it("accepts valid plan score input", () => {
    const valid = {
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
    };
    expect(PlanScoreInputSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects score > 100", () => {
    const invalid = {
      subject: "Math",
      score: 150,
      factors: {
        examUrgency: 50,
        remainingSyllabus: 50,
        masteryGap: 50,
        difficulty: 50,
      },
    };
    expect(PlanScoreInputSchema.safeParse(invalid).success).toBe(false);
  });
});

describe("PlanExplanationSchema", () => {
  it("accepts valid explanation output", () => {
    const valid = {
      subject: "Data Structures",
      explanation:
        "Data Structures is currently at high risk because the exam is in 6 days and several required topics remain weak.",
      keyFactors: [
        "Exam is in 6 days (high urgency)",
        "30% of syllabus still unreviewed",
      ],
      recommendation:
        "Focus on Binary Trees and Graph Traversal — these are the highest-weight remaining topics.",
    };
    expect(PlanExplanationSchema.safeParse(valid).success).toBe(true);
  });
});

// ─── Rescue Explanation Schema ───────────────────────────────

describe("RescueSessionInputSchema", () => {
  it("accepts valid rescue input", () => {
    const valid = {
      subject: "Data Structures",
      topic: "Trees",
      originalDate: "2026-10-01",
      originalDuration: "2h",
      redistributedSessions: [
        { date: "2026-10-02", duration: "1h" },
        { date: "2026-10-03", duration: "1h" },
      ],
      reason: "Student missed the session",
    };
    expect(RescueSessionInputSchema.safeParse(valid).success).toBe(true);
  });
});

describe("RescueExplanationSchema", () => {
  it("accepts valid rescue explanation output", () => {
    const valid = {
      subject: "Data Structures",
      explanation:
        "Your missed Trees session was split across Tuesday and Wednesday to stay within your daily study limit.",
      impactSummary:
        "Overall plan timeline remains on track with minimal disruption.",
    };
    expect(RescueExplanationSchema.safeParse(valid).success).toBe(true);
  });
});
