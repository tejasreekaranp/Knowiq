import { subtopicContentRequestSchema } from '../../src/lib/schemas';
import { generateSourceGroundedContent } from '../../src/server/sourceEngine';
import { generateDynamicSubtopicContent } from '../../src/server/contentGenerator';
import { getGeminiClient, callGeminiWithRetry } from '../../src/server/app';

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const validation = subtopicContentRequestSchema.safeParse(req.body);
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
  } catch (err: any) {
    console.error('[subtopic-content] Generation failed, using dynamic packet:', err);
    const fallback = generateDynamicSubtopicContent(
      validation.data.courseName,
      validation.data.topicTitle,
      validation.data.subtopicTitle,
      validation.data.existingClarity
    );
    return res.status(200).json(fallback);
  }
}
