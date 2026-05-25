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

describe('GET /api/prompts', () => {
  it('returns empty array when no prompts exist', async () => {
    const res = await request(app).get('/api/prompts')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('returns prompts ordered by created_at DESC', async () => {
    await request(app).post('/api/prompts').send({ title: 'First', text: 'text1', category: 'General', createdAt: 1000 })
    await request(app).post('/api/prompts').send({ title: 'Second', text: 'text2', category: 'General', createdAt: 2000 })

    const res = await request(app).get('/api/prompts')
    expect(res.status).toBe(200)
    expect(res.body[0].title).toBe('Second')
    expect(res.body[1].title).toBe('First')
  })
})

describe('POST /api/prompts', () => {
  it('creates a prompt and returns 201', async () => {
    const res = await request(app)
      .post('/api/prompts')
      .send({ title: 'My Prompt', text: 'Do something', category: 'General' })

    expect(res.status).toBe(201)
    expect(res.body.title).toBe('My Prompt')
    expect(res.body.text).toBe('Do something')
    expect(res.body.category).toBe('General')
    expect(res.body.id).toBeTruthy()
    expect(res.body.createdAt).toBeTruthy()
  })

  it('accepts a client-supplied UUID', async () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000'
    const res = await request(app)
      .post('/api/prompts')
      .send({ id: uuid, title: 'T', text: 'body', category: 'General' })

    expect(res.status).toBe(201)
    expect(res.body.id).toBe(uuid)
  })

  it('replaces a non-UUID id with a generated UUID (blocks path traversal)', async () => {
    const res = await request(app)
      .post('/api/prompts')
      .send({ id: '../../etc/passwd', title: 'T', text: 'body', category: 'General' })

    expect(res.status).toBe(201)
    expect(res.body.id).not.toBe('../../etc/passwd')
    expect(res.body.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  })

  it('defaults title to empty string when omitted', async () => {
    const res = await request(app)
      .post('/api/prompts')
      .send({ text: 'no title', category: 'General' })

    expect(res.status).toBe(201)
    expect(res.body.title).toBe('')
  })

  it('persists the prompt so GET returns it', async () => {
    await request(app).post('/api/prompts').send({ title: 'Persisted', text: 'x', category: 'General' })

    const res = await request(app).get('/api/prompts')
    expect(res.body).toHaveLength(1)
    expect(res.body[0].title).toBe('Persisted')
  })

  it('returns 400 when text is missing', async () => {
    const res = await request(app).post('/api/prompts').send({ title: 'T', category: 'General' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/text/i)
  })

  it('returns 400 when category is missing', async () => {
    const res = await request(app).post('/api/prompts').send({ title: 'T', text: 'x' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/category/i)
  })
})

describe('PUT /api/prompts/:id', () => {
  it('updates a prompt', async () => {
    const created = await request(app)
      .post('/api/prompts')
      .send({ title: 'Old', text: 'old text', category: 'General' })

    const { id } = created.body

    const res = await request(app)
      .put(`/api/prompts/${id}`)
      .send({ title: 'New', text: 'new text', category: 'General' })

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ id, title: 'New', text: 'new text', category: 'General' })
  })

  it('returns 404 when updating a non-existent prompt', async () => {
    const res = await request(app)
      .put('/api/prompts/does-not-exist')
      .send({ title: 'T', text: 'x', category: 'General' })
    expect(res.status).toBe(404)
  })

  it('returns 400 when update payload is missing text', async () => {
    const { body: created } = await request(app)
      .post('/api/prompts')
      .send({ title: 'T', text: 'old', category: 'General' })
    const res = await request(app)
      .put(`/api/prompts/${created.id}`)
      .send({ title: 'T', category: 'General' })
    expect(res.status).toBe(400)
  })

  it('update is reflected in GET', async () => {
    const { body: created } = await request(app)
      .post('/api/prompts')
      .send({ title: 'Before', text: 'before', category: 'General' })

    await request(app)
      .put(`/api/prompts/${created.id}`)
      .send({ title: 'After', text: 'after', category: 'General' })

    const { body: prompts } = await request(app).get('/api/prompts')
    expect(prompts[0].title).toBe('After')
  })
})

describe('POST /api/prompts/:id/image', () => {
  it('rejects a non-UUID id with 400 (path traversal defense)', async () => {
    const res = await request(app)
      .post('/api/prompts/..%2F..%2Fevil/image')
      .set('Content-Type', 'application/octet-stream')
      .send(Buffer.from([0x89, 0x50, 0x4e, 0x47]))

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/invalid/i)
  })

  it('returns 404 when the prompt does not exist (valid UUID, no row)', async () => {
    const res = await request(app)
      .post('/api/prompts/550e8400-e29b-41d4-a716-446655440000/image')
      .set('Content-Type', 'application/octet-stream')
      .send(Buffer.from([0x89, 0x50, 0x4e, 0x47]))

    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/prompts/:id', () => {
  it('deletes a prompt and returns 204', async () => {
    const { body: created } = await request(app)
      .post('/api/prompts')
      .send({ title: 'To delete', text: 'bye', category: 'General' })

    const res = await request(app).delete(`/api/prompts/${created.id}`)
    expect(res.status).toBe(204)
  })

  it('prompt is gone after deletion', async () => {
    const { body: created } = await request(app)
      .post('/api/prompts')
      .send({ title: 'Gone', text: 'poof', category: 'General' })

    await request(app).delete(`/api/prompts/${created.id}`)

    const { body: prompts } = await request(app).get('/api/prompts')
    expect(prompts).toHaveLength(0)
  })
})
