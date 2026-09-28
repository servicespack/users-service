import type { IUserRepository } from '../../../domain/repositories/user.repository.interface'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { User } from '../../../domain/entities/user.entity'
import {
  EmailAlreadyVerifiedError,
  UserNotFoundError,
  WrongVerificationKeyError,
} from '../../../domain/errors'
import { VerifyEmailUseCase } from './verify-email.use-case'

describe(VerifyEmailUseCase.name, () => {
  let userRepository: IUserRepository
  let useCase: VerifyEmailUseCase

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
    useCase = new VerifyEmailUseCase(userRepository)
  })

  it('should throw UserNotFoundError if user is not found', async () => {
    vi.mocked(userRepository.findById).mockResolvedValue(null)

    await expect(useCase.execute({
      userId: 'missing',
      key: 'key',
    })).rejects.toThrow(UserNotFoundError)
  })

  it('should throw EmailAlreadyVerifiedError if email is already verified', async () => {
    const user = new User({
      id: 'u1',
      name: 'User',
      email: 'a@a.com',
      username: 'u',
      password: 'p',
      isEmailVerified: true,
      emailVerificationKey: '',
    })
    vi.mocked(userRepository.findById).mockResolvedValue(user)

    await expect(useCase.execute({
      userId: 'u1',
      key: 'any',
    })).rejects.toThrow(EmailAlreadyVerifiedError)
  })

  it('should throw WrongVerificationKeyError if key does not match', async () => {
    const user = new User({
      id: 'u1',
      name: 'User',
      email: 'a@a.com',
      username: 'u',
      password: 'p',
      isEmailVerified: false,
      emailVerificationKey: User.hashToken('correct-key'),
    })
    vi.mocked(userRepository.findById).mockResolvedValue(user)

    await expect(useCase.execute({
      userId: 'u1',
      key: 'wrong-key',
    })).rejects.toThrow(WrongVerificationKeyError)
  })

  it('should verify email and persist updated user', async () => {
    const user = new User({
      id: 'u1',
      name: 'User',
      email: 'a@a.com',
      username: 'u',
      password: 'p',
      isEmailVerified: false,
      emailVerificationKey: User.hashToken('correct-key'),
    })
    vi.mocked(userRepository.findById).mockResolvedValue(user)

    await useCase.execute({
      userId: 'u1',
      key: 'correct-key',
    })

    expect(user.isEmailVerified).toBe(true)
    expect(user.emailVerificationKey).toBe('')
    expect(userRepository.update).toHaveBeenCalledWith(user)
  })
})
