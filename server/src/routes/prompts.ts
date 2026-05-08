import express, { Router } from 'express';
import { getDb, saveDb } from '../db/connection.js';
import { config } from '../config.js';
import fs from 'fs';
import path from 'path';

const router = Router();
const imagesDir = path.join(config.dataDir, 'images');

router.get('/', (_req, res) => {
  const db = getDb();
  const results = db.exec('SELECT id, title, text, category, created_at, image_path FROM prompts ORDER BY created_at DESC');
  if (!results.length) return res.json([]);

  const prompts = results[0].values.map((row: any[]) => ({
    id: row[0],
    title: row[1],
    text: row[2],
    category: row[3],
    createdAt: row[4],
    imagePath: row[5] ? `/images/${row[5]}` : undefined,
  }));
  res.json(prompts);
});

router.post('/', (req, res) => {
  const db = getDb();
  const { id, title, text, category, createdAt } = req.body;
  const promptId = id || crypto.randomUUID();
  const timestamp = createdAt || Date.now();

  db.run(
    'INSERT INTO prompts (id, title, text, category, created_at) VALUES ($id, $title, $text, $category, $createdAt)',
    { $id: promptId, $title: title || '', $text: text, $category: category, $createdAt: timestamp }
  );
  saveDb();

  res.status(201).json({ id: promptId, title: title || '', text, category, createdAt: timestamp });
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { title, text, category } = req.body;

  db.run(
    'UPDATE prompts SET title = $title, text = $text, category = $category WHERE id = $id',
    { $id: req.params.id, $title: title, $text: text, $category: category }
  );
  saveDb();

  res.json({ id: req.params.id, title, text, category });
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const rows = db.exec('SELECT image_path FROM prompts WHERE id = $id', { $id: req.params.id });
  if (rows.length && rows[0].values.length) {
    const imgPath = rows[0].values[0][0] as string | null;
    if (imgPath) {
      const file = path.join(imagesDir, imgPath);
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  }
  db.run('DELETE FROM prompts WHERE id = $id', { $id: req.params.id });
  saveDb();
  res.status(204).end();
});

router.post('/:id/image', express.raw({ type: 'application/octet-stream', limit: '10mb' }), (req, res) => {
  const { id } = req.params;
  const db = getDb();

  const rows = db.exec('SELECT id FROM prompts WHERE id = $id', { $id: id });
  if (!rows.length || !rows[0].values.length) {
    res.status(404).json({ error: 'Prompt not found' });
    return;
  }

  fs.mkdirSync(imagesDir, { recursive: true });
  const filename = `${id}.png`;
  fs.writeFileSync(path.join(imagesDir, filename), req.body as Buffer);

  db.run('UPDATE prompts SET image_path = $path WHERE id = $id', { $id: id, $path: filename });
  saveDb();

  res.json({ imagePath: `/images/${filename}` });
});

router.delete('/:id/image', (req, res) => {
  const { id } = req.params;
  const db = getDb();

  const rows = db.exec('SELECT image_path FROM prompts WHERE id = $id', { $id: id });
  if (rows.length && rows[0].values.length) {
    const imgPath = rows[0].values[0][0] as string | null;
    if (imgPath) {
      const file = path.join(imagesDir, imgPath);
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  }

  db.run('UPDATE prompts SET image_path = NULL WHERE id = $id', { $id: id });
  saveDb();
  res.status(204).end();
});

export default router;
