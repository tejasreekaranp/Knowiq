export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  const check = req.query?.check;
  if (check) {
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

    try {
      const subtopic = await import('./ai/subtopic-content.js');
      importStatus.subtopic = !!subtopic;
    } catch (e: any) {
      importStatus.subtopicError = e.message;
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

  return res.status(200).json({
    ok: true,
    service: 'knowiq-api',
  });
}
