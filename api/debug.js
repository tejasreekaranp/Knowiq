// src/api-handlers/ai/debug.ts
async function handler(req, res) {
  try {
    let zodLoaded = false;
    let geminiLoaded = false;
    let zodError = null;
    let geminiError = null;
    try {
      const { z } = await import("zod");
      zodLoaded = !!z;
    } catch (e) {
      zodError = e.message;
    }
    try {
      const { GoogleGenAI } = await import("@google/genai");
      geminiLoaded = !!GoogleGenAI;
    } catch (e) {
      geminiError = e.message;
    }
    return res.status(200).json({
      zodLoaded,
      zodError,
      geminiLoaded,
      geminiError,
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      nodeVersion: process.version
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
export {
  handler as default
};
