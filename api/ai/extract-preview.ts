import { extractCourseSource, deterministicSourceExtractor } from '../../src/server/sourceEngine';
import { getGeminiClient, callGeminiWithRetry } from '../../src/server/app';

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { courseName, subject, academicLevel } = req.body;
  const syllabusText = req.body.syllabusText || req.body.syllabus;
  const materialsSummary = req.body.materialsSummary || req.body.materials;

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
  } catch (err: any) {
    console.warn('[extract-preview] Falling back to deterministic extractor:', err);
    const fallback = deterministicSourceExtractor(courseName, syllabusText, materialsSummary);
    return res.status(200).json(fallback);
  }
}
