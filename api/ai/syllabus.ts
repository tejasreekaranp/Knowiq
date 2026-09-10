import { extractCourseSource, flattenUnitsToCourseTopics, deterministicSourceExtractor } from '../../src/server/sourceEngine';
import { getGeminiClient, callGeminiWithRetry } from '../../src/server/gemini';

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

      const topics = flattenUnitsToCourseTopics(extraction, courseName);
      return res.status(200).json({ topics, extraction });
    } catch (engineErr: any) {
      console.warn('[Syllabus] Falling back to deterministic extractor:', engineErr);
      const fallbackExtraction = deterministicSourceExtractor(courseName, syllabusText, materialsSummary);
      const topics = flattenUnitsToCourseTopics(fallbackExtraction, courseName);
      return res.status(200).json({ topics, extraction: fallbackExtraction });
    }
  } catch (fatalError: any) {
    console.error('[syllabus] Fatal handler error:', fatalError);
    return res.status(500).json({ error: 'Failed to process syllabus' });
  }
}
