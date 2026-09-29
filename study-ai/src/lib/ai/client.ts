/**
 * StudyAI — Centralized Gemini Client
 *
 * Server-only module. All Gemini API calls go through this client.
 * Handles: initialization, retries, timeout, error wrapping.
 *
 * NEVER import this from client-side code.
 */

import "server-only";

import { GoogleGenAI, createPartFromBase64 } from "@google/genai";
import {
  AIConfigError,
  AIParseError,
  AIQuotaError,
  AIServiceError,
  AITimeoutError,
  toAIError,
  type AIError,
} from "./errors";

// ─── Configuration ───────────────────────────────────────────

const DEFAULT_MODEL = "gemini-3.8-flash";
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;

interface GeminiClientConfig {
  model?: string;
  timeoutMs?: number;
  maxRetries?: number;
}

// ─── Singleton Client ────────────────────────────────────────

let _client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (_client) return _client;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    throw new AIConfigError(
      "GEMINI_API_KEY is not set. Add it to .env.local"
    );
  }

  _client = new GoogleGenAI({ apiKey });
  return _client;
}

function getModel(): string {
  return process.env.GEMINI_MODEL || DEFAULT_MODEL;
}

// ─── Core Generation Function ────────────────────────────────

/**
 * Generate structured text content from Gemini.
 *
 * @param prompt - The text prompt
 * @param config - Optional configuration overrides
 * @returns The raw text response from Gemini
 */
export async function generateText(
  prompt: string,
  config?: GeminiClientConfig
): Promise<string> {
  const client = getClient();
  const model = config?.model ?? getModel();
  const timeoutMs = config?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = config?.maxRetries ?? MAX_RETRIES;

  let lastError: AIError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await client.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            abortSignal: controller.signal,
          },
        });

        clearTimeout(timeout);

        const text = response.text;
        if (!text || text.trim() === "") {
          throw new AIParseError("Gemini returned an empty response");
        }

        return text.trim();
      } finally {
        clearTimeout(timeout);
      }
    } catch (error: unknown) {
      // Don't retry abort / timeout
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new AITimeoutError(timeoutMs);
      }

      // Don't retry quota errors
      if (error instanceof AIQuotaError) {
        throw error;
      }

      // Don't retry config errors
      if (error instanceof AIConfigError) {
        throw error;
      }

      lastError = toAIError(error);

      // Only retry retryable errors
      if (!lastError.retryable || attempt >= maxRetries) {
        throw lastError;
      }

      // Exponential backoff: 1s, 2s
      await sleep(1000 * (attempt + 1));
    }
  }

  // Should not reach here, but just in case
  throw lastError ?? new AIServiceError("Unknown error during generation");
}

// ─── Multimodal Generation ───────────────────────────────────

/**
 * Generate content from an image/PDF + text prompt.
 * Used for academic document extraction.
 *
 * @param prompt - The text prompt
 * @param fileData - Base64-encoded file data
 * @param mimeType - The MIME type of the file (e.g., "image/png", "application/pdf")
 * @param config - Optional configuration overrides
 * @returns The raw text response from Gemini
 */
export async function generateFromFile(
  prompt: string,
  fileData: string,
  mimeType: string,
  config?: GeminiClientConfig
): Promise<string> {
  const client = getClient();
  const model = config?.model ?? getModel();
  const timeoutMs = config?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = config?.maxRetries ?? MAX_RETRIES;

  let lastError: AIError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const filePart = createPartFromBase64(fileData, mimeType);

        const response = await client.models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts: [filePart, { text: prompt }],
            },
          ],
          config: {
            responseMimeType: "application/json",
            abortSignal: controller.signal,
          },
        });

        clearTimeout(timeout);

        const text = response.text;
        if (!text || text.trim() === "") {
          throw new AIParseError("Gemini returned an empty response for file input");
        }

        return text.trim();
      } finally {
        clearTimeout(timeout);
      }
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new AITimeoutError(timeoutMs);
      }
      if (error instanceof AIQuotaError) throw error;
      if (error instanceof AIConfigError) throw error;

      lastError = toAIError(error);

      if (!lastError.retryable || attempt >= maxRetries) {
        throw lastError;
      }

      await sleep(1000 * (attempt + 1));
    }
  }

  throw lastError ?? new AIServiceError("Unknown error during file generation");
}

// ─── JSON Parsing Helper ─────────────────────────────────────

/**
 * Parse a Gemini response as JSON.
 * Handles common issues like markdown code fences wrapping JSON.
 */
export function parseJSONResponse<T = unknown>(raw: string): T {
  // Strip markdown code fences if Gemini wraps output
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new AIParseError(
      "Failed to parse Gemini response as JSON",
      raw
    );
  }
}

// ─── Utility ─────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Reset the singleton client (for testing).
 */
export function _resetClient(): void {
  _client = null;
}
