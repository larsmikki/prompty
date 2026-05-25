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

describe('GET /api/settings/openai-key', () => {
  it('returns configured=false when no key is stored', async () => {
    const res = await request(app).get('/api/settings/openai-key')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ configured: false, masked: '' })
  })

  it('returns configured=true with masked tail after a key is stored', async () => {
    await request(app).put('/api/settings/openai-key').send({ key: 'sk-secret-1234' })
    const res = await request(app).get('/api/settings/openai-key')
    expect(res.body.configured).toBe(true)
    expect(res.body.masked).toBe('***1234')
  })
})

describe('PUT /api/settings/openai-key', () => {
  it('stores a key and returns ok', async () => {
    const res = await request(app).put('/api/settings/openai-key').send({ key: 'sk-abc-9999' })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })

  it('overwrites an existing key', async () => {
    await request(app).put('/api/settings/openai-key').send({ key: 'sk-first-1111' })
    await request(app).put('/api/settings/openai-key').send({ key: 'sk-second-2222' })
    const { body } = await request(app).get('/api/settings/openai-key')
    expect(body.masked).toBe('***2222')
  })

  it('clears the stored key when passed an empty string', async () => {
    await request(app).put('/api/settings/openai-key').send({ key: 'sk-temp-7777' })
    const before = await request(app).get('/api/settings/openai-key')
    expect(before.body.configured).toBe(true)

    const res = await request(app).put('/api/settings/openai-key').send({ key: '' })
    expect(res.status).toBe(200)

    const after = await request(app).get('/api/settings/openai-key')
    expect(after.body.configured).toBe(false)
    expect(after.body.masked).toBe('')
  })

  it('returns 400 when key is not a string', async () => {
    const res = await request(app).put('/api/settings/openai-key').send({ key: 123 })
    expect(res.status).toBe(400)
  })
})

describe('GET /api/settings/openai-model', () => {
  it('defaults to gpt-4o-mini when unset', async () => {
    const res = await request(app).get('/api/settings/openai-model')
    expect(res.status).toBe(200)
    expect(res.body.model).toBe('gpt-4o-mini')
  })

  it('returns the stored model', async () => {
    await request(app).put('/api/settings/openai-model').send({ model: 'gpt-5' })
    const res = await request(app).get('/api/settings/openai-model')
    expect(res.body.model).toBe('gpt-5')
  })

  it('PUT trims whitespace from the model value', async () => {
    await request(app).put('/api/settings/openai-model').send({ model: '  gpt-4o  ' })
    const res = await request(app).get('/api/settings/openai-model')
    expect(res.body.model).toBe('gpt-4o')
  })

  it('PUT rejects empty/whitespace-only model with 400', async () => {
    const empty = await request(app).put('/api/settings/openai-model').send({ model: '' })
    expect(empty.status).toBe(400)
    const blank = await request(app).put('/api/settings/openai-model').send({ model: '   ' })
    expect(blank.status).toBe(400)
  })
})
