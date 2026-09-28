import jwt from 'jsonwebtoken'
import supertest from 'supertest'
import {
  afterAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import { UserModel } from '../../src/infrastructure/database/mongoose/models/user.model'
import { server } from '../../src/infrastructure/http/server'
import { HttpNotificationSender } from '../../src/infrastructure/notifications/http-notification-sender'
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

  it('should authenticate using user\'s email as username', async () => {
    const user = mockUser()

    await supertest(server)
      .post('/api/users')
      .send(user)

    const { body } = await supertest(server)
      .post('/api/tokens')
      .send({
        username: user.email,
        password: user.password,
      })
      .expect(201)

    expect(body.Authorization).toBeDefined()
    expect(body.RefreshToken).toBeDefined()
  })

  it('should request a magic login link and successfully login with the token', async () => {
    const user = mockUser()
    const sendEmailSpy = vi.spyOn(HttpNotificationSender.prototype, 'sendEmail')

    await supertest(server)
      .post('/api/users')
      .send(user)

    // Request magic link
    await supertest(server)
      .post('/api/auth/magic-link/request')
      .send({ email: user.email })
      .expect(200)

    // Query the database to retrieve the magic token
    const dbUser = await UserModel.findOne({ email: user.email })
    expect(dbUser).not.toBeNull()

    expect(sendEmailSpy).toHaveBeenCalled()
    const lastCall = sendEmailSpy.mock.calls[sendEmailSpy.mock.calls.length - 1]
    const token = lastCall[0].variables.token

    const { User } = await import('../../src/domain/entities/user.entity')
    expect(dbUser!.magicLoginToken).toBe(User.hashToken(token))

    // Login with the magic token
    const { body } = await supertest(server)
      .post('/api/auth/magic-link/login')
      .send({ token })
      .expect(201)

    expect(body.Authorization).toBeDefined()
    expect(body.RefreshToken).toBeDefined()

    // Try to login again (should fail because it's single use)
    await supertest(server)
      .post('/api/auth/magic-link/login')
      .send({ token })
      .expect(401)

    sendEmailSpy.mockRestore()
  })

  it('should fail magic login if token is expired', async () => {
    const user = mockUser()
    const sendEmailSpy = vi.spyOn(HttpNotificationSender.prototype, 'sendEmail')

    await supertest(server)
      .post('/api/users')
      .send(user)

    // Request magic link
    await supertest(server)
      .post('/api/auth/magic-link/request')
      .send({ email: user.email })
      .expect(200)

    expect(sendEmailSpy).toHaveBeenCalled()
    const lastCall = sendEmailSpy.mock.calls[sendEmailSpy.mock.calls.length - 1]
    const token = lastCall[0].variables.token

    // Artificially expire the token in database
    await UserModel.updateOne(
      { email: user.email },
      { magicLoginExpiresAt: new Date(Date.now() - 1000) },
    )

    // Attempt login (should fail)
    await supertest(server)
      .post('/api/auth/magic-link/login')
      .send({ token })
      .expect(401)

    sendEmailSpy.mockRestore()
  })
})
