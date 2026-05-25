import { Router } from 'express';
import { getDb, saveDb } from '../db/connection.js';

const router = Router();

router.post('/', (req, res) => {
  const db = getDb();
  const { prompts, categories } = req.body;

  let categoriesAdded = 0;
  let categoriesSkipped = 0;
  let promptsAdded = 0;
  let promptsSkipped = 0;

  // Insert categories first
  if (categories && Array.isArray(categories)) {
    for (const cat of categories) {
      if (!cat || typeof cat.id !== 'string' || typeof cat.name !== 'string' || !cat.id || !cat.name) {
        categoriesSkipped++;
        continue;
      }
      const existing = db.exec('SELECT id FROM categories WHERE id = $id', { $id: cat.id });
      if (existing.length && existing[0].values.length) { categoriesSkipped++; continue; }
      db.run(
        'INSERT INTO categories (id, name) VALUES ($id, $name)',
        { $id: cat.id, $name: cat.name }
      );
      categoriesAdded++;
    }
  }

  // Insert prompts
  if (prompts && Array.isArray(prompts)) {
    for (const p of prompts) {
      if (!p || typeof p.id !== 'string' || typeof p.text !== 'string' || typeof p.category !== 'string' || !p.id || !p.text || !p.category) {
        promptsSkipped++;
        continue;
      }
      const existing = db.exec('SELECT id FROM prompts WHERE id = $id', { $id: p.id });
      if (existing.length && existing[0].values.length) { promptsSkipped++; continue; }
      let imagePath: string | null = null;
      if (typeof p.imagePath === 'string' && p.imagePath.startsWith('/images/')) {
        const name = p.imagePath.slice('/images/'.length).split('?')[0];
        if (/^[A-Za-z0-9._-]+$/.test(name)) imagePath = name;
      }
      db.run(
        'INSERT INTO prompts (id, title, text, category, created_at, image_path) VALUES ($id, $title, $text, $category, $createdAt, $imagePath)',
        { $id: p.id, $title: typeof p.title === 'string' ? p.title : '', $text: p.text, $category: p.category, $createdAt: typeof p.createdAt === 'number' ? p.createdAt : Date.now(), $imagePath: imagePath }
      );
      promptsAdded++;
    }
  }

  saveDb();
  res.json({ ok: true, categoriesAdded, categoriesSkipped, promptsAdded, promptsSkipped });
});

export default router;
