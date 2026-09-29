/**
 * StudyAI — Centralized Prompt Templates
 *
 * All Gemini prompts live here. Never scatter prompts
 * across components or API routes.
 *
 * Each prompt is a function that accepts structured input
 * and returns the final prompt string.
 */

// ─── Academic Extraction ─────────────────────────────────────

export const ACADEMIC_EXTRACTION_PROMPT = (documentName: string) => `
You are an academic document parser for a study planning application.

Analyze the provided academic document and extract ALL structured information.

Document name: "${documentName}"

You MUST return valid JSON with this exact structure:
{
  "exams": [
    {
      "subject": "Full subject name",
      "examDate": "YYYY-MM-DD",
      "startTime": "HH:mm or null",
      "endTime": "HH:mm or null",
      "sourceDocument": "${documentName}",
      "sourcePage": page_number_or_null,
      "confidence": 0.0_to_1.0
    }
  ],
  "topics": [
    {
      "subject": "Full subject name",
      "name": "Topic name",
      "unit": "Unit/Module name or null",
      "sourceDocument": "${documentName}",
      "sourcePage": page_number_or_null,
      "confidence": 0.0_to_1.0
    }
  ],
  "events": [
    {
      "subject": "Subject name or null",
      "eventType": "lecture|lab|tutorial|holiday|deadline|other",
      "date": "YYYY-MM-DD",
      "description": "Brief description or null",
      "sourceDocument": "${documentName}",
      "sourcePage": page_number_or_null,
      "confidence": 0.0_to_1.0
    }
  ],
  "documentType": "exam_timetable|syllabus|college_timetable|academic_notice|unknown",
  "rawSummary": "Brief summary of what this document contains"
}

RULES:
1. Extract EVERY exam, topic, and event found in the document.
2. Use ISO date format YYYY-MM-DD for all dates.
3. Use 24-hour format HH:mm for times.
4. Set confidence based on how clearly the information was stated:
   - 0.90-1.00: Clearly and unambiguously stated
   - 0.70-0.89: Reasonably clear but some interpretation needed
   - 0.50-0.69: Ambiguous, inferred, or partially visible
   - Below 0.50: Very uncertain — still include but flag low confidence
5. Always include sourceDocument and sourcePage when identifiable.
6. If a year is not specified, assume the current academic year.
7. Return ONLY valid JSON. No markdown, no explanation, no wrapping.
`;

// ─── Quiz Generation ─────────────────────────────────────────

export const QUIZ_GENERATION_PROMPT = (
  topic: string,
  subject: string,
  numQuestions: number,
  context?: string
) => `
You are an academic quiz generator for a study planning application.

Generate exactly ${numQuestions} quiz questions for the following:
Subject: ${subject}
Topic: ${topic}
${context ? `Additional context: ${context}` : ""}

You MUST return valid JSON with this exact structure:
{
  "topic": "${topic}",
  "subject": "${subject}",
  "questions": [
    {
      "question": "Clear, unambiguous question text",
      "type": "mcq|concept|code_output",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "The exact text of the correct option",
      "explanation": "Detailed explanation of why this answer is correct",
      "difficulty": "easy|medium|hard"
    }
  ],
  "generatedAt": "${new Date().toISOString()}"
}

RULES:
1. Generate EXACTLY ${numQuestions} questions.
2. Each question MUST have exactly one correct answer.
3. The correctAnswer MUST exactly match one of the options.
4. Avoid ambiguous questions with multiple defensible answers.
5. Vary difficulty: include a mix of easy, medium, and hard.
6. For "code_output" type, ensure the code is syntactically correct and has one clearly correct output.
7. Explanations should teach, not just state the answer.
8. Stay strictly within the specified topic and subject.
9. Do not use facts that cannot be verified from standard curricula.
10. Return ONLY valid JSON. No markdown, no explanation, no wrapping.
`;

// ─── Plan Explanation ────────────────────────────────────────

