import { subtopicContentRequestSchema } from '../../src/lib/schemas';
import { generateSourceGroundedContent } from '../../src/server/sourceEngine';
import { generateDynamicSubtopicContent } from '../../src/server/contentGenerator';
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
    const validation = subtopicContentRequestSchema.safeParse(rawBody);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request parameters',
        details: validation.error.issues[0]?.message,
      });
    }

    try {
      const ai = getGeminiClient();
      const content = await generateSourceGroundedContent(ai, callGeminiWithRetry, validation.data);
      return res.status(200).json(content);
    } catch (engineErr: any) {
      console.warn('[subtopic-content] AI generation warning, falling back to dynamic packet:', engineErr);
      const fallback = generateDynamicSubtopicContent(
        validation.data.courseName,
        validation.data.topicTitle,
        validation.data.subtopicTitle,
        validation.data.existingClarity
      );
      return res.status(200).json(fallback);
    }
  } catch (fatalError: any) {
    console.error('[subtopic-content] Fatal handler error:', fatalError);
    return res.status(500).json({
      error: 'Failed to synthesize learning content',
      message: fatalError?.message || 'Server error',
    });
  }
}
