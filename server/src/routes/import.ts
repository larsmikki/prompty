import { Router } from 'express';
import { getDb, saveDb } from '../db/connection.js';

const router = Router();

router.post('/', (req, res) => {
  const db = getDb();
  const { prompts, categories } = req.body;

  // Insert categories first
  if (categories && Array.isArray(categories)) {
    for (const cat of categories) {
      const existing = db.exec('SELECT id FROM categories WHERE id = $id', { $id: cat.id });
      if (existing.length && existing[0].values.length) continue;
      db.run(
        'INSERT INTO categories (id, name) VALUES ($id, $name)',
        { $id: cat.id, $name: cat.name }
      );
    }
  }

  // Insert prompts
  if (prompts && Array.isArray(prompts)) {
    for (const p of prompts) {
      const existing = db.exec('SELECT id FROM prompts WHERE id = $id', { $id: p.id });
      if (existing.length && existing[0].values.length) continue;
      db.run(
        'INSERT INTO prompts (id, title, text, category, created_at) VALUES ($id, $title, $text, $category, $createdAt)',
        { $id: p.id, $title: p.title || '', $text: p.text, $category: p.category, $createdAt: p.createdAt || Date.now() }
      );
    }
  }

  saveDb();
  res.json({ ok: true });
});

export default router;
