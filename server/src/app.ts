import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { getDb } from './db/connection.js';
import promptsRouter from './routes/prompts.js';
import categoriesRouter from './routes/categories.js';
import importRouter from './routes/import.js';
import settingsRouter from './routes/settings.js';
import refineRouter from './routes/refine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  const isProduction = process.env.NODE_ENV === 'production';

  app.use(compression());
  app.use(cors());
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }
  app.use(express.json({ limit: '1mb' }));

  // Health check — probes the DB so the Docker HEALTHCHECK fails fast
  // if SQLite becomes unreadable after startup.
  app.get('/api/health', (_req, res) => {
    try {
      getDb().exec('SELECT 1');
      res.json({ status: 'ok' });
    } catch {
      res.status(503).json({ status: 'error', error: 'database unreachable' });
    }
  });

  // Serve uploaded images
  app.use('/images', express.static(path.join(config.dataDir, 'images')));

  // API routes
  app.use('/api/prompts', promptsRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/import', importRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api/refine', refineRouter);

  // In production, serve the client build.
  // Vite emits content-hashed filenames in /assets, so those can be cached
  // forever. The HTML wrapper references the latest hashes and must NOT be
  // cached aggressively, or users keep loading stale bundles after a deploy.
  if (isProduction) {
    const clientDist = path.join(__dirname, '../../client/dist');
    app.use('/assets', express.static(path.join(clientDist, 'assets'), {
      immutable: true,
      maxAge: '1y',
    }));
    app.use(express.static(clientDist, { index: false }));
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  // Final error handler. Logs server-side, returns a generic JSON response.
  // Without this, Express's default handler leaks stack traces to clients.
  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    console.error(`[error] ${req.method} ${req.path}:`, err);
    if (res.headersSent) return;
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
