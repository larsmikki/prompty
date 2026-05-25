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
  it('returns counts of added/skipped entries', async () => {
    const res = await request(app).post('/api/import').send(samplePayload)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ ok: true, categoriesAdded: 1, promptsAdded: 1, categoriesSkipped: 0, promptsSkipped: 0 })
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
    expect(res.body).toMatchObject({ ok: true, promptsAdded: 0, categoriesAdded: 0 })
  })

  it('skips malformed prompts instead of crashing the import', async () => {
    const res = await request(app).post('/api/import').send({
      prompts: [
        { id: 'good', title: 'Good', text: 'has text', category: 'General', createdAt: 1 },
        { id: 'bad', title: 'Missing text', category: 'General' }, // no text → would violate NOT NULL
        { id: 'also-bad' }, // no text or category
      ],
    })
    expect(res.status).toBe(200)
    expect(res.body.promptsAdded).toBe(1)
    expect(res.body.promptsSkipped).toBe(2)

    const { body: prompts } = await request(app).get('/api/prompts')
    expect(prompts.some((p: any) => p.id === 'good')).toBe(true)
    expect(prompts.some((p: any) => p.id === 'bad')).toBe(false)
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

  it('preserves image_path on round-trip and strips cache-busting query strings', async () => {
    await request(app).post('/api/import').send({
      prompts: [
        { id: 'p-img', title: 'With image', text: 'x', category: 'General', createdAt: 1, imagePath: '/images/p-img.png?t=12345' },
      ],
    })

    const { body: prompts } = await request(app).get('/api/prompts')
    const got = prompts.find((p: any) => p.id === 'p-img')
    expect(got).toBeTruthy()
    expect(got.imagePath).toBe('/images/p-img.png')
  })

  it('drops imagePath when filename contains unsafe characters (path traversal defense)', async () => {
    await request(app).post('/api/import').send({
      prompts: [
        { id: 'p-evil', title: 'Evil', text: 'x', category: 'General', createdAt: 1, imagePath: '/images/../../etc/passwd' },
      ],
    })

    const { body: prompts } = await request(app).get('/api/prompts')
    const got = prompts.find((p: any) => p.id === 'p-evil')
    expect(got).toBeTruthy()
    expect(got.imagePath).toBeUndefined()
  })
})
