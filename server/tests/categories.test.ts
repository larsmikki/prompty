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

  it('returns 400 when name is missing or empty', async () => {
    const missing = await request(app).post('/api/categories').send({})
    expect(missing.status).toBe(400)
    const empty = await request(app).post('/api/categories').send({ name: '   ' })
    expect(empty.status).toBe(400)
  })

  it('returns 409 on duplicate name (case-insensitive)', async () => {
    await request(app).post('/api/categories').send({ name: 'Work' })
    const dup = await request(app).post('/api/categories').send({ name: 'WORK' })
    expect(dup.status).toBe(409)
  })

  it('trims whitespace from the name', async () => {
    const res = await request(app).post('/api/categories').send({ name: '  Padded  ' })
    expect(res.status).toBe(201)
    expect(res.body.name).toBe('Padded')
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

  it('rename cascades to prompts referencing the old name', async () => {
    const { body: cat } = await request(app).post('/api/categories').send({ name: 'OldName' })
    const { body: prompt } = await request(app)
      .post('/api/prompts')
      .send({ title: 'P', text: 'body', category: 'OldName' })

    await request(app).put(`/api/categories/${cat.id}`).send({ name: 'NewName' })

    const { body: prompts } = await request(app).get('/api/prompts')
    const got = prompts.find((p: any) => p.id === prompt.id)
    expect(got.category).toBe('NewName')
  })

  it('returns 404 when renaming a non-existent category', async () => {
    const res = await request(app).put('/api/categories/does-not-exist').send({ name: 'X' })
    expect(res.status).toBe(404)
  })

  it('returns 400 when rename payload omits name', async () => {
    const { body: cat } = await request(app).post('/api/categories').send({ name: 'Temp' })
    const res = await request(app).put(`/api/categories/${cat.id}`).send({})
    expect(res.status).toBe(400)
  })

  it('returns 409 when renaming to a name that already exists (case-insensitive)', async () => {
    const { body: a } = await request(app).post('/api/categories').send({ name: 'Work' })
    await request(app).post('/api/categories').send({ name: 'Play' })
    const res = await request(app).put(`/api/categories/${a.id}`).send({ name: 'PLAY' })
    expect(res.status).toBe(409)
  })

  it('allows renaming to a case-different version of the same category', async () => {
    const { body: a } = await request(app).post('/api/categories').send({ name: 'work' })
    const res = await request(app).put(`/api/categories/${a.id}`).send({ name: 'Work' })
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Work')
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

  it('refuses to delete the last remaining category', async () => {
    // Only the seeded "General" category exists. Deleting it would leave none
    // for the fallback-reassignment query to find, and previously crashed.
    const { body: before } = await request(app).get('/api/categories')
    expect(before.length).toBe(1)

    const res = await request(app).delete(`/api/categories/${before[0].id}`)
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/last/i)

    // Category is still present.
    const { body: after } = await request(app).get('/api/categories')
    expect(after.length).toBe(1)
  })
})
