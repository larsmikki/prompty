import type { Prompt, Category } from '@/types'

const BASE = '/api'
const DEFAULT_TIMEOUT_MS = 15_000
const REFINE_TIMEOUT_MS = 60_000

async function fetchWithTimeout(url: string, opts: RequestInit, timeoutMs: number): Promise<Response> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s`)
    }
    throw err
  } finally {
    clearTimeout(t)
  }
}

async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json()
    if (body && typeof body.error === 'string') return body.error
  } catch {
    // body wasn't JSON; fall through
  }
  return `API error: ${res.status}`
}

async function fetchJson<T>(url: string, opts?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...rest } = opts ?? {}
  const res = await fetchWithTimeout(`${BASE}${url}`, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...rest.headers },
  }, timeoutMs)
  if (!res.ok) throw new Error(await readError(res))
  return res.json()
}

async function fetchVoid(url: string, opts?: RequestInit & { timeoutMs?: number }): Promise<void> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...rest } = opts ?? {}
  const res = await fetchWithTimeout(`${BASE}${url}`, rest, timeoutMs)
  if (!res.ok) throw new Error(await readError(res))
}

export const api = {
  getPrompts: () => fetchJson<Prompt[]>('/prompts'),
  createPrompt: (p: { title: string; text: string; category: string }) =>
    fetchJson<Prompt>('/prompts', { method: 'POST', body: JSON.stringify(p) }),
  updatePrompt: (id: string, p: { title: string; text: string; category: string }) =>
    fetchJson<Prompt>(`/prompts/${id}`, { method: 'PUT', body: JSON.stringify(p) }),
  deletePrompt: (id: string) =>
    fetchVoid(`/prompts/${id}`, { method: 'DELETE' }),
  getCategories: () => fetchJson<Category[]>('/categories'),
  createCategory: (name: string) =>
    fetchJson<Category>('/categories', { method: 'POST', body: JSON.stringify({ name }) }),
  updateCategory: (id: string, name: string) =>
    fetchJson<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),
  deleteCategory: (id: string) =>
    fetchVoid(`/categories/${id}`, { method: 'DELETE' }),
  importData: (data: { prompts: Prompt[]; categories: Category[] }) =>
    fetchJson<{ ok: boolean; promptsAdded: number; promptsSkipped: number; categoriesAdded: number; categoriesSkipped: number }>('/import', { method: 'POST', body: JSON.stringify(data) }),
  getOpenAIKeyStatus: () =>
    fetchJson<{ configured: boolean; masked: string }>('/settings/openai-key'),
  saveOpenAIKey: (key: string) =>
    fetchJson<{ ok: boolean }>('/settings/openai-key', { method: 'PUT', body: JSON.stringify({ key }) }),
  getOpenAIModel: () =>
    fetchJson<{ model: string }>('/settings/openai-model'),
  saveOpenAIModel: (model: string) =>
    fetchJson<{ ok: boolean }>('/settings/openai-model', { method: 'PUT', body: JSON.stringify({ model }) }),
  testOpenAI: () =>
    fetchJson<{ ok: boolean; model?: string; error?: string }>('/settings/test', { method: 'POST', timeoutMs: REFINE_TIMEOUT_MS }),
  getRefineContext: () =>
    fetchJson<{ context: string; isDefault: boolean }>('/settings/refine-context'),
  saveRefineContext: (context: string) =>
    fetchJson<{ ok: boolean }>('/settings/refine-context', { method: 'PUT', body: JSON.stringify({ context }) }),
  resetRefineContext: () =>
    fetchJson<{ ok: boolean }>('/settings/refine-context', { method: 'DELETE' }),
  refinePrompt: (idea: string) =>
    fetchJson<{ title: string; refinedPrompt: string }>('/refine', { method: 'POST', body: JSON.stringify({ idea }), timeoutMs: REFINE_TIMEOUT_MS }),
  uploadImage: (id: string, data: ArrayBuffer) =>
    fetchVoid(`/prompts/${id}/image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: data,
      timeoutMs: REFINE_TIMEOUT_MS,
    }),
  deleteImage: (id: string) =>
    fetchVoid(`/prompts/${id}/image`, { method: 'DELETE' }),
}
