import { Router } from 'express';
import { getDb, saveDb } from '../db/connection.js';

const router = Router();

router.get('/', (_req, res) => {
  const db = getDb();
  const results = db.exec('SELECT id, title, text, category, created_at FROM prompts ORDER BY created_at DESC');
  if (!results.length) return res.json([]);

  const prompts = results[0].values.map(row => ({
    id: row[0],
    title: row[1],
    text: row[2],
    category: row[3],
    createdAt: row[4],
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
  db.run('DELETE FROM prompts WHERE id = $id', { $id: req.params.id });
  saveDb();
  res.status(204).end();
});

export default router;
