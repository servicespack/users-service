import type { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface'
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface'
import type { ITokenProvider } from '../../ports/token-provider.port'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { User } from '../../../domain/entities/user.entity'
import { InvalidMagicLoginTokenError } from '../../../domain/errors'
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
      consumeMagicLoginToken: vi.fn(),
      list: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }
    tokenProvider = {
      generate: vi.fn().mockReturnValue('mocked.jwt.token'),
    }
    refreshTokenRepository = {
      create: vi.fn(),
      consumeValid: vi.fn(),
      findByToken: vi.fn(),
      update: vi.fn(),
      revokeAllForUser: vi.fn(),
    }
    useCase = new LoginWithMagicLinkUseCase(userRepository, tokenProvider, refreshTokenRepository)
  })

  it('should throw InvalidMagicLoginTokenError if token does not exist', async () => {
    vi.mocked(userRepository.consumeMagicLoginToken).mockResolvedValue(null)

    await expect(useCase.execute({
      token: 'unknown-token',
    })).rejects.toThrow(InvalidMagicLoginTokenError)
  })

  it('should throw InvalidMagicLoginTokenError if magic login token has expired', async () => {
    vi.mocked(userRepository.consumeMagicLoginToken).mockResolvedValue(null)

    await expect(useCase.execute({
      token: 'expired-token',
    })).rejects.toThrow(InvalidMagicLoginTokenError)
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
    const clearedUser = new User({
      id: 'u1',
      name: 'John Doe',
      email: 'john@example.com',
      username: 'johndoe',
      password: 'password',
    })
    vi.mocked(userRepository.consumeMagicLoginToken).mockResolvedValue(clearedUser)

    const result = await useCase.execute({ token: 'valid-token' })

    expect(user.magicLoginToken).toBe(User.hashToken('valid-token'))
    expect(user.magicLoginExpiresAt).toBeDefined()
    expect(userRepository.update).not.toHaveBeenCalled()

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
