import { aiClient, isGeminiConfigured } from './client';
import { PlanExplanationSchema } from './schemas';
import { z } from 'zod';
import { PlanChange, ExamRiskResult } from '@/types';

export async function explainPlanChanges(
  changes: PlanChange[],
  missedCount: number
): Promise<z.infer<typeof PlanExplanationSchema>> {
  if (isGeminiConfigured && aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            text: `You are an encouraging academic study planner AI. Explain why a student's study plan was rescued and updated after missing ${missedCount} session(s).
Return ONLY a valid JSON object matching:
{
  "summary": string,
  "keyChanges": [string, string],
  "reassurance": string
}

Changes: ${JSON.stringify(changes)}`,
          },
        ],
      });

      const responseText = response.text || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedJSON = JSON.parse(jsonMatch[0]);
        return PlanExplanationSchema.parse(parsedJSON);
      }
    } catch (err) {
      console.warn('Gemini plan explanation failed, using fallback:', err);
    }
  }

  // Fallback explanation
  return {
    summary: `Your study plan was rescued after ${missedCount} missed session(s). Work was redistributed to protect upcoming exams without increasing your daily cap.`,
    keyChanges: changes.map((c) => c.description).slice(0, 3),
    reassurance: "Don't stress—life happens! Your new plan keeps you on track for your exams without burning you out.",
  };
}

export async function explainExamRisk(
  risk: ExamRiskResult
): Promise<string> {
  if (isGeminiConfigured && aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            text: `Explain in 2 conversational sentences why ${risk.subjectName} is classified as ${risk.level} RISK (Score: ${risk.score}/100) based on factors:
${JSON.stringify(risk.factors)}
Reason summary: ${risk.reason}`,
          },
        ],
      });

      if (response.text) return response.text.trim();
    } catch (err) {
      console.warn('Gemini risk explanation failed, using fallback:', err);
    }
  }

  return risk.reason;
}
