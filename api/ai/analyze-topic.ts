import { topicAnalysisRequestSchema } from '../../src/lib/schemas';
import { runTopicAnalysisPipeline } from '../../src/server/topicEngine';
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
    const validation = topicAnalysisRequestSchema.safeParse(rawBody);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid topic analysis request parameters',
        details: validation.error.issues[0]?.message,
      });
    }

    const ai = getGeminiClient();
    const result = await runTopicAnalysisPipeline(ai, callGeminiWithRetry, validation.data);
    return res.status(200).json(result);
  } catch (fatalError: any) {
    console.error('[analyze-topic] Fatal handler error:', fatalError);
    return res.status(500).json({ error: 'Failed to analyze topic' });
  }
}
