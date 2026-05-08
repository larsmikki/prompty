import express from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
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
  app.use(morgan('dev'));
  app.use(express.json({ limit: '1mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Serve uploaded images
  app.use('/images', express.static(path.join(config.dataDir, 'images')));

  // API routes
  app.use('/api/prompts', promptsRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/import', importRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api/refine', refineRouter);

  // In production, serve the client build
  if (isProduction) {
    const clientDist = path.join(__dirname, '../../client/dist');
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  return app;
}
