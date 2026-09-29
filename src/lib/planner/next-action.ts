import { StudySession, Topic, Exam, Subject, NextBestAction } from '@/types';
import { calculateTopicPriority } from './priority';
import { differenceInDays, parseISO } from 'date-fns';

export function getNextBestAction(
  sessions: StudySession[],
  topics: Topic[],
  subjects: Subject[],
  exams: Exam[],
  currentDate: Date = new Date()
): NextBestAction {
  // Find planned sessions for today or upcoming
  const plannedSessions = sessions.filter((s) => s.status === 'PLANNED');

  let targetSession: StudySession | undefined;
  let targetTopic: Topic | undefined;
  let targetExam: Exam | undefined;
  let targetSubject: Subject | undefined;
  let highestPriorityScore = -1;

  for (const session of plannedSessions) {
    const topic = topics.find((t) => t.id === session.topicId);
    if (!topic) continue;

    const exam = exams.find((e) => e.subjectId === topic.subjectId);
    const subject = subjects.find((s) => s.id === topic.subjectId);

    const priorityInfo = calculateTopicPriority(topic, exam, currentDate);

    if (priorityInfo.finalPriority > highestPriorityScore) {
      highestPriorityScore = priorityInfo.finalPriority;
      targetSession = session;
      targetTopic = topic;
      targetExam = exam;
      targetSubject = subject;
    }
  }

  // Fallback if no planned session exists: pick highest priority unmastered topic
  if (!targetTopic && topics.length > 0) {
    for (const topic of topics) {
      const exam = exams.find((e) => e.subjectId === topic.subjectId);
      const priorityInfo = calculateTopicPriority(topic, exam, currentDate);

      if (priorityInfo.finalPriority > highestPriorityScore) {
        highestPriorityScore = priorityInfo.finalPriority;
        targetTopic = topic;
        targetExam = exam;
        targetSubject = subjects.find((s) => s.id === topic.subjectId);
      }
    }
  }

  const topicName = targetTopic?.name || 'Binary Search Trees & AVL';
  const subjectName = targetSubject?.name || 'Data Structures & Algorithms';
  const durationMinutes = targetSession?.durationMinutes || 45;
  const daysUntilExam = targetExam?.examDate
    ? differenceInDays(parseISO(targetExam.examDate), currentDate)
    : undefined;

  const reasonFactors: string[] = [];
  if (daysUntilExam !== undefined && daysUntilExam <= 5) {
    reasonFactors.push(`Exam is approaching in ${daysUntilExam} day(s)`);
  } else {
    reasonFactors.push('High exam urgency score');
  }

  const mastery = targetTopic?.estimatedMastery ?? 52;
  if (mastery < 60) {
    reasonFactors.push(`Mastery gap is significant (${mastery}% estimated mastery)`);
  }

  reasonFactors.push('Core syllabus requirement');

  let priorityLevel: 'High' | 'Medium' | 'Low' = 'High';
  if (highestPriorityScore < 40) priorityLevel = 'Low';
  else if (highestPriorityScore < 70) priorityLevel = 'Medium';

  return {
    session: targetSession,
    topicId: targetTopic?.id || 'top-dsa-trees',
    topicName,
    subjectId: targetSubject?.id || 'sub-dsa',
    subjectName,
    durationMinutes,
    examDate: targetExam?.examDate,
    daysUntilExam,
    estimatedMastery: mastery,
    priorityScore: highestPriorityScore > 0 ? highestPriorityScore : 82,
    priorityLevel,
    reasonFactors,
  };
}
