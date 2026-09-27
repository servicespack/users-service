import jwt from 'jsonwebtoken'
import supertest from 'supertest'
import {
  afterAll,
  describe,
  expect,
  it,
} from 'vitest'

import { server } from '../../src/infrastructure/http/server'
import { mockUser } from '../__mocks__/user'

describe('tokens (e2e)', () => {
  afterAll(() => {
    server.close()
  })

  it('should create a token with default roles', async () => {
    const user = mockUser()

    await supertest(server)
      .post('/api/users')
      .send(user)

    const { body } = await supertest(server)
      .post('/api/tokens')
      .send({
        username: user.username,
        password: user.password,
      })
      .expect(201)

    expect(body).toEqual({
      // eslint-disable-next-line regexp/no-super-linear-backtracking, regexp/strict
      Authorization: expect.stringMatching(/^Bearer [\w-.~+/]+=*(?:\.[\w-.~+/]+=*)*$/),
      RefreshToken: expect.any(String),
    })

    const token = body.Authorization.split(' ')[1]
    const decoded = jwt.decode(token) as { sub: string, roles: string[] }
    expect(decoded.roles).toEqual(['user'])
  })

  it('should create a token with custom roles when user has custom roles', async () => {
    const user = {
      ...mockUser(),
      roles: ['admin'],
    }

    await supertest(server)
      .post('/api/users')
      .send(user)

    const { body } = await supertest(server)
      .post('/api/tokens')
      .send({
        username: user.username,
        password: user.password,
      })
      .expect(201)

    const token = body.Authorization.split(' ')[1]
    const decoded = jwt.decode(token) as { sub: string, roles: string[] }
    expect(decoded.roles).toEqual(['admin'])
  })

  it('should refresh token and preserve user roles in the new access token', async () => {
    const user = {
      ...mockUser(),
      roles: ['admin', 'manager'],
    }

    await supertest(server)
      .post('/api/users')
      .send(user)

    const tokenRes = await supertest(server)
      .post('/api/tokens')
      .send({
        username: user.username,
        password: user.password,
      })
      .expect(201)

    const { body: refreshBody } = await supertest(server)
      .post('/api/auth/refresh-token')
      .send({
        refreshToken: tokenRes.body.RefreshToken,
      })
      .expect(201)

    const newToken = refreshBody.Authorization.split(' ')[1]
    const decoded = jwt.decode(newToken) as { sub: string, roles: string[] }
    expect(decoded.roles).toEqual(['admin', 'manager'])
  })

  it('should return 400 Bad Request when username or password is empty', async () => {
    await supertest(server)
      .post('/api/tokens')
      .send({
        username: '',
        password: '',
      })
      .expect(400)
  })
})
