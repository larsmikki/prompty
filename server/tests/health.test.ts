import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'

const state = vi.hoisted(() => ({ shouldThrow: false }))

vi.mock('../src/db/connection.js', () => ({
  getDb: () => ({
    exec: (sql: string) => {
      if (state.shouldThrow) throw new Error('db is gone')
      return [{ columns: ['1'], values: [[1]] }]
    },
  }),
  saveDb: vi.fn(),
  initDb: vi.fn(),
}))

import { createApp } from '../src/app.js'

const app = createApp()

describe('GET /api/health', () => {
  it('returns { status: ok } when the DB is reachable', async () => {
    state.shouldThrow = false
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })

  it('returns 503 when the DB query throws', async () => {
    state.shouldThrow = true
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(503)
    expect(res.body.status).toBe('error')
  })
})
