export default async function handler(_req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  const results: Record<string, any> = {};

  try {
    await import('../src/lib/schemas');
    results.schemas = 'OK';
  } catch (e: any) {
    results.schemas = e?.message || String(e);
  }

  try {
    await import('../src/server/contentGenerator');
    results.contentGenerator = 'OK';
  } catch (e: any) {
    results.contentGenerator = e?.message || String(e);
  }

  try {
    await import('../src/server/gemini');
    results.gemini = 'OK';
  } catch (e: any) {
    results.gemini = e?.message || String(e);
  }

  try {
    await import('../src/server/sourceEngine');
    results.sourceEngine = 'OK';
  } catch (e: any) {
    results.sourceEngine = e?.message || String(e);
  }

  try {
    await import('@google/genai');
    results.genaiPackage = 'OK';
  } catch (e: any) {
    results.genaiPackage = e?.message || String(e);
  }

  return res.status(200).json({
    nodeVersion: process.version,
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    results,
  });
}
