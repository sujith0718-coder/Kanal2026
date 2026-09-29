import {
  UserProfile,
  Subject,
  Topic,
  Exam,
  AcademicEvent,
  AcademicDocument,
  AvailabilityWindow,
  EnergyPreference,
  PlanVersion,
  StudySession,
  PlanChange,
  MasteryState,
  Quiz,
  QuizAttempt,
} from '@/types';
import { addDays, format } from 'date-fns';

export interface DatabaseStore {
  user: UserProfile;
  subjects: Subject[];
  topics: Topic[];
  exams: Exam[];
  academicEvents: AcademicEvent[];
  documents: AcademicDocument[];
  availability: AvailabilityWindow[];
  energyPreferences: EnergyPreference[];
  planVersions: PlanVersion[];
  studySessions: StudySession[];
  planChanges: PlanChange[];
  masteryStates: MasteryState[];
  quizzes: Quiz[];
  quizAttempts: QuizAttempt[];
}

const DEFAULT_USER_ID = 'user-student-demo-1';

// Dynamic reference date (today is Sept 29, 2026 or current date)
const getTodayStr = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};

const getDateStr = (offsetDays: number): string => {
  return format(addDays(new Date(), offsetDays), 'yyyy-MM-dd');
};

function createInitialStore(): DatabaseStore {
  const dsaExamDate = getDateStr(3); // 3 days away
  const mathExamDate = getDateStr(6); // 6 days away
  const coaExamDate = getDateStr(10); // 10 days away
  const oopExamDate = getDateStr(14); // 14 days away

  const user: UserProfile = {
    id: DEFAULT_USER_ID,
    name: 'Alex Rivera',
    email: 'alex.rivera@university.edu',
    dailyCapacityMinutes: 240, // 4 hours capacity
    createdAt: new Date().toISOString(),
  };

  const subjects: Subject[] = [
    { id: 'sub-dsa', userId: DEFAULT_USER_ID, name: 'Data Structures & Algorithms', code: 'CS301', color: '#EF4444', createdAt: new Date().toISOString() },
    { id: 'sub-math', userId: DEFAULT_USER_ID, name: 'Discrete Mathematics', code: 'MATH202', color: '#3B82F6', createdAt: new Date().toISOString() },
    { id: 'sub-coa', userId: DEFAULT_USER_ID, name: 'Computer Organization', code: 'CS204', color: '#10B981', createdAt: new Date().toISOString() },
    { id: 'sub-oop', userId: DEFAULT_USER_ID, name: 'Object-Oriented Programming', code: 'CS201', color: '#8B5CF6', createdAt: new Date().toISOString() },
  ];

  const topics: Topic[] = [
    // DSA
    { id: 'top-dsa-trees', subjectId: 'sub-dsa', name: 'Binary Search Trees & AVL', unit: 'Unit 3', difficulty: 'HIGH', estimatedMastery: 52, masteryStatus: 'MEDIUM', estimatedMinutesRequired: 90, completedMinutes: 0 },
    { id: 'top-dsa-graphs', subjectId: 'sub-dsa', name: 'Graph Traversal (BFS/DFS)', unit: 'Unit 4', difficulty: 'HIGH', estimatedMastery: 35, masteryStatus: 'LOW', estimatedMinutesRequired: 120, completedMinutes: 0 },
    { id: 'top-dsa-dp', subjectId: 'sub-dsa', name: 'Dynamic Programming Basics', unit: 'Unit 5', difficulty: 'HIGH', estimatedMastery: 20, masteryStatus: 'LOW', estimatedMinutesRequired: 120, completedMinutes: 0 },
    { id: 'top-dsa-arrays', subjectId: 'sub-dsa', name: 'Arrays & Linked Lists', unit: 'Unit 1', difficulty: 'LOW', estimatedMastery: 85, masteryStatus: 'HIGH', estimatedMinutesRequired: 60, completedMinutes: 60 },

    // Discrete Math
    { id: 'top-math-proofs', subjectId: 'sub-math', name: 'Mathematical Induction & Proofs', unit: 'Unit 2', difficulty: 'HIGH', estimatedMastery: 45, masteryStatus: 'LOW', estimatedMinutesRequired: 90, completedMinutes: 0 },
    { id: 'top-math-combinatorics', subjectId: 'sub-math', name: 'Combinatorics & Permutations', unit: 'Unit 3', difficulty: 'MEDIUM', estimatedMastery: 60, masteryStatus: 'MEDIUM', estimatedMinutesRequired: 90, completedMinutes: 0 },
    { id: 'top-math-logic', subjectId: 'sub-math', name: 'Propositional Logic', unit: 'Unit 1', difficulty: 'LOW', estimatedMastery: 90, masteryStatus: 'HIGH', estimatedMinutesRequired: 60, completedMinutes: 60 },

    // COA
    { id: 'top-coa-pipeline', subjectId: 'sub-coa', name: 'Pipelining & Hazards', unit: 'Unit 3', difficulty: 'HIGH', estimatedMastery: 40, masteryStatus: 'LOW', estimatedMinutesRequired: 90, completedMinutes: 0 },
    { id: 'top-coa-memory', subjectId: 'sub-coa', name: 'Cache Hierarchy & Virtual Memory', unit: 'Unit 4', difficulty: 'MEDIUM', estimatedMastery: 55, masteryStatus: 'MEDIUM', estimatedMinutesRequired: 90, completedMinutes: 0 },

    // OOP
    { id: 'top-oop-polymorphism', subjectId: 'sub-oop', name: 'Polymorphism & Abstract Classes', unit: 'Unit 2', difficulty: 'MEDIUM', estimatedMastery: 70, masteryStatus: 'MEDIUM', estimatedMinutesRequired: 60, completedMinutes: 0 },
    { id: 'top-oop-design', subjectId: 'sub-oop', name: 'Design Patterns (Factory, Singleton)', unit: 'Unit 4', difficulty: 'HIGH', estimatedMastery: 30, masteryStatus: 'LOW', estimatedMinutesRequired: 90, completedMinutes: 0 },
  ];

  const exams: Exam[] = [
    { id: 'exam-dsa', subjectId: 'sub-dsa', subjectName: 'Data Structures & Algorithms', examDate: dsaExamDate, startTime: '09:00', endTime: '12:00', sourceDocumentId: 'doc-1', sourceDocumentName: 'Midterm_Exam_Schedule_Fall2026.pdf', sourcePage: 2, confidence: 0.98, verificationStatus: 'VERIFIED' },
    { id: 'exam-math', subjectId: 'sub-math', subjectName: 'Discrete Mathematics', examDate: mathExamDate, startTime: '14:00', endTime: '16:00', sourceDocumentId: 'doc-1', sourceDocumentName: 'Midterm_Exam_Schedule_Fall2026.pdf', sourcePage: 2, confidence: 0.95, verificationStatus: 'VERIFIED' },
    { id: 'exam-coa', subjectId: 'sub-coa', subjectName: 'Computer Organization', examDate: coaExamDate, startTime: '09:00', endTime: '11:00', sourceDocumentId: 'doc-1', sourceDocumentName: 'Midterm_Exam_Schedule_Fall2026.pdf', sourcePage: 3, confidence: 0.92, verificationStatus: 'VERIFIED' },
    { id: 'exam-oop', subjectId: 'sub-oop', subjectName: 'Object-Oriented Programming', examDate: oopExamDate, startTime: '13:00', endTime: '15:00', sourceDocumentId: 'doc-1', sourceDocumentName: 'Midterm_Exam_Schedule_Fall2026.pdf', sourcePage: 3, confidence: 0.96, verificationStatus: 'VERIFIED' },
  ];

  const academicEvents: AcademicEvent[] = [
    { id: 'evt-1', userId: DEFAULT_USER_ID, subjectId: 'sub-dsa', title: 'DSA Lab Submission 2', eventType: 'DEADLINE', date: getDateStr(2), sourceDocumentId: 'doc-2', verified: true },
    { id: 'evt-2', userId: DEFAULT_USER_ID, subjectId: 'sub-math', title: 'Math Assignment 4', eventType: 'DEADLINE', date: getDateStr(5), sourceDocumentId: 'doc-2', verified: true },
  ];

  const documents: AcademicDocument[] = [
    { id: 'doc-1', userId: DEFAULT_USER_ID, filename: 'Midterm_Exam_Schedule_Fall2026.pdf', fileType: 'application/pdf', storagePath: 'documents/exam_schedule.pdf', processingState: 'processed', extractedExamsCount: 4, extractedTopicsCount: 0, extractedEventsCount: 0, uploadedAt: new Date().toISOString() },
    { id: 'doc-2', userId: DEFAULT_USER_ID, filename: 'CS301_DSA_Syllabus.pdf', fileType: 'application/pdf', storagePath: 'documents/dsa_syllabus.pdf', processingState: 'processed', extractedExamsCount: 0, extractedTopicsCount: 11, extractedEventsCount: 2, uploadedAt: new Date().toISOString() },
  ];

  // Daily availability windows (0 = Sun, 1 = Mon, ... 6 = Sat)
  const availability: AvailabilityWindow[] = [
    { id: 'av-0', userId: DEFAULT_USER_ID, dayOfWeek: 0, startTime: '10:00', endTime: '14:00', durationMinutes: 240 },
    { id: 'av-1', userId: DEFAULT_USER_ID, dayOfWeek: 1, startTime: '17:00', endTime: '21:00', durationMinutes: 240 },
    { id: 'av-2', userId: DEFAULT_USER_ID, dayOfWeek: 2, startTime: '17:00', endTime: '21:00', durationMinutes: 240 },
    { id: 'av-3', userId: DEFAULT_USER_ID, dayOfWeek: 3, startTime: '17:00', endTime: '21:00', durationMinutes: 240 },
    { id: 'av-4', userId: DEFAULT_USER_ID, dayOfWeek: 4, startTime: '17:00', endTime: '21:00', durationMinutes: 240 },
    { id: 'av-5', userId: DEFAULT_USER_ID, dayOfWeek: 5, startTime: '16:00', endTime: '20:00', durationMinutes: 240 },
    { id: 'av-6', userId: DEFAULT_USER_ID, dayOfWeek: 6, startTime: '10:00', endTime: '14:00', durationMinutes: 240 },
  ];

  const energyPreferences: EnergyPreference[] = [
    { id: 'ep-1', userId: DEFAULT_USER_ID, timeBlock: 'MORNING', energyLevel: 'HIGH' },
    { id: 'ep-2', userId: DEFAULT_USER_ID, timeBlock: 'AFTERNOON', energyLevel: 'MEDIUM' },
    { id: 'ep-3', userId: DEFAULT_USER_ID, timeBlock: 'EVENING', energyLevel: 'HIGH' },
    { id: 'ep-4', userId: DEFAULT_USER_ID, timeBlock: 'NIGHT', energyLevel: 'LOW' },
  ];

  const planVersions: PlanVersion[] = [
    { id: 'plan-v1', userId: DEFAULT_USER_ID, versionNumber: 1, trigger: 'INITIAL_PLAN', status: 'ACTIVE', createdAt: new Date().toISOString() },
  ];

  const todayStr = getTodayStr();

  const studySessions: StudySession[] = [
    // Today sessions
    { id: 'ses-1', userId: DEFAULT_USER_ID, topicId: 'top-dsa-trees', topicName: 'Binary Search Trees & AVL', subjectId: 'sub-dsa', subjectName: 'Data Structures & Algorithms', planVersionId: 'plan-v1', date: todayStr, startTime: '17:00', endTime: '17:45', durationMinutes: 45, energyRequirement: 'HIGH', status: 'PLANNED', createdAt: new Date().toISOString() },
    { id: 'ses-2', userId: DEFAULT_USER_ID, topicId: 'top-math-proofs', topicName: 'Mathematical Induction & Proofs', subjectId: 'sub-math', subjectName: 'Discrete Mathematics', planVersionId: 'plan-v1', date: todayStr, startTime: '18:00', endTime: '18:45', durationMinutes: 45, energyRequirement: 'HIGH', status: 'PLANNED', createdAt: new Date().toISOString() },
    { id: 'ses-3', userId: DEFAULT_USER_ID, topicId: 'top-dsa-graphs', topicName: 'Graph Traversal (BFS/DFS)', subjectId: 'sub-dsa', subjectName: 'Data Structures & Algorithms', planVersionId: 'plan-v1', date: todayStr, startTime: '19:00', endTime: '19:45', durationMinutes: 45, energyRequirement: 'HIGH', status: 'PLANNED', createdAt: new Date().toISOString() },

    // Tomorrow (Day +1) sessions
    { id: 'ses-4', userId: DEFAULT_USER_ID, topicId: 'top-dsa-trees', topicName: 'Binary Search Trees & AVL', subjectId: 'sub-dsa', subjectName: 'Data Structures & Algorithms', planVersionId: 'plan-v1', date: getDateStr(1), startTime: '17:00', endTime: '17:45', durationMinutes: 45, energyRequirement: 'HIGH', status: 'PLANNED', createdAt: new Date().toISOString() },
    { id: 'ses-5', userId: DEFAULT_USER_ID, topicId: 'top-dsa-graphs', topicName: 'Graph Traversal (BFS/DFS)', subjectId: 'sub-dsa', subjectName: 'Data Structures & Algorithms', planVersionId: 'plan-v1', date: getDateStr(1), startTime: '18:00', endTime: '18:45', durationMinutes: 45, energyRequirement: 'HIGH', status: 'PLANNED', createdAt: new Date().toISOString() },
    { id: 'ses-6', userId: DEFAULT_USER_ID, topicId: 'top-math-combinatorics', topicName: 'Combinatorics & Permutations', subjectId: 'sub-math', subjectName: 'Discrete Mathematics', planVersionId: 'plan-v1', date: getDateStr(1), startTime: '19:00', endTime: '19:45', durationMinutes: 45, energyRequirement: 'MEDIUM', status: 'PLANNED', createdAt: new Date().toISOString() },

    // Day +2 sessions
    { id: 'ses-7', userId: DEFAULT_USER_ID, topicId: 'top-dsa-dp', topicName: 'Dynamic Programming Basics', subjectId: 'sub-dsa', subjectName: 'Data Structures & Algorithms', planVersionId: 'plan-v1', date: getDateStr(2), startTime: '17:00', endTime: '18:00', durationMinutes: 60, energyRequirement: 'HIGH', status: 'PLANNED', createdAt: new Date().toISOString() },
    { id: 'ses-8', userId: DEFAULT_USER_ID, topicId: 'top-coa-pipeline', topicName: 'Pipelining & Hazards', subjectId: 'sub-coa', subjectName: 'Computer Organization', planVersionId: 'plan-v1', date: getDateStr(2), startTime: '18:15', endTime: '19:00', durationMinutes: 45, energyRequirement: 'HIGH', status: 'PLANNED', createdAt: new Date().toISOString() },
  ];

  const planChanges: PlanChange[] = [];

  const masteryStates: MasteryState[] = [
    { id: 'ms-1', userId: DEFAULT_USER_ID, topicId: 'top-dsa-trees', score: 52, status: 'MEDIUM', lastUpdated: new Date().toISOString() },
    { id: 'ms-2', userId: DEFAULT_USER_ID, topicId: 'top-dsa-graphs', score: 35, status: 'LOW', lastUpdated: new Date().toISOString() },
    { id: 'ms-3', userId: DEFAULT_USER_ID, topicId: 'top-dsa-dp', score: 20, status: 'LOW', lastUpdated: new Date().toISOString() },
    { id: 'ms-4', userId: DEFAULT_USER_ID, topicId: 'top-math-proofs', score: 45, status: 'LOW', lastUpdated: new Date().toISOString() },
    { id: 'ms-5', userId: DEFAULT_USER_ID, topicId: 'top-coa-pipeline', score: 40, status: 'LOW', lastUpdated: new Date().toISOString() },
  ];

  const quizzes: Quiz[] = [
    {
      id: 'quiz-dsa-trees-1',
      topicId: 'top-dsa-trees',
      topicName: 'Binary Search Trees & AVL',
      title: '2-Minute Mastery Check: BST & AVL Rotation',
      questions: [
        {
          id: 'q1',
          question: 'What is the worst-case time complexity of searching an unbalanced Binary Search Tree with N nodes?',
          options: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'],
          correctAnswer: 'O(N)',
          explanation: 'In the worst case, an unbalanced BST degenerates into a single linked list, resulting in O(N) search time.',
        },
        {
          id: 'q2',
          question: 'In an AVL Tree, what balance factor triggers a Left-Right (LR) double rotation?',
          options: ['Node is heavy (+2) and its left child is right-heavy (-1)', 'Node is right-heavy (-2) and left child is left-heavy (+1)', 'Node balance factor is 0', 'Left child balance factor is +2'],
          correctAnswer: 'Node is heavy (+2) and its left child is right-heavy (-1)',
          explanation: 'An LR rotation is performed when a node has a balance factor of +2 and its left subtree is right-heavy (-1).',
        },
        {
          id: 'q3',
          question: 'Which tree traversal algorithm outputs the elements of a BST in strictly sorted ascending order?',
          options: ['Pre-order traversal', 'In-order traversal', 'Post-order traversal', 'Level-order traversal'],
          correctAnswer: 'In-order traversal',
          explanation: 'In-order traversal (Left, Root, Right) yields the key values in non-decreasing order for any valid BST.',
        },
      ],
      createdAt: new Date().toISOString(),
    },
  ];

  const quizAttempts: QuizAttempt[] = [];

  return {
    user,
    subjects,
    topics,
    exams,
    academicEvents,
    documents,
    availability,
    energyPreferences,
    planVersions,
    studySessions,
    planChanges,
    masteryStates,
    quizzes,
    quizAttempts,
  };
}

let globalStore: DatabaseStore | null = null;

export function getMockStore(): DatabaseStore {
  if (!globalStore) {
    globalStore = createInitialStore();
  }
  return globalStore;
}

export function resetMockStore(): DatabaseStore {
  globalStore = createInitialStore();
  return globalStore;
}
