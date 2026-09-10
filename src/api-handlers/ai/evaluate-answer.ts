import { answerEvaluationRequestSchema } from '../../lib/schemas';
import { evaluateAnswer } from '../../server/learningEngine';

export default function handler(req: any, res: any) {
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
    const validation = answerEvaluationRequestSchema.safeParse(rawBody);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid answer evaluation request parameters',
        details: validation.error.issues[0]?.message,
      });
    }

    const result = evaluateAnswer(validation.data);
    return res.status(200).json(result);
  } catch (fatalError: any) {
    console.error('[evaluate-answer] Fatal handler error:', fatalError);
    return res.status(500).json({ error: 'Failed to evaluate answer' });
  }
}
