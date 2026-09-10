import { topicAnalysisRequestSchema } from '../../src/lib/schemas';
import { runTopicAnalysisPipeline } from '../../src/server/topicEngine';
import { getGeminiClient, callGeminiWithRetry } from '../../src/server/app';

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const validation = topicAnalysisRequestSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      error: 'Invalid topic analysis request parameters',
      details: validation.error.issues[0]?.message,
    });
  }

  try {
    const ai = getGeminiClient();
    const result = await runTopicAnalysisPipeline(ai, callGeminiWithRetry, validation.data);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[analyze-topic] Pipeline failed:', err);
    return res.status(500).json({ error: 'Failed to analyze topic' });
  }
}
