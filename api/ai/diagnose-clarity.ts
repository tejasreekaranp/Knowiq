import { diagnoseClarityRequestSchema } from '../../src/lib/schemas';
import { diagnoseSubtopicClarity } from '../../src/server/sourceEngine';
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
    const validation = diagnoseClarityRequestSchema.safeParse(rawBody);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid quiz response parameters',
        details: validation.error.issues[0]?.message,
      });
    }

    try {
      const ai = getGeminiClient();
      const diagnostic = await diagnoseSubtopicClarity(ai, callGeminiWithRetry, validation.data);
      return res.status(200).json(diagnostic);
    } catch (engineErr: any) {
      console.warn('[diagnose-clarity] AI diagnosis failed, falling back:', engineErr);
      const diagnostic = await diagnoseSubtopicClarity(null, callGeminiWithRetry, validation.data);
      return res.status(200).json(diagnostic);
    }
  } catch (fatalError: any) {
    console.error('[diagnose-clarity] Fatal handler error:', fatalError);
    return res.status(500).json({ error: 'Failed to diagnose clarity' });
  }
}
