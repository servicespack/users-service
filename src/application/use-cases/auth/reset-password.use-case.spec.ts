import type { IUserRepository } from '../../../domain/repositories/user.repository.interface'
import type { IPasswordHasher } from '../../ports/password-hasher.port'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { User } from '../../../domain/entities/user.entity'
import {
  InvalidResetTokenError,
  ResetTokenExpiredError,
} from '../../../domain/errors'
import { ResetPasswordUseCase } from './reset-password.use-case'

describe(ResetPasswordUseCase.name, () => {
  let userRepository: IUserRepository
  let passwordHasher: IPasswordHasher
  let useCase: ResetPasswordUseCase

  beforeEach(() => {
    userRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByUsername: vi.fn(),
      findByEmail: vi.fn(),
      findByResetToken: vi.fn(),
      findByUsernameOrEmail: vi.fn(),
      findByMagicLoginToken: vi.fn(),
      list: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }
    passwordHasher = {
      hash: vi.fn().mockResolvedValue('new-hashed-password'),
      verify: vi.fn(),
    }
    useCase = new ResetPasswordUseCase(userRepository, passwordHasher)
  })

  it('should throw InvalidResetTokenError if no user matches token', async () => {
    vi.mocked(userRepository.findByResetToken).mockResolvedValue(null)

    await expect(useCase.execute({
      token: 'invalid-token',
      password: 'newPassword123',
    })).rejects.toThrow(InvalidResetTokenError)
  })

  it('should throw ResetTokenExpiredError if token is expired', async () => {
    const user = new User({
      id: 'u1',
      name: 'John',
      email: 'john@example.com',
      username: 'john',
      password: 'old-password',
      passwordResetToken: User.hashToken('expired-token'),
      passwordResetExpiresAt: new Date(Date.now() - 1000),
    })
    vi.mocked(userRepository.findByResetToken).mockResolvedValue(user)

    await expect(useCase.execute({
      token: 'expired-token',
      password: 'newPassword123',
    })).rejects.toThrow(ResetTokenExpiredError)
  })

  it('should hash new password, reset password and persist user when token is valid', async () => {
    const user = new User({
      id: 'u1',
      name: 'John',
      email: 'john@example.com',
      username: 'john',
      password: 'old-password',
      passwordResetToken: User.hashToken('valid-token'),
      passwordResetExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    })
    vi.mocked(userRepository.findByResetToken).mockResolvedValue(user)

    await useCase.execute({
      token: 'valid-token',
      password: 'newPassword123',
    })

    expect(passwordHasher.hash).toHaveBeenCalledWith('newPassword123')
    expect(user.password).toBe('new-hashed-password')
    expect(user.passwordResetToken).toBeUndefined()
    expect(user.passwordResetExpiresAt).toBeUndefined()
    expect(userRepository.update).toHaveBeenCalledWith(user)
  })
})
