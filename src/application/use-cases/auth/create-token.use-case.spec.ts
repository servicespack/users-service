import type { IUserRepository } from '../../../domain/repositories/user.repository.interface'
import type { IPasswordHasher } from '../../ports/password-hasher.port'
import type { ITokenProvider } from '../../ports/token-provider.port'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { User } from '../../../domain/entities/user.entity'
import { InvalidCredentialsError } from '../../../domain/errors'
import { CreateTokenUseCase } from './create-token.use-case'

describe(CreateTokenUseCase.name, () => {
  let userRepository: IUserRepository
  let passwordHasher: IPasswordHasher
  let tokenProvider: ITokenProvider
  let useCase: CreateTokenUseCase

  beforeEach(() => {
    userRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByUsername: vi.fn(),
      findByEmail: vi.fn(),
      findByResetToken: vi.fn(),
      list: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }
    passwordHasher = {
      hash: vi.fn(),
      verify: vi.fn(),
    }
    tokenProvider = {
      generate: vi.fn().mockReturnValue('mocked.jwt.token'),
    }
    useCase = new CreateTokenUseCase(userRepository, passwordHasher, tokenProvider, { create: vi.fn() } as any)
  })

  it('should throw InvalidCredentialsError if user does not exist', async () => {
    vi.mocked(userRepository.findByUsername).mockResolvedValue(null)

    await expect(useCase.execute({
      username: 'unknown',
      password: 'password',
    })).rejects.toThrow(InvalidCredentialsError)
  })

  it('should throw InvalidCredentialsError if password does not match', async () => {
    const user = new User({
      id: 'u1',
      name: 'User',
      email: 'user@a.com',
      username: 'user',
      password: 'hash',
    })
    vi.mocked(userRepository.findByUsername).mockResolvedValue(user)
    vi.mocked(passwordHasher.verify).mockResolvedValue(false)

    await expect(useCase.execute({
      username: 'user',
      password: 'wrongpassword',
    })).rejects.toThrow(InvalidCredentialsError)
  })

  it('should generate and return token for valid credentials', async () => {
    const user = new User({
      id: 'u1',
      name: 'User',
      email: 'user@a.com',
      username: 'user',
      password: 'hash',
    })
    vi.mocked(userRepository.findByUsername).mockResolvedValue(user)
    vi.mocked(passwordHasher.verify).mockResolvedValue(true)

    const result = await useCase.execute({
      username: 'user',
      password: 'correctpassword',
    })

    expect(tokenProvider.generate).toHaveBeenCalledWith({
      iss: 'users-service',
      sub: 'u1',
      roles: ['user'],
    })
    expect(result.accessToken).toBe('mocked.jwt.token')
    expect(result.refreshToken).toBeTypeOf('string')
    expect(result.refreshToken).toHaveLength(80)
  })
})
