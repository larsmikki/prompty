import type { Prompt, Category } from '@/types'

const BASE = '/api'

async function fetchJson<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...opts?.headers },
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export const api = {
  getPrompts: () => fetchJson<Prompt[]>('/prompts'),
  createPrompt: (p: { title: string; text: string; category: string }) =>
    fetchJson<Prompt>('/prompts', { method: 'POST', body: JSON.stringify(p) }),
  updatePrompt: (id: string, p: { title: string; text: string; category: string }) =>
    fetchJson<Prompt>(`/prompts/${id}`, { method: 'PUT', body: JSON.stringify(p) }),
  deletePrompt: (id: string) =>
    fetch(`${BASE}/prompts/${id}`, { method: 'DELETE' }),
  getCategories: () => fetchJson<Category[]>('/categories'),
  createCategory: (name: string) =>
    fetchJson<Category>('/categories', { method: 'POST', body: JSON.stringify({ name }) }),
  updateCategory: (id: string, name: string) =>
    fetchJson<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),
  deleteCategory: (id: string) =>
    fetch(`${BASE}/categories/${id}`, { method: 'DELETE' }),
  importData: (data: { prompts: Prompt[]; categories: Category[] }) =>
    fetchJson<{ ok: boolean }>('/import', { method: 'POST', body: JSON.stringify(data) }),
  getOpenAIKeyStatus: () =>
    fetchJson<{ configured: boolean; masked: string }>('/settings/openai-key'),
  saveOpenAIKey: (key: string) =>
    fetchJson<{ ok: boolean }>('/settings/openai-key', { method: 'PUT', body: JSON.stringify({ key }) }),
  getOpenAIModel: () =>
    fetchJson<{ model: string }>('/settings/openai-model'),
  saveOpenAIModel: (model: string) =>
    fetchJson<{ ok: boolean }>('/settings/openai-model', { method: 'PUT', body: JSON.stringify({ model }) }),
  testOpenAI: () =>
    fetchJson<{ ok: boolean; model?: string; error?: string }>('/settings/test', { method: 'POST' }),
  getRefineContext: () =>
    fetchJson<{ context: string; isDefault: boolean }>('/settings/refine-context'),
  saveRefineContext: (context: string) =>
    fetchJson<{ ok: boolean }>('/settings/refine-context', { method: 'PUT', body: JSON.stringify({ context }) }),
  resetRefineContext: () =>
    fetchJson<{ ok: boolean }>('/settings/refine-context', { method: 'DELETE' }),
  refinePrompt: (idea: string) =>
    fetchJson<{ title: string; refinedPrompt: string }>('/refine', { method: 'POST', body: JSON.stringify({ idea }) }),
  uploadImage: (id: string, data: ArrayBuffer) =>
    fetch(`${BASE}/prompts/${id}/image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: data,
    }).then(r => { if (!r.ok) throw new Error(`API error: ${r.status}`) }),
  deleteImage: (id: string) =>
    fetch(`${BASE}/prompts/${id}/image`, { method: 'DELETE' }),
}
