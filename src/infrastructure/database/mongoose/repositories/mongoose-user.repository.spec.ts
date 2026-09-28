import { describe, expect, it, vi } from 'vitest'
import { User } from '../../../../domain/entities/user.entity'
import { UserNotFoundError } from '../../../../domain/errors'
import { MongooseUserRepository } from './mongoose-user.repository'

describe(MongooseUserRepository.name, () => {
  it('should return null when finding by email and document is not found', async () => {
    const mockModel = {
      findOne: vi.fn().mockResolvedValue(null),
    } as any
    const repository = new MongooseUserRepository(mockModel)

    const result = await repository.findByEmail('notfound@example.com')
    expect(result).toBeNull()
  })

  it('should return null when finding by reset token and document is not found', async () => {
    const mockModel = {
      findOne: vi.fn().mockResolvedValue(null),
    } as any
    const repository = new MongooseUserRepository(mockModel)

    const result = await repository.findByResetToken('nonexistent-token')
    expect(result).toBeNull()
    expect(mockModel.findOne).toHaveBeenCalledWith({ passwordResetToken: User.hashToken('nonexistent-token') })
  })

  it('should throw UserNotFoundError when updating non-existent user', async () => {
    const mockModel = {
      findById: vi.fn().mockResolvedValue(null),
    } as any
    const repository = new MongooseUserRepository(mockModel)
    const user = new User({
      id: 'invalid-id',
      name: 'name',
      username: 'username',
      email: 'email',
      password: 'password',
    })

    await expect(repository.update(user)).rejects.toThrow(UserNotFoundError)
  })

  it('should update user roles and save', async () => {
    const mockDoc = {
      id: 'user-id-1',
      name: 'name',
      username: 'username',
      email: 'email@example.com',
      password: 'password',
      isEmailVerified: true,
      emailVerificationKey: '',
      roles: ['user'],
      passwordResetToken: undefined,
      passwordResetExpiresAt: undefined,
      save: vi.fn().mockResolvedValue(undefined),
    }
    const mockModel = {
      findById: vi.fn().mockResolvedValue(mockDoc),
    } as any
    const repository = new MongooseUserRepository(mockModel)
    const user = new User({
      id: 'user-id-1',
      name: 'name',
      username: 'username',
      email: 'email@example.com',
      password: 'password',
      roles: ['admin', 'user'],
    })

    const updated = await repository.update(user)
    expect(mockDoc.roles).toEqual(['admin', 'user'])
    expect(mockDoc.save).toHaveBeenCalled()
    expect(updated.roles).toEqual(['admin', 'user'])
  })
})
