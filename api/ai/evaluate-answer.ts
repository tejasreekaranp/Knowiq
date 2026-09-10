import { answerEvaluationRequestSchema } from '../../src/lib/schemas';
import { evaluateAnswer } from '../../src/server/learningEngine';

export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const validation = answerEvaluationRequestSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      error: 'Invalid answer evaluation request parameters',
      details: validation.error.issues[0]?.message,
    });
  }

  try {
    const result = evaluateAnswer(validation.data);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[evaluate-answer] Evaluation failed:', err);
    return res.status(500).json({ error: 'Failed to evaluate answer' });
  }
}
