import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';

export const isGeminiConfigured = Boolean(apiKey && apiKey !== 'YOUR_GEMINI_API_KEY');

export const aiClient = isGeminiConfigured
  ? new GoogleGenAI({ apiKey })
  : null;
