import { Exam, Subject, AcademicChangeComparison } from '@/types';

export interface ExtractedExamInput {
  subjectName: string;
  examDate: string; // YYYY-MM-DD
}

export function compareAcademicExams(
  existingExams: Exam[],
  subjects: Subject[],
  newExtractedExams: ExtractedExamInput[]
): AcademicChangeComparison {
  const changes: AcademicChangeComparison['changes'] = [];

  const subjectMapByName = new Map<string, Subject>();
  subjects.forEach((s) => {
    subjectMapByName.set(s.name.toLowerCase().trim(), s);
    if (s.code) subjectMapByName.set(s.code.toLowerCase().trim(), s);
  });

  for (const newExam of newExtractedExams) {
    const normalizedName = newExam.subjectName.toLowerCase().trim();
    const matchedSubject = subjectMapByName.get(normalizedName);

    if (matchedSubject) {
      const existingExam = existingExams.find((e) => e.subjectId === matchedSubject.id);

      if (existingExam) {
        if (existingExam.examDate !== newExam.examDate) {
          changes.push({
            type: 'EXAM_DATE_MOVED',
            subjectName: matchedSubject.name,
            oldDate: existingExam.examDate,
            newDate: newExam.examDate,
            description: `${matchedSubject.name} exam date moved from ${existingExam.examDate} to ${newExam.examDate}.`,
          });
        }
      } else {
        changes.push({
          type: 'NEW_EXAM',
          subjectName: matchedSubject.name,
          newDate: newExam.examDate,
          description: `New exam detected for ${matchedSubject.name} on ${newExam.examDate}.`,
        });
      }
    }
  }

  return {
    changed: changes.length > 0,
    changes,
    requiresReplan: changes.length > 0,
  };
}
