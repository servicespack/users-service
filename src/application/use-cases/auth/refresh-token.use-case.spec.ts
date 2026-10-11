import type { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface'
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface'
import type { ITokenProvider } from '../../ports/token-provider.port'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RefreshToken } from '../../../domain/entities/refresh-token.entity'
import { User } from '../../../domain/entities/user.entity'
import { InvalidTokenError } from '../../../domain/errors'
import { RefreshTokenUseCase } from './refresh-token.use-case'

describe(RefreshTokenUseCase.name, () => {
  let refreshTokenRepository: IRefreshTokenRepository
  let userRepository: IUserRepository
  let tokenProvider: ITokenProvider
  let useCase: RefreshTokenUseCase

  beforeEach(() => {
    refreshTokenRepository = {
      create: vi.fn(),
      consumeValid: vi.fn(),
      findByToken: vi.fn(),
      update: vi.fn(),
      revokeAllForUser: vi.fn(),
    }
    userRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByUsername: vi.fn(),
      findByEmail: vi.fn(),
      findByResetToken: vi.fn(),
      findByUsernameOrEmail: vi.fn(),
      findByMagicLoginToken: vi.fn(),
      consumeMagicLoginToken: vi.fn(),
      list: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }
    tokenProvider = {
      generate: vi.fn().mockReturnValue('new.access.token'),
    }
    useCase = new RefreshTokenUseCase(refreshTokenRepository, tokenProvider, userRepository)
  })

  it('should throw InvalidTokenError if refresh token does not exist', async () => {
    vi.mocked(refreshTokenRepository.consumeValid).mockResolvedValue(null)

    await expect(useCase.execute({
      refreshToken: 'non-existent',
    })).rejects.toThrow(InvalidTokenError)
  })

  it('should throw InvalidTokenError if refresh token is expired or revoked', async () => {
    vi.mocked(refreshTokenRepository.consumeValid).mockResolvedValue(null)

    await expect(useCase.execute({
      refreshToken: 'expired-or-revoked-token',
    })).rejects.toThrow(InvalidTokenError)
  })

  it('should throw InvalidTokenError if user is not found when userRepository is provided', async () => {
    const existingToken = new RefreshToken({
      id: 'token-id',
      token: 'valid-token',
      userId: 'user-id',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })

    vi.mocked(refreshTokenRepository.consumeValid).mockResolvedValue(existingToken)
    vi.mocked(userRepository.findById).mockResolvedValue(null)

    await expect(useCase.execute({
      refreshToken: 'valid-token',
    })).rejects.toThrow(InvalidTokenError)
  })

  it('should successfully refresh token with user roles', async () => {
    const existingToken = new RefreshToken({
      id: 'token-id',
      token: 'valid-token',
      userId: 'user-id',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })

    const user = new User({
      id: 'user-id',
      name: 'John',
      email: 'john@example.com',
      username: 'john',
      password: 'password',
      roles: ['admin', 'user'],
    })

    vi.mocked(refreshTokenRepository.consumeValid).mockResolvedValue(existingToken)
    vi.mocked(userRepository.findById).mockResolvedValue(user)

    const result = await useCase.execute({
      refreshToken: 'valid-token',
    })

    expect(refreshTokenRepository.consumeValid).toHaveBeenCalledWith('valid-token')
    expect(tokenProvider.generate).toHaveBeenCalledWith({
      iss: 'users-service',
      sub: 'user-id',
      roles: ['admin', 'user'],
    })
    expect(result.accessToken).toBe('new.access.token')
    expect(result.refreshToken).toBeTypeOf('string')
    expect(result.refreshToken).toHaveLength(80)
    expect(refreshTokenRepository.create).toHaveBeenCalled()
  })
})
