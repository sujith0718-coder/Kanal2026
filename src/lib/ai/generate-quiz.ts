import { aiClient, isGeminiConfigured } from './client';
import { GeneratedQuizSchema } from './schemas';
import { z } from 'zod';

export async function generateMicroQuiz(
  topicName: string,
  subjectName: string
): Promise<z.infer<typeof GeneratedQuizSchema>> {
  if (isGeminiConfigured && aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            text: `Generate a 3-question micro-quiz to assess student mastery for the topic "${topicName}" in "${subjectName}".
Return ONLY a valid JSON object matching this schema:
{
  "topic": "${topicName}",
  "title": "2-Minute Mastery Check: ${topicName}",
  "questions": [
    {
      "question": string,
      "options": [string, string, string, string],
      "correctAnswer": string,
      "explanation": string
    }
  ]
}`,
          },
        ],
      });

      const responseText = response.text || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedJSON = JSON.parse(jsonMatch[0]);
        return GeneratedQuizSchema.parse(parsedJSON);
      }
    } catch (err) {
      console.warn('Gemini quiz generation failed or rate limited, using deterministic template fallback:', err);
    }
  }

  // Fallback Quiz Generator (Deterministic template fallback)
  return {
    topic: topicName,
    title: `2-Minute Mastery Check: ${topicName}`,
    questions: [
      {
        question: `What is the primary worst-case time complexity associated with search operations in ${topicName}?`,
        options: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'],
        correctAnswer: 'O(N)',
        explanation: `In unbalanced or worst-case scenarios, searching in ${topicName} degenerates to linear time O(N).`,
      },
      {
        question: `Which fundamental property or invariance condition must hold true for ${topicName}?`,
        options: [
          'All nodes must have exactly two children at every level.',
          'The left child value is strictly less than the root, and the right child value is greater.',
          'All elements must be stored in contiguous memory addresses.',
          'Elements are popped in Last-In-First-Out (LIFO) order.',
        ],
        correctAnswer: 'The left child value is strictly less than the root, and the right child value is greater.',
        explanation: 'This invariant guarantees logarithmic search efficiency in balanced binary search trees.',
      },
      {
        question: `Which traversal algorithm guarantees processing nodes in ascending sorted sequence for ${topicName}?`,
        options: ['Pre-order traversal', 'In-order traversal', 'Post-order traversal', 'Level-order traversal'],
        correctAnswer: 'In-order traversal',
        explanation: 'In-order traversal visits left subtree, root, then right subtree, producing ordered values.',
      },
    ],
  };
}
