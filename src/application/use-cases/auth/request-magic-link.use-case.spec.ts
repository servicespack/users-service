import type { IUserRepository } from '../../../domain/repositories/user.repository.interface'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { User } from '../../../domain/entities/user.entity'
import { RequestMagicLinkUseCase } from './request-magic-link.use-case'

describe(RequestMagicLinkUseCase.name, () => {
  let userRepository: IUserRepository
  let useCase: RequestMagicLinkUseCase

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
    useCase = new RequestMagicLinkUseCase(userRepository, undefined, () => 'mock-uuid', 20)
  })

  it('should return empty response and not update when user is not found (anti-enumeration)', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null)

    const result = await useCase.execute({ email: 'nonexistent@example.com' })

    expect(result).toBeUndefined()
    expect(userRepository.update).not.toHaveBeenCalled()
  })

  it('should generate a magic token, set expiration and persist user when user exists', async () => {
    const user = new User({
      id: 'u1',
      name: 'John Doe',
      email: 'john@example.com',
      username: 'johndoe',
      password: 'hashed-password',
    })
    vi.mocked(userRepository.findByEmail).mockResolvedValue(user)

    const beforeCall = Date.now()
    await useCase.execute({ email: 'john@example.com' })
    const afterCall = Date.now()

    expect(user.magicLoginToken).toBe(User.hashToken('mock-uuid'))
    expect(user.magicLoginExpiresAt).toBeDefined()

    const expirationMinutes = 20
    const expiryTime = user.magicLoginExpiresAt!.getTime()
    const expectedMinExpiry = beforeCall + expirationMinutes * 60 * 1000
    const expectedMaxExpiry = afterCall + expirationMinutes * 60 * 1000

    expect(expiryTime).toBeGreaterThanOrEqual(expectedMinExpiry)
    expect(expiryTime).toBeLessThanOrEqual(expectedMaxExpiry)
    expect(userRepository.update).toHaveBeenCalledWith(user)
  })

  it('should use custom token generator if provided', async () => {
    const user = new User({
      id: 'u1',
      name: 'John Doe',
      email: 'john@example.com',
      username: 'johndoe',
      password: 'hashed-password',
    })
    vi.mocked(userRepository.findByEmail).mockResolvedValue(user)

    const customUseCase = new RequestMagicLinkUseCase(
      userRepository,
      () => 'fixed-custom-token',
    )

    await customUseCase.execute({ email: 'john@example.com' })

    expect(user.magicLoginToken).toBe(User.hashToken('fixed-custom-token'))
    expect(userRepository.update).toHaveBeenCalledWith(user)
  })

  it('should call notificationSender.sendEmail when notificationSender is provided and user exists', async () => {
    const user = new User({
      id: 'u1',
      name: 'John Doe',
      email: 'john@example.com',
      username: 'johndoe',
      password: 'hashed-password',
    })
    vi.mocked(userRepository.findByEmail).mockResolvedValue(user)

    const notificationSender = {
      sendEmail: vi.fn().mockResolvedValue(undefined),
    }

    const useCaseWithNotifier = new RequestMagicLinkUseCase(
      userRepository,
      notificationSender,
      () => 'fixed-token',
    )

    await useCaseWithNotifier.execute({ email: 'john@example.com' })

    expect(notificationSender.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'john@example.com',
        templateCode: 'magic-link',
        subject: 'Your magic login link',
        content: expect.stringContaining('fixed-token'),
      }),
    )
  })

  it('should use custom loginUrl if provided', async () => {
    const user = new User({
      id: 'u1',
      name: 'John Doe',
      email: 'john@example.com',
      username: 'johndoe',
      password: 'hashed-password',
    })
    vi.mocked(userRepository.findByEmail).mockResolvedValue(user)

    const notificationSender = {
      sendEmail: vi.fn().mockResolvedValue(undefined),
    }

    const useCaseWithNotifier = new RequestMagicLinkUseCase(
      userRepository,
      notificationSender,
      () => 'fixed-token',
      15,
      'https://my-custom-domain.com/login',
    )

    await useCaseWithNotifier.execute({ email: 'john@example.com' })

    expect(notificationSender.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          name: 'John Doe',
          token: 'fixed-token',
          loginUrl: 'https://my-custom-domain.com/login?token=fixed-token',
        },
      }),
    )
  })
})
