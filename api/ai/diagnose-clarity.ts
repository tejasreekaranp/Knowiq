import { diagnoseClarityRequestSchema } from '../../src/lib/schemas';
import { diagnoseSubtopicClarity } from '../../src/server/sourceEngine';
import { getGeminiClient, callGeminiWithRetry } from '../../src/server/app';

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const validation = diagnoseClarityRequestSchema.safeParse(req.body);
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
  } catch (err: any) {
    console.error('[diagnose-clarity] Diagnosis failed, using dynamic diagnostic:', err);
    const diagnostic = await diagnoseSubtopicClarity(null, callGeminiWithRetry, validation.data);
    return res.status(200).json(diagnostic);
  }
}
