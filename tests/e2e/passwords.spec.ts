import { faker } from '@faker-js/faker'
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

describe('passwords (e2e)', () => {
  afterAll(() => {
    server.close()
  })

  describe('post /api/auth/forgot-password', () => {
    it('should generate a reset token and return 200 when email exists', async () => {
      const user = mockUser()

      await supertest(server)
        .post('/api/users')
        .send(user)
        .expect(201)

      const response = await supertest(server)
        .post('/api/auth/forgot-password')
        .send({ email: user.email })
        .expect(200)

      expect(response.body).toEqual({
        message: 'If the email exists, a password reset link has been sent.',
      })

      const dbUser = await UserModel.findOne({ email: user.email })
      expect(dbUser).toBeDefined()
      expect(dbUser?.passwordResetToken).toBeDefined()
      expect(typeof dbUser?.passwordResetToken).toBe('string')
      expect(dbUser?.passwordResetExpiresAt).toBeDefined()
      expect(dbUser!.passwordResetExpiresAt!.getTime()).toBeGreaterThan(Date.now())
    })

    it('should return 200 without revealing if email does not exist (OWASP anti-enumeration)', async () => {
      const response = await supertest(server)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200)

      expect(response.body).toEqual({
        message: 'If the email exists, a password reset link has been sent.',
      })
    })

    it('should return 400 on missing or invalid email', async () => {
      await supertest(server)
        .post('/api/auth/forgot-password')
        .send({})
        .expect(400)

      await supertest(server)
        .post('/api/auth/forgot-password')
        .send({ email: 'not-an-email' })
        .expect(400)
    })
  })

  describe('post /api/auth/reset-password', () => {
    it('should successfully reset password with valid token', async () => {
      const user = mockUser()
      const sendEmailSpy = vi.spyOn(HttpNotificationSender.prototype, 'sendEmail')

      await supertest(server)
        .post('/api/users')
        .send(user)
        .expect(201)

      await supertest(server)
        .post('/api/auth/forgot-password')
        .send({ email: user.email })
        .expect(200)

      const dbUser = await UserModel.findOne({ email: user.email })

      expect(sendEmailSpy).toHaveBeenCalled()
      const lastCall = sendEmailSpy.mock.calls[sendEmailSpy.mock.calls.length - 1]
      const resetToken = lastCall[0].variables.token

      const { User } = await import('../../src/domain/entities/user.entity')
      expect(dbUser?.passwordResetToken).toBe(User.hashToken(resetToken))

      const newPassword = faker.internet.password({ length: 12 })

      const response = await supertest(server)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: newPassword,
        })
        .expect(200)

      expect(response.body).toEqual({
        message: 'Password successfully reset.',
      })

      // Old password should no longer work
      await supertest(server)
        .post('/api/tokens')
        .send({
          username: user.username,
          password: user.password,
        })
        .expect(401)

      // New password should work
      await supertest(server)
        .post('/api/tokens')
        .send({
          username: user.username,
          password: newPassword,
        })
        .expect(201)

      // Reset token and expiry should be cleared
      const updatedDbUser = await UserModel.findOne({ email: user.email })
      expect(updatedDbUser?.passwordResetToken).toBeFalsy()
      expect(updatedDbUser?.passwordResetExpiresAt).toBeFalsy()

      sendEmailSpy.mockRestore()
    })

    it('should return 400 when token is invalid', async () => {
      await supertest(server)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token-123',
          password: 'newValidPassword123',
        })
        .expect(400)
    })

    it('should return 400 when token is expired', async () => {
      const user = mockUser()
      const sendEmailSpy = vi.spyOn(HttpNotificationSender.prototype, 'sendEmail')

      await supertest(server)
        .post('/api/users')
        .send(user)
        .expect(201)

      await supertest(server)
        .post('/api/auth/forgot-password')
        .send({ email: user.email })
        .expect(200)

      expect(sendEmailSpy).toHaveBeenCalled()
      const lastCall = sendEmailSpy.mock.calls[sendEmailSpy.mock.calls.length - 1]
      const resetToken = lastCall[0].variables.token

      // Manually expire token in database
      await UserModel.updateOne(
        { email: user.email },
        { passwordResetExpiresAt: new Date(Date.now() - 1000) },
      )

      await supertest(server)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: 'newValidPassword123',
        })
        .expect(400)

      sendEmailSpy.mockRestore()
    })

    it('should return 400 when password is too short (< 8 characters)', async () => {
      await supertest(server)
        .post('/api/auth/reset-password')
        .send({
          token: 'any-token',
          password: 'short',
        })
        .expect(400)
    })
  })
})
