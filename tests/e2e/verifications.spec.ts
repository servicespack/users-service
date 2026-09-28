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

describe('verifications (e2e)', () => {
  afterAll(() => {
    server.close()
  })

  it('should verify email successfully', async () => {
    const user = mockUser()
    const sendEmailSpy = vi.spyOn(HttpNotificationSender.prototype, 'sendEmail')

    await supertest(server)
      .post('/api/users')
      .send(user)
      .expect(201)

    const dbUser = await UserModel.findOne({ email: user.email })
    expect(dbUser).toBeDefined()
    expect(dbUser?.isEmailVerified).toBe(false)

    expect(sendEmailSpy).toHaveBeenCalled()
    const lastCall = sendEmailSpy.mock.calls[sendEmailSpy.mock.calls.length - 1]
    const rawKey = lastCall[0].variables.verificationUrl

    const { User } = await import('../../src/domain/entities/user.entity')
    expect(dbUser?.emailVerificationKey).toBe(User.hashToken(rawKey))

    await supertest(server)
      .post('/api/verifications')
      .send({
        user_id: dbUser?._id.toString(),
        type: 'email',
        key: rawKey,
      })
      .expect(201)

    const verifiedUser = await UserModel.findOne({ email: user.email })
    expect(verifiedUser?.isEmailVerified).toBe(true)
    expect(verifiedUser?.emailVerificationKey).toBe('')

    sendEmailSpy.mockRestore()
  })

  it('should return 400 Bad Request on missing fields', async () => {
    await supertest(server)
      .post('/api/verifications')
      .send({
        type: 'email',
      })
      .expect(400)
  })

  it('should return 401 on wrong verification key', async () => {
    const user = mockUser()

    await supertest(server)
      .post('/api/users')
      .send(user)
      .expect(201)

    const dbUser = await UserModel.findOne({ email: user.email })

    await supertest(server)
      .post('/api/verifications')
      .send({
        user_id: dbUser?._id.toString(),
        type: 'email',
        key: 'invalid-key',
      })
      .expect(401)
  })

  it('should return 400 if email already verified', async () => {
    const user = mockUser()
    const sendEmailSpy = vi.spyOn(HttpNotificationSender.prototype, 'sendEmail')

    await supertest(server)
      .post('/api/users')
      .send(user)
      .expect(201)

    const dbUser = await UserModel.findOne({ email: user.email })

    expect(sendEmailSpy).toHaveBeenCalled()
    const lastCall = sendEmailSpy.mock.calls[sendEmailSpy.mock.calls.length - 1]
    const rawKey = lastCall[0].variables.verificationUrl

    await supertest(server)
      .post('/api/verifications')
      .send({
        user_id: dbUser?._id.toString(),
        type: 'email',
        key: rawKey,
      })
      .expect(201)

    await supertest(server)
      .post('/api/verifications')
      .send({
        user_id: dbUser?._id.toString(),
        type: 'email',
        key: rawKey,
      })
      .expect(400)

    sendEmailSpy.mockRestore()
  })
})
