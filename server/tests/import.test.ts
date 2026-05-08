import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { createTestDb } from './helpers.js'

const state = vi.hoisted(() => ({ db: null as any }))

vi.mock('../src/db/connection.js', () => ({
  getDb: () => state.db,
  saveDb: vi.fn(),
  initDb: vi.fn(),
}))

import { createApp } from '../src/app.js'

const app = createApp()

beforeEach(async () => {
  state.db = await createTestDb()
})

const samplePayload = {
  categories: [{ id: 'cat-1', name: 'Imported' }],
  prompts: [
    { id: 'p-1', title: 'Imported Prompt', text: 'content', category: 'Imported', createdAt: 1000 },
  ],
}

describe('POST /api/import', () => {
  it('returns { ok: true }', async () => {
    const res = await request(app).post('/api/import').send(samplePayload)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })

  it('imports categories and prompts', async () => {
    await request(app).post('/api/import').send(samplePayload)

    const { body: categories } = await request(app).get('/api/categories')
    expect(categories.some((c: any) => c.id === 'cat-1' && c.name === 'Imported')).toBe(true)

    const { body: prompts } = await request(app).get('/api/prompts')
    expect(prompts.some((p: any) => p.id === 'p-1' && p.title === 'Imported Prompt')).toBe(true)
  })

  it('is idempotent — duplicate import does not create duplicates', async () => {
    await request(app).post('/api/import').send(samplePayload)
    await request(app).post('/api/import').send(samplePayload)

    const { body: prompts } = await request(app).get('/api/prompts')
    const imported = prompts.filter((p: any) => p.id === 'p-1')
    expect(imported).toHaveLength(1)
  })

  it('handles empty payload gracefully', async () => {
    const res = await request(app).post('/api/import').send({})
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })

  it('imports only prompts when categories is omitted', async () => {
    // Prompt references existing 'General' category
    const res = await request(app).post('/api/import').send({
      prompts: [{ id: 'p-2', title: 'No Cat', text: 'text', category: 'General', createdAt: 500 }],
    })
    expect(res.status).toBe(200)

    const { body: prompts } = await request(app).get('/api/prompts')
    expect(prompts.some((p: any) => p.id === 'p-2')).toBe(true)
  })
})
