import { Router } from 'express';
import { getDb, saveDb } from '../db/connection.js';
import { DEFAULT_REFINE_CONTEXT } from '../refineDefault.js';

const router = Router();

function getSetting(key: string): string {
  const db = getDb();
  const result = db.exec('SELECT value FROM settings WHERE key = $key', { $key: key });
  return result[0]?.values[0]?.[0] as string ?? '';
}

function setSetting(key: string, value: string): void {
  const db = getDb();
  db.run(
    'INSERT INTO settings (key, value) VALUES ($key, $value) ON CONFLICT(key) DO UPDATE SET value = $value',
    { $key: key, $value: value }
  );
  saveDb();
}

router.get('/openai-key', (_req, res) => {
  const key = getSetting('openai_api_key');
  res.json({ configured: !!key, masked: key ? '***' + key.slice(-4) : '' });
});

router.put('/openai-key', (req, res) => {
  const { key } = req.body;
  if (typeof key !== 'string') return res.status(400).json({ error: 'key required' });
  setSetting('openai_api_key', key.trim());
  res.json({ ok: true });
});

router.get('/openai-model', (_req, res) => {
  const model = getSetting('openai_model') || 'gpt-4o-mini';
  res.json({ model });
});

router.put('/openai-model', (req, res) => {
  const { model } = req.body;
  if (typeof model !== 'string' || !model.trim()) return res.status(400).json({ error: 'model required' });
  setSetting('openai_model', model.trim());
  res.json({ ok: true });
});

router.post('/test', async (req, res) => {
  const { OpenAI } = await import('openai');
  const apiKey = getSetting('openai_api_key') || process.env.OPENAI_API_KEY || '';
  if (!apiKey) return res.status(400).json({ ok: false, error: 'No API key configured.' });

  const model = getSetting('openai_model') || 'gpt-4o-mini';
  const client = new OpenAI({ apiKey });
  try {
    await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: 'Say "ok"' }],
      max_tokens: 5,
    });
    res.json({ ok: true, model });
  } catch (err: any) {
    res.json({ ok: false, error: err?.message ?? 'Unknown error' });
  }
});

router.get('/refine-context', (_req, res) => {
  const stored = getSetting('refine_context');
  const isDefault = !stored;
  res.json({ context: stored || DEFAULT_REFINE_CONTEXT, isDefault });
});

router.put('/refine-context', (req, res) => {
  const { context } = req.body;
  if (typeof context !== 'string') return res.status(400).json({ error: 'context required' });
  setSetting('refine_context', context);
  res.json({ ok: true });
});

router.delete('/refine-context', (_req, res) => {
  const db = getDb();
  db.run('DELETE FROM settings WHERE key = $key', { $key: 'refine_context' });
  saveDb();
  res.json({ ok: true });
});

export { getSetting };
export default router;
