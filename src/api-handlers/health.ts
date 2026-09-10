export default async function handler(_req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  let importStatus: any = {};
  try {
    const { z } = await import('zod');
    importStatus.zod = !!z;
  } catch (e: any) {
    importStatus.zodError = e.message;
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    importStatus.gemini = !!GoogleGenAI;
  } catch (e: any) {
    importStatus.geminiError = e.message;
  }

  return res.status(200).json({
    ok: true,
    service: 'knowiq-api',
    importStatus,
    env: {
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      nodeVersion: process.version,
    }
  });
}
