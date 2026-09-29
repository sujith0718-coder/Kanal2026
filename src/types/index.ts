export type DifficultyLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type MasteryStatus = 'UNKNOWN' | 'LOW' | 'MEDIUM' | 'HIGH';
export type VerificationStatus = 'UNVERIFIED' | 'VERIFIED' | 'NEEDS_REVIEW';
export type DocumentProcessingState = 'uploaded' | 'processing' | 'processed' | 'failed';
export type EnergyTimeBlock = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';
export type SessionStatus = 'PLANNED' | 'COMPLETED' | 'MISSED' | 'SKIPPED';
export type PlanTrigger = 'INITIAL_PLAN' | 'SESSION_MISSED' | 'ACADEMIC_CHANGE' | 'MANUAL_REPLAN';
export type ChangeType = 'MOVED' | 'SPLIT' | 'DEFERRED' | 'PROTECTED' | 'REMOVED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type FeasibilityState = 'GREEN' | 'YELLOW' | 'RED';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  dailyCapacityMinutes: number; // e.g. 240 mins (4h)
  createdAt: string;
}

export interface Subject {
  id: string;
  userId: string;
  name: string;
  code?: string;
  color?: string;
  createdAt: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  unit?: string;
  difficulty: DifficultyLevel;
  estimatedMastery: number; // 0 - 100
  masteryStatus: MasteryStatus;
  estimatedMinutesRequired: number; // e.g., 90 mins total work required
  completedMinutes: number;
}

export interface Exam {
  id: string;
  subjectId: string;
  subjectName?: string;
  examDate: string; // ISO date format YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string;
  sourceDocumentId?: string;
  sourceDocumentName?: string;
  sourcePage?: number;
  confidence: number; // 0.0 to 1.0
  verificationStatus: VerificationStatus;
}

export interface AcademicEvent {
  id: string;
  userId: string;
  subjectId?: string;
  title: string;
  eventType: 'EXAM' | 'DEADLINE' | 'HOLIDAY' | 'LECTURE';
  date: string; // YYYY-MM-DD
  sourceDocumentId?: string;
  verified: boolean;
}

export interface AcademicDocument {
  id: string;
  userId: string;
  filename: string;
  fileType: string;
  storagePath: string;
  processingState: DocumentProcessingState;
  uploadedAt: string;
  extractedExamsCount?: number;
  extractedTopicsCount?: number;
  extractedEventsCount?: number;
}

export interface AvailabilityWindow {
  id: string;
  userId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  startTime: string; // "18:00"
  endTime: string; // "21:00"
  durationMinutes: number;
}

export interface EnergyPreference {
  id: string;
  userId: string;
  timeBlock: EnergyTimeBlock;
  energyLevel: DifficultyLevel; // HIGH, MEDIUM, LOW
}

export interface PlanVersion {
  id: string;
  userId: string;
  versionNumber: number;
  trigger: PlanTrigger;
  createdAt: string;
  status: 'ACTIVE' | 'ARCHIVED';
}

export interface StudySession {
  id: string;
  userId: string;
  topicId: string;
  topicName?: string;
  subjectId?: string;
  subjectName?: string;
  planVersionId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "18:00"
  endTime: string; // "18:45"
  durationMinutes: number;
  energyRequirement: DifficultyLevel;
  status: SessionStatus;
  actualDuration?: number;
  createdAt: string;
}

export interface PlanChange {
  id: string;
  planVersionId: string;
  changeType: ChangeType;
  description: string;
  oldSessionId?: string;
  newSessionIds?: string[];
  reason: string;
}

export interface MasteryState {
  id: string;
  userId: string;
  topicId: string;
  score: number; // 0 - 100
  status: MasteryStatus;
  lastUpdated: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface Quiz {
  id: string;
  topicId: string;
  topicName?: string;
  studySessionId?: string;
  title: string;
  questions: QuizQuestion[];
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number; // percentage (0-100)
  correctAnswersCount: number;
  totalQuestions: number;
  userAnswers: Record<string, string>; // questionId -> selected answer
  answeredAt: string;
}

export interface FeasibilityResult {
  feasible: boolean;
  state: FeasibilityState; // GREEN, YELLOW, RED
  requiredMinutes: number;
  availableMinutes: number;
  deficitMinutes: number;
  explanation: string;
  protectedTopicIds: string[];
  deferredTopicIds: string[];
}

export interface PriorityFactors {
  examUrgency: number; // 0 - 100
  remainingSyllabus: number; // 0 - 100
  masteryGap: number; // 0 - 100
  difficulty: number; // 0 - 100
  finalPriority: number; // 0 - 100
}

export interface ExamRiskFactors {
  examUrgency: number;
  remainingSyllabus: number;
  masteryGap: number;
  difficulty: number;
}

export interface ExamRiskResult {
  subjectId: string;
  subjectName: string;
  score: number; // 0 - 100
  level: RiskLevel; // LOW, MEDIUM, HIGH
  factors: ExamRiskFactors;
  reason: string;
  aiExplanation?: string;
}

export interface NextBestAction {
  session?: StudySession;
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  durationMinutes: number;
  examDate?: string;
  daysUntilExam?: number;
  estimatedMastery: number;
  priorityScore: number;
  priorityLevel: 'High' | 'Medium' | 'Low';
  reasonFactors: string[];
}

export interface RescueResult {
  originalPlanId: string;
  newPlanId: string;
  newVersionNumber: number;
  changes: PlanChange[];
  feasibility: FeasibilityResult;
  message: string;
  aiExplanation?: string;
}

export interface AcademicChangeComparison {
  changed: boolean;
  changes: Array<{
    type: 'EXAM_DATE_MOVED' | 'NEW_EXAM' | 'REMOVED_EXAM';
    subjectName: string;
    oldDate?: string;
    newDate?: string;
    description: string;
  }>;
  requiresReplan: boolean;
}
