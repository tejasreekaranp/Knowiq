// src/api-handlers/health.ts
async function handler(_req, res) {
  res.setHeader("Content-Type", "application/json");
  let importStatus = {};
  try {
    const { z } = await import("zod");
    importStatus.zod = !!z;
  } catch (e) {
    importStatus.zodError = e.message;
  }
  try {
    const { GoogleGenAI } = await import("@google/genai");
    importStatus.gemini = !!GoogleGenAI;
  } catch (e) {
    importStatus.geminiError = e.message;
  }
  return res.status(200).json({
    ok: true,
    service: "knowiq-api",
    importStatus,
    env: {
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      nodeVersion: process.version
    }
  });
}
export {
  handler as default
};
