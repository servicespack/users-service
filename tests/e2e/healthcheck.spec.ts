import supertest from 'supertest'
import {
  afterAll,
  describe,
  expect,
  it,
} from 'vitest'

import { server } from '../../src/infrastructure/http/server'

describe('healthcheck (e2e)', () => {
  afterAll(() => {
    server.close()
  })

  it('should respond on GET /healthcheck with status and dependencies', async () => {
    const response = await supertest(server).get('/healthcheck')
    expect([200, 503]).toContain(response.status)
    expect(response.body).toHaveProperty('status')
    expect(response.body).toHaveProperty('uptime')
    expect(response.body).toHaveProperty('timestamp')
    expect(response.body).toHaveProperty('services')
    expect(response.body.services).toHaveProperty('database')
    expect(response.body.services.database).toHaveProperty('status')
    expect(response.body.services).toHaveProperty('notifications')
    expect(response.body.services.notifications).toHaveProperty('status')
  })

  it('should respond on GET /api/healthcheck with status and dependencies', async () => {
    const response = await supertest(server).get('/api/healthcheck')
    expect([200, 503]).toContain(response.status)
    expect(response.body).toHaveProperty('status')
    expect(response.body).toHaveProperty('services')
  })

  it('should continue to respond on GET /api for backward compatibility', async () => {
    const response = await supertest(server).get('/api')
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ healthcheck: 'live' })
  })
})
