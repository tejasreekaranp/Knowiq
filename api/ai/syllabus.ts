import { extractCourseSource, flattenUnitsToCourseTopics, deterministicSourceExtractor } from '../../src/server/sourceEngine';
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

    const topics = flattenUnitsToCourseTopics(extraction, courseName);
    return res.status(200).json({ topics, extraction });
  } catch (err: any) {
    console.warn('[Syllabus] Falling back to deterministic extractor:', err);
    const fallbackExtraction = deterministicSourceExtractor(courseName, syllabusText, materialsSummary);
    const topics = flattenUnitsToCourseTopics(fallbackExtraction, courseName);
    return res.status(200).json({ topics, extraction: fallbackExtraction });
  }
}
