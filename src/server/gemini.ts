import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

// Lazy initialization of Gemini Client
let geminiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// In-memory cache to conserve quota and deliver instantaneous responses
const aiResponseCache = new Map<string, string>();
let quotaCooldownUntil = 0;
let demandCooldownUntil = 0;

// Resilient Gemini caller with backoff retry, caching, and circuit breaker
export async function callGeminiWithRetry(
  ai: GoogleGenAI | null,
  prompt: string,
  options?: { responseMimeType?: string }
): Promise<string | null> {
  if (!ai) return null;

  // Check in-memory cache first to avoid unnecessary API calls and conserve quota
  const cacheKey = `${options?.responseMimeType || 'text'}:${prompt.slice(0, 200)}:${prompt.length}`;
  if (aiResponseCache.has(cacheKey)) {
    return aiResponseCache.get(cacheKey)!;
  }

  // Circuit breaker: if quota was exhausted or model in 503 demand cooldown, gracefully fallback
  const now = Date.now();
  if (now < quotaCooldownUntil || now < demandCooldownUntil) {
    return null;
  }

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Model call timeout')), 25000)
    );
    const callPromise = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: options?.responseMimeType ? { responseMimeType: options.responseMimeType } : undefined,
    });

    const response = await Promise.race([callPromise, timeoutPromise]);
    if (response && response.text) {
      aiResponseCache.set(cacheKey, response.text);
      return response.text;
    }
  } catch (err: any) {
    const msg = String(err?.message || err);
    console.warn('[callGeminiWithRetry] Gemini error:', msg);
    const isQuotaExhausted = msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
    const isHighDemand = msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('high demand');

    if (isQuotaExhausted) {
      quotaCooldownUntil = Date.now() + 60_000;
    } else if (isHighDemand) {
      demandCooldownUntil = Date.now() + 15_000;
    }
  }
  return null;
}
