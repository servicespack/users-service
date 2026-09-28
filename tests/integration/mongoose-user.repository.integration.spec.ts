import { beforeEach, describe, expect, it } from 'vitest'
import { User } from '../../src/domain/entities/user.entity'
import { UserModel } from '../../src/infrastructure/database/mongoose/models/user.model'
import { MongooseUserRepository } from '../../src/infrastructure/database/mongoose/repositories/mongoose-user.repository'

describe('mongooseUserRepository (In-Memory MongoDB Integration)', () => {
  let repository: MongooseUserRepository

  beforeEach(async () => {
    await UserModel.deleteMany({})
    repository = new MongooseUserRepository(UserModel)
  })

  it('should create and retrieve user by id, username, and email in real in-memory MongoDB', async () => {
    const user = new User({
      name: 'Integration User',
      username: 'integration_user',
      email: 'integration@example.com',
      password: 'hashed-password-123',
    })

    const created = await repository.create(user)

    expect(created.id).toBeDefined()
    expect(created.username).toBe('integration_user')
    expect(created.email).toBe('integration@example.com')

    const byId = await repository.findById(created.id)
    expect(byId).not.toBeNull()
    expect(byId?.username).toBe('integration_user')

    const byUsername = await repository.findByUsername('integration_user')
    expect(byUsername).not.toBeNull()
    expect(byUsername?.id).toBe(created.id)

    const byEmail = await repository.findByEmail('integration@example.com')
    expect(byEmail).not.toBeNull()
    expect(byEmail?.id).toBe(created.id)
  })

  it('should update user and retrieve by reset token', async () => {
    const user = new User({
      name: 'Reset User',
      username: 'reset_user',
      email: 'reset@example.com',
      password: 'hashed-password-123',
    })

    const created = await repository.create(user)

    created.requestPasswordReset('token-xyz-123', new Date(Date.now() + 15 * 60 * 1000))

    const updated = await repository.update(created)
    expect(updated.passwordResetToken).toBe(User.hashToken('token-xyz-123'))

    const byToken = await repository.findByResetToken('token-xyz-123')
    expect(byToken).not.toBeNull()
    expect(byToken?.id).toBe(created.id)
  })

  it('should retrieve user by username or email using findByUsernameOrEmail', async () => {
    const user = new User({
      name: 'Find User',
      username: 'find_user_or_email',
      email: 'find_or_email@example.com',
      password: 'hashed-password-123',
    })

    const created = await repository.create(user)

    const byUsername = await repository.findByUsernameOrEmail('find_user_or_email')
    expect(byUsername).not.toBeNull()
    expect(byUsername?.id).toBe(created.id)

    const byEmail = await repository.findByUsernameOrEmail('FIND_OR_EMAIL@EXAMPLE.COM ')
    expect(byEmail).not.toBeNull()
    expect(byEmail?.id).toBe(created.id)
  })

  it('should retrieve user by magic login token using findByMagicLoginToken', async () => {
    const user = new User({
      name: 'Magic User',
      username: 'magic_user_123',
      email: 'magic_user_123@example.com',
      password: 'hashed-password-123',
    })

    const created = await repository.create(user)
    created.requestMagicLogin('magic-login-uuid-token', new Date(Date.now() + 15 * 60 * 1000))

    const updated = await repository.update(created)
    expect(updated.magicLoginToken).toBe(User.hashToken('magic-login-uuid-token'))

    const byMagicToken = await repository.findByMagicLoginToken('magic-login-uuid-token')
    expect(byMagicToken).not.toBeNull()
    expect(byMagicToken?.id).toBe(created.id)
  })

  it('should list users with pagination in real MongoDB', async () => {
    await repository.create(new User({
      name: 'User One',
      username: 'user_one',
      email: 'user1@example.com',
      password: 'password',
    }))

    await repository.create(new User({
      name: 'User Two',
      username: 'user_two',
      email: 'user2@example.com',
      password: 'password',
    }))

    const result = await repository.list({ page: 1, size: 1 })
    expect(result.total).toBe(2)
    expect(result.users).toHaveLength(1)
  })
})
