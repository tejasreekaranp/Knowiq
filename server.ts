import path from 'path';
import express from 'express';
import { app } from './src/server/app';

const PORT = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Dynamically import vite only in local development to avoid bundling it in serverless environments
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KnowIQ Adaptive Learning Server running on http://0.0.0.0:${PORT}`);
  });
}

// Only launch standalone HTTP listener if not running in Vercel Serverless environment
if (!process.env.VERCEL) {
  startServer();
}

export default app;
