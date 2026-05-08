import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'

vi.mock('../src/db/connection.js', () => ({
  getDb: vi.fn(),
  saveDb: vi.fn(),
  initDb: vi.fn(),
}))

import { createApp } from '../src/app.js'

const app = createApp()

describe('GET /api/health', () => {
  it('returns { status: ok }', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })
})
