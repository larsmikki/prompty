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

describe('GET /api/categories', () => {
  it('returns the default General category', async () => {
    const res = await request(app).get('/api/categories')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([{ id: 'general', name: 'General' }])
  })

  it('returns categories sorted by name', async () => {
    await request(app).post('/api/categories').send({ name: 'Zebra' })
    await request(app).post('/api/categories').send({ name: 'Alpha' })

    const res = await request(app).get('/api/categories')
    const names = res.body.map((c: any) => c.name)
    expect(names).toEqual(['Alpha', 'General', 'Zebra'])
  })
})

describe('POST /api/categories', () => {
  it('creates a category and returns 201', async () => {
    const res = await request(app).post('/api/categories').send({ name: 'Work' })
    expect(res.status).toBe(201)
    expect(res.body.name).toBe('Work')
    expect(res.body.id).toBeTruthy()
  })

  it('accepts a custom id', async () => {
    const res = await request(app).post('/api/categories').send({ id: 'my-id', name: 'Custom' })
    expect(res.status).toBe(201)
    expect(res.body.id).toBe('my-id')
  })

  it('new category appears in GET', async () => {
    await request(app).post('/api/categories').send({ name: 'NewCat' })
    const { body } = await request(app).get('/api/categories')
    expect(body.some((c: any) => c.name === 'NewCat')).toBe(true)
  })
})

describe('PUT /api/categories/:id', () => {
  it('renames a category', async () => {
    const { body: created } = await request(app).post('/api/categories').send({ name: 'Old Name' })
    const res = await request(app).put(`/api/categories/${created.id}`).send({ name: 'New Name' })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ id: created.id, name: 'New Name' })
  })

  it('rename is reflected in GET', async () => {
    const { body: created } = await request(app).post('/api/categories').send({ name: 'Before' })
    await request(app).put(`/api/categories/${created.id}`).send({ name: 'After' })
    const { body } = await request(app).get('/api/categories')
    expect(body.some((c: any) => c.name === 'After')).toBe(true)
    expect(body.some((c: any) => c.name === 'Before')).toBe(false)
  })
})

describe('DELETE /api/categories/:id', () => {
  it('returns 404 when category does not exist', async () => {
    const res = await request(app).delete('/api/categories/nonexistent')
    expect(res.status).toBe(404)
  })

  it('deletes a category and reassigns its prompts to the fallback', async () => {
    // Add a second category so deletion has a fallback
    const { body: work } = await request(app).post('/api/categories').send({ name: 'Work' })

    // Create a prompt in Work
    const { body: prompt } = await request(app)
      .post('/api/prompts')
      .send({ title: 'P', text: 'body', category: 'Work' })

    // Delete Work category
    const res = await request(app).delete(`/api/categories/${work.id}`)
    expect(res.status).toBe(204)

    // Prompt should now have the fallback category (General)
    const { body: prompts } = await request(app).get('/api/prompts')
    expect(prompts[0].id).toBe(prompt.id)
    expect(prompts[0].category).toBe('General')
  })

  it('category is removed from GET after deletion', async () => {
    const { body: extra } = await request(app).post('/api/categories').send({ name: 'Temp' })
    await request(app).delete(`/api/categories/${extra.id}`)
    const { body } = await request(app).get('/api/categories')
    expect(body.some((c: any) => c.name === 'Temp')).toBe(false)
  })
})
