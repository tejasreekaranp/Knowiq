import { extractCourseSource, deterministicSourceExtractor } from '../../server/sourceEngine';
import { getGeminiClient, callGeminiWithRetry } from '../../server/gemini';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const rawBody = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { courseName, subject, academicLevel } = rawBody;
    const syllabusText = rawBody.syllabusText || rawBody.syllabus;
    const materialsSummary = rawBody.materialsSummary || rawBody.materials;

    try {
      const ai = getGeminiClient();
      const extraction = await extractCourseSource(ai, callGeminiWithRetry, {
        courseName,
        subject,
        academicLevel,
        syllabusText,
        materialsSummary,
      });
      return res.status(200).json(extraction);
    } catch (engineErr: any) {
      console.warn('[extract-preview] Falling back to deterministic extractor:', engineErr);
      const fallback = deterministicSourceExtractor(courseName, syllabusText, materialsSummary);
      return res.status(200).json(fallback);
    }
  } catch (fatalError: any) {
    console.error('[extract-preview] Fatal handler error:', fatalError);
    return res.status(500).json({ error: 'Failed to extract syllabus preview' });
  }
}
