import type { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface'
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface'
import type { ITokenProvider } from '../../ports/token-provider.port'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { User } from '../../../domain/entities/user.entity'
import { InvalidMagicLoginTokenError, MagicLoginTokenExpiredError } from '../../../domain/errors'
import { LoginWithMagicLinkUseCase } from './login-with-magic-link.use-case'

describe(LoginWithMagicLinkUseCase.name, () => {
  let userRepository: IUserRepository
  let tokenProvider: ITokenProvider
  let refreshTokenRepository: IRefreshTokenRepository
  let useCase: LoginWithMagicLinkUseCase

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
    tokenProvider = {
      generate: vi.fn().mockReturnValue('mocked.jwt.token'),
    }
    refreshTokenRepository = {
      create: vi.fn(),
      findByToken: vi.fn(),
      update: vi.fn(),
      revokeAllForUser: vi.fn(),
    }
    useCase = new LoginWithMagicLinkUseCase(userRepository, tokenProvider, refreshTokenRepository)
  })

  it('should throw InvalidMagicLoginTokenError if token does not exist', async () => {
    vi.mocked(userRepository.findByMagicLoginToken).mockResolvedValue(null)

    await expect(useCase.execute({
      token: 'unknown-token',
    })).rejects.toThrow(InvalidMagicLoginTokenError)
  })

  it('should throw MagicLoginTokenExpiredError if magic login token has expired', async () => {
    const user = new User({
      id: 'u1',
      name: 'John Doe',
      email: 'john@example.com',
      username: 'johndoe',
      password: 'password',
      magicLoginToken: User.hashToken('expired-token'),
      magicLoginExpiresAt: new Date(Date.now() - 1000),
    })
    vi.mocked(userRepository.findByMagicLoginToken).mockResolvedValue(user)

    await expect(useCase.execute({
      token: 'expired-token',
    })).rejects.toThrow(MagicLoginTokenExpiredError)
  })

  it('should generate tokens and clear magic login properties when token is valid', async () => {
    const user = new User({
      id: 'u1',
      name: 'John Doe',
      email: 'john@example.com',
      username: 'johndoe',
      password: 'password',
      magicLoginToken: User.hashToken('valid-token'),
      magicLoginExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    })
    vi.mocked(userRepository.findByMagicLoginToken).mockResolvedValue(user)

    const result = await useCase.execute({ token: 'valid-token' })

    expect(user.magicLoginToken).toBeUndefined()
    expect(user.magicLoginExpiresAt).toBeUndefined()
    expect(userRepository.update).toHaveBeenCalledWith(user)

    expect(tokenProvider.generate).toHaveBeenCalledWith({
      iss: 'users-service',
      sub: 'u1',
      roles: ['user'],
    })
    expect(refreshTokenRepository.create).toHaveBeenCalled()
    expect(result.accessToken).toBe('mocked.jwt.token')
    expect(result.refreshToken).toBeTypeOf('string')
    expect(result.refreshToken).toHaveLength(80)
  })
})
