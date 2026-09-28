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
    vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(null)

    await expect(useCase.execute({
      refreshToken: 'non-existent',
    })).rejects.toThrow(InvalidTokenError)
  })

  it('should throw InvalidTokenError if refresh token is expired or revoked', async () => {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() - 1) // expired
    const refreshToken = new RefreshToken({
      id: 'token-id',
      token: 'expired-token',
      userId: 'user-id',
      expiresAt,
    })

    vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(refreshToken)

    await expect(useCase.execute({
      refreshToken: 'expired-token',
    })).rejects.toThrow(InvalidTokenError)
  })

  it('should throw InvalidTokenError if user is not found when userRepository is provided', async () => {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
    const refreshToken = new RefreshToken({
      id: 'token-id',
      token: 'valid-token',
      userId: 'user-id',
      expiresAt,
    })

    vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(refreshToken)
    vi.mocked(userRepository.findById).mockResolvedValue(null)

    await expect(useCase.execute({
      refreshToken: 'valid-token',
    })).rejects.toThrow(InvalidTokenError)
  })

  it('should successfully refresh token with user roles', async () => {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
    const refreshToken = new RefreshToken({
      id: 'token-id',
      token: 'valid-token',
      userId: 'user-id',
      expiresAt,
    })

    const user = new User({
      id: 'user-id',
      name: 'John',
      email: 'john@example.com',
      username: 'john',
      password: 'password',
      roles: ['admin', 'user'],
    })

    vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(refreshToken)
    vi.mocked(userRepository.findById).mockResolvedValue(user)

    const result = await useCase.execute({
      refreshToken: 'valid-token',
    })

    expect(refreshTokenRepository.findByToken).toHaveBeenCalledWith('valid-token')
    expect(refreshToken.isRevoked).toBe(true)
    expect(refreshTokenRepository.update).toHaveBeenCalledWith(refreshToken)
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
