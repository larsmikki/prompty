import type { Prompt, Category } from './types'

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
}
