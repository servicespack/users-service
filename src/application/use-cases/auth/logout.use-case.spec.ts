import type { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RefreshToken } from '../../../domain/entities/refresh-token.entity'
import { InvalidTokenError } from '../../../domain/errors'
import { LogoutUseCase } from './logout.use-case'

describe(LogoutUseCase.name, () => {
  let refreshTokenRepository: IRefreshTokenRepository
  let useCase: LogoutUseCase

  beforeEach(() => {
    refreshTokenRepository = {
      create: vi.fn(),
      findByToken: vi.fn(),
      update: vi.fn(),
      revokeAllForUser: vi.fn(),
    }
    useCase = new LogoutUseCase(refreshTokenRepository)
  })

  it('should throw InvalidTokenError if refresh token does not exist', async () => {
    vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(null)

    await expect(useCase.execute({
      refreshToken: 'non-existent',
    })).rejects.toThrow(InvalidTokenError)
  })

  it('should revoke and update the refresh token if it exists', async () => {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
    const refreshToken = new RefreshToken({
      id: 'token-id',
      token: 'valid-token',
      userId: 'user-id',
      expiresAt,
    })

    vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(refreshToken)

    await useCase.execute({
      refreshToken: 'valid-token',
    })

    expect(refreshTokenRepository.findByToken).toHaveBeenCalledWith('valid-token')
    expect(refreshToken.isRevoked).toBe(true)
    expect(refreshTokenRepository.update).toHaveBeenCalledWith(refreshToken)
  })
})
