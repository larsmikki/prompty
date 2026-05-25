import { Router } from 'express';
import { getDb, saveDb } from '../db/connection.js';

const router = Router();

router.get('/', (_req, res) => {
  const db = getDb();
  const results = db.exec('SELECT id, name FROM categories ORDER BY name');
  if (!results.length) return res.json([]);

  const categories = results[0].values.map((row: any[]) => ({
    id: row[0],
    name: row[1],
  }));
  res.json(categories);
});

router.post('/', (req, res) => {
  const db = getDb();
  const { id, name } = req.body;
  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  const trimmed = name.trim();

  const dup = db.exec(
    'SELECT id FROM categories WHERE LOWER(name) = LOWER($name)',
    { $name: trimmed }
  );
  if (dup.length && dup[0].values.length) {
    return res.status(409).json({ error: 'A category with that name already exists' });
  }

  const catId = typeof id === 'string' && id ? id : crypto.randomUUID();

  db.run(
    'INSERT INTO categories (id, name) VALUES ($id, $name)',
    { $id: catId, $name: trimmed }
  );
  saveDb();

  res.status(201).json({ id: catId, name: trimmed });
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { name } = req.body;
  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  const trimmed = name.trim();

  const existing = db.exec('SELECT name FROM categories WHERE id = $id', { $id: req.params.id });
  if (!existing.length || !existing[0].values.length) {
    return res.status(404).json({ error: 'Category not found' });
  }
  const oldName = existing[0].values[0][0] as string;

  if (oldName.toLowerCase() !== trimmed.toLowerCase()) {
    const dup = db.exec(
      'SELECT id FROM categories WHERE LOWER(name) = LOWER($name) AND id != $id',
      { $name: trimmed, $id: req.params.id }
    );
    if (dup.length && dup[0].values.length) {
      return res.status(409).json({ error: 'A category with that name already exists' });
    }
  }

  if (oldName !== trimmed) {
    db.run('UPDATE prompts SET category = $new WHERE category = $old', { $new: trimmed, $old: oldName });
  }
  db.run('UPDATE categories SET name = $name WHERE id = $id', { $id: req.params.id, $name: trimmed });
  saveDb();

  res.json({ id: req.params.id, name: trimmed });
});

router.delete('/:id', (req, res) => {
  const db = getDb();

  const catResults = db.exec('SELECT name FROM categories WHERE id = $id', { $id: req.params.id });
  if (!catResults.length || !catResults[0].values.length) return res.status(404).end();
  const catName = catResults[0].values[0][0] as string;

  const fallbackResults = db.exec('SELECT name FROM categories WHERE id != $id LIMIT 1', { $id: req.params.id });
  if (!fallbackResults.length || !fallbackResults[0].values.length) {
    return res.status(400).json({ error: 'Cannot delete the last remaining category' });
  }
  const fallbackName = fallbackResults[0].values[0][0] as string;

  db.run('UPDATE prompts SET category = $fallback WHERE category = $name', { $fallback: fallbackName, $name: catName });
  db.run('DELETE FROM categories WHERE id = $id', { $id: req.params.id });
  saveDb();
  res.status(204).end();
});

export default router;