export const PLAN_EXPLANATION_PROMPT = (
  subject: string,
  score: number,
  factors: {
    examUrgency: number;
    remainingSyllabus: number;
    masteryGap: number;
    difficulty: number;
  },
  examDate?: string,
  daysUntilExam?: number
) => `
You are a study advisor explaining a risk assessment to a student.

The deterministic planning engine has calculated the following risk score:

Subject: ${subject}
Overall Risk Score: ${score}/100
${examDate ? `Exam Date: ${examDate}` : ""}
${daysUntilExam !== undefined ? `Days Until Exam: ${daysUntilExam}` : ""}

Factor Breakdown:
- Exam Urgency: ${factors.examUrgency}/100
- Remaining Syllabus: ${factors.remainingSyllabus}/100
- Mastery Gap: ${factors.masteryGap}/100
- Difficulty: ${factors.difficulty}/100

You MUST return valid JSON with this exact structure:
{
  "subject": "${subject}",
  "explanation": "A clear, empathetic 2-3 sentence explanation of what this risk score means for the student",
  "keyFactors": ["Factor 1 explanation", "Factor 2 explanation"],
  "recommendation": "A brief, actionable recommendation"
}

RULES:
1. Do NOT change or recalculate the score. The score is ${score} — that is final.
2. Explain in plain language what the numbers mean.
3. Be encouraging but honest.
4. Focus on the highest-impact factors.
5. The recommendation should be specific and actionable.
6. Return ONLY valid JSON. No markdown, no explanation, no wrapping.
`;

// ─── Rescue Explanation ──────────────────────────────────────

export const RESCUE_EXPLANATION_PROMPT = (
  subject: string,
  topic: string,
  originalDate: string,
  originalDuration: string,
  redistributedSessions: Array<{ date: string; duration: string }>,
  reason: string
) => `
You are a study advisor explaining schedule changes to a student.

The deterministic rescue engine has redistributed a missed study session:

Subject: ${subject}
Topic: ${topic}
Original Session: ${originalDate}, ${originalDuration}
Reason for Rescue: ${reason}

New Schedule:
${redistributedSessions.map((s) => `- ${s.date}: ${s.duration}`).join("\n")}

You MUST return valid JSON with this exact structure:
{
  "subject": "${subject}",
  "explanation": "A clear, reassuring 2-3 sentence explanation of what changed and why",
  "impactSummary": "Brief summary of how this affects the overall study plan"
}

RULES:
1. Do NOT suggest different dates or durations. The redistribution is final.
2. Explain the change in plain, encouraging language.
3. Reassure the student that the plan has been adjusted intelligently.
4. Be concise — this appears in a notification or card.
5. Return ONLY valid JSON. No markdown, no explanation, no wrapping.
`;

// ─── Academic Change Interpretation ──────────────────────────

export const ACADEMIC_CHANGE_PROMPT = (
  existingData: string,
  newData: string,
  documentName: string
) => `
You are an academic document change detector for a study planning application.

Compare the existing academic data with newly extracted data and identify changes.

Existing Data:
${existingData}

Newly Extracted Data (from "${documentName}"):
${newData}

You MUST return valid JSON with this exact structure:
{
  "changes": [
    {
      "type": "EXAM_DATE_CHANGED|EXAM_TIME_CHANGED|EXAM_ADDED|EXAM_REMOVED|TOPIC_ADDED|TOPIC_REMOVED|EVENT_ADDED|EVENT_CHANGED|EVENT_REMOVED",
      "subject": "Subject name",
      "field": "The field that changed (e.g., 'examDate', 'startTime')",
      "oldValue": "Previous value or null if new",
      "newValue": "New value or null if removed",
      "confidence": 0.0_to_1.0,
      "description": "Brief human-readable description of the change"
    }
  ],
  "summary": "Brief overall summary of all changes",
  "hasSignificantChanges": true_or_false
}

RULES:
1. Only report actual differences — do not repeat unchanged data.
2. "hasSignificantChanges" is true if any exam dates, times, or subjects changed.
3. Topic additions/removals alone are not "significant" unless many changed.
4. Set confidence based on how certain you are about the change.
5. Return an empty changes array if nothing changed.
6. Return ONLY valid JSON. No markdown, no explanation, no wrapping.
`;
