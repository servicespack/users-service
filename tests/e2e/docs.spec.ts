import supertest from 'supertest'
import {
  afterAll,
  describe,
  expect,
  it,
} from 'vitest'

import { swaggerDocument } from '../../src/docs/swagger'
import { server } from '../../src/infrastructure/http/server'

describe('docs (e2e)', () => {
  afterAll(() => {
    server.close()
  })

  it('should serve Swagger UI at /docs', async () => {
    const response = await supertest(server).get('/docs')
    expect([200, 301]).toContain(response.status)
  })

  it('should serve Swagger UI HTML at /docs/', async () => {
    const response = await supertest(server)
      .get('/docs/')
      .expect(200)
      .expect('Content-Type', /html/)

    expect(response.text).toContain('swagger-ui')
  })

  it('should serve Swagger JSON specification at /docs/swagger.json', async () => {
    const response = await supertest(server)
      .get('/docs/swagger.json')
      .expect(200)
      .expect('Content-Type', /json/)

    expect(response.body).toEqual(swaggerDocument)
    expect(response.body.openapi).toBe('3.0.0')
    expect(response.body.paths).toHaveProperty('/api')
    expect(response.body.paths).toHaveProperty('/api/tokens')
    expect(response.body.paths).toHaveProperty('/api/users')
    expect(response.body.paths).toHaveProperty('/api/users/{id}')
    expect(response.body.paths).toHaveProperty('/api/users/{id}/password')
    expect(response.body.paths).toHaveProperty('/api/verifications')
    expect(response.body.components.schemas).toHaveProperty('User')
    expect(response.body.components.schemas).toHaveProperty('CreateUserDto')
    expect(response.body.components.schemas).toHaveProperty('UpdateUserDto')
    expect(response.body.components.schemas).toHaveProperty('UpdateUserPasswordDto')
    expect(response.body.components.schemas).toHaveProperty('CreateTokenDto')
    expect(response.body.components.schemas).toHaveProperty('CreateVerificationDto')
    expect(response.body.components.schemas).toHaveProperty('ErrorResponse')
    expect(response.body.components.securitySchemes).toHaveProperty('bearerAuth')
  })

  it('should redirect /api/docs to /docs', async () => {
    const response = await supertest(server).get('/api/docs')
    expect([200, 301, 302]).toContain(response.status)
  })

  it('should redirect /api/docs/swagger.json to /docs/swagger.json', async () => {
    const response = await supertest(server).get('/api/docs/swagger.json')
    expect([200, 301, 302]).toContain(response.status)
  })
})
