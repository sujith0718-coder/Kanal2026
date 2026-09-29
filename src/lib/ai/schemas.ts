import { z } from 'zod';

export const ExtractedExamSchema = z.object({
  subject: z.string(),
  examDate: z.string(), // YYYY-MM-DD
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  sourceDocument: z.string().optional(),
  sourcePage: z.number().optional(),
  confidence: z.number().min(0).max(1).default(0.95),
});

export const ExtractedSyllabusTopicSchema = z.object({
  subject: z.string(),
  topicName: z.string(),
  unit: z.string().optional(),
  difficulty: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  estimatedMinutesRequired: z.number().default(90),
});

export const ExtractedAcademicNoticeSchema = z.object({
  title: z.string(),
  subject: z.string().optional(),
  eventType: z.enum(['EXAM', 'DEADLINE', 'HOLIDAY', 'LECTURE']).default('DEADLINE'),
  date: z.string(), // YYYY-MM-DD
  source: z.string().optional(),
  confidence: z.number().default(0.9),
});

export const AcademicExtractionResultSchema = z.object({
  exams: z.array(ExtractedExamSchema),
  topics: z.array(ExtractedSyllabusTopicSchema),
  events: z.array(ExtractedAcademicNoticeSchema),
  summary: z.string(),
});

export const QuizQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).min(2),
  correctAnswer: z.string(),
  explanation: z.string(),
});

export const GeneratedQuizSchema = z.object({
  topic: z.string(),
  title: z.string(),
  questions: z.array(QuizQuestionSchema).min(1),
});

export const PlanExplanationSchema = z.object({
  summary: z.string(),
  keyChanges: z.array(z.string()),
  reassurance: z.string(),
});
