import { Router } from 'express';
import OpenAI from 'openai';
import { getSetting } from './settings.js';
import { DEFAULT_REFINE_CONTEXT } from '../refineDefault.js';

const router = Router();

function buildSystemPrompt(context: string): string {
  return `You are an expert prompt engineer. The user gives you a vague idea or rough description, and you transform it into a clear, detailed, and effective prompt for an AI assistant.

Use the following prompt-writing guide as your reference when crafting the refined prompt:

<guide>
${context}
</guide>

Rules:
- Apply the guide's principles (Role & Goal, Knowledge Base, Tone & Style, Constraints, Example Output) where relevant
- Write the prompt in second person ("You are...", "Your task is...", "Please...") as if instructing an AI
- Be specific and unambiguous
- Do not explain what you're doing — just output the refined prompt
- Also suggest a short title (4-6 words) for this prompt

Output format (JSON only, no markdown):
{"title": "...", "prompt": "..."}`;
}

router.post('/', async (req, res) => {
  const { idea } = req.body;
  if (!idea?.trim()) return res.status(400).json({ error: 'idea is required' });

  const apiKey = getSetting('openai_api_key') || process.env.OPENAI_API_KEY || '';
  if (!apiKey) return res.status(400).json({ error: 'OpenAI API key not configured. Add it in Settings.' });

  const model = getSetting('openai_model') || 'gpt-4o-mini';
  const client = new OpenAI({ apiKey });

  const context = getSetting('refine_context') || DEFAULT_REFINE_CONTEXT;

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: buildSystemPrompt(context) },
        { role: 'user', content: idea.trim() },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    let parsed: { title?: string; prompt?: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(500).json({ error: 'Invalid response from AI' });
    }

    res.json({
      title: parsed.title ?? '',
      refinedPrompt: parsed.prompt ?? raw,
    });
  } catch (err: any) {
    console.error('[refine] OpenAI call failed:', err?.message ?? err);
    const status = typeof err?.status === 'number' ? err.status : 0;
    if (status === 401) {
      return res.status(401).json({ error: 'OpenAI rejected the API key. Update it in Settings.' });
    }
    if (status === 429) {
      return res.status(429).json({ error: 'OpenAI rate limit or quota exceeded. Try again later.' });
    }
    res.status(502).json({ error: 'OpenAI request failed. Check server logs for details.' });
  }
});

export default router;
