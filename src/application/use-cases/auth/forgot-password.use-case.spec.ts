import type { IUserRepository } from '../../../domain/repositories/user.repository.interface'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { User } from '../../../domain/entities/user.entity'
import { ForgotPasswordUseCase } from './forgot-password.use-case'

describe(ForgotPasswordUseCase.name, () => {
  let userRepository: IUserRepository
  let useCase: ForgotPasswordUseCase

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
    useCase = new ForgotPasswordUseCase(userRepository)
  })

  it('should return empty response and not update when user is not found (anti-enumeration)', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null)

    const result = await useCase.execute({ email: 'nonexistent@example.com' })

    expect(result.resetToken).toBeUndefined()
    expect(userRepository.update).not.toHaveBeenCalled()
  })

  it('should generate a reset token, set 15 minutes expiration and persist user when user exists', async () => {
    const user = new User({
      id: 'u1',
      name: 'John Doe',
      email: 'john@example.com',
      username: 'johndoe',
      password: 'hashed-password',
    })
    vi.mocked(userRepository.findByEmail).mockResolvedValue(user)

    const beforeCall = Date.now()
    const result = await useCase.execute({ email: 'john@example.com' })
    const afterCall = Date.now()

    expect(result.resetToken).toBeDefined()
    expect(user.passwordResetToken).toBe(User.hashToken(result.resetToken!))
    expect(user.passwordResetExpiresAt).toBeDefined()

    const expiryTime = user.passwordResetExpiresAt!.getTime()
    const expectedMinExpiry = beforeCall + 15 * 60 * 1000
    const expectedMaxExpiry = afterCall + 15 * 60 * 1000

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

    const customUseCase = new ForgotPasswordUseCase(
      userRepository,
      () => 'fixed-custom-token',
    )

    const result = await customUseCase.execute({ email: 'john@example.com' })

    expect(result.resetToken).toBe('fixed-custom-token')
    expect(user.passwordResetToken).toBe(User.hashToken('fixed-custom-token'))
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

    const useCaseWithNotifier = new ForgotPasswordUseCase(
      userRepository,
      notificationSender,
      () => 'fixed-token',
    )

    await useCaseWithNotifier.execute({ email: 'john@example.com' })

    expect(notificationSender.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'john@example.com',
        templateCode: 'reset-password',
        subject: 'Reset your password',
        content: expect.stringContaining('fixed-token'),
      }),
    )
  })

  it('should use custom resetPasswordUrl if provided', async () => {
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

    const useCaseWithNotifier = new ForgotPasswordUseCase(
      userRepository,
      notificationSender,
      () => 'fixed-token',
      'https://my-custom-domain.com/reset',
    )

    await useCaseWithNotifier.execute({ email: 'john@example.com' })

    expect(notificationSender.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          name: 'John Doe',
          token: 'fixed-token',
          resetUrl: 'https://my-custom-domain.com/reset?token=fixed-token',
        },
      }),
    )
  })

  it('should not call notificationSender.sendEmail when user is not found', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null)

    const notificationSender = {
      sendEmail: vi.fn().mockResolvedValue(undefined),
    }

    const useCaseWithNotifier = new ForgotPasswordUseCase(
      userRepository,
      notificationSender,
    )

    await useCaseWithNotifier.execute({ email: 'nonexistent@example.com' })

    expect(notificationSender.sendEmail).not.toHaveBeenCalled()
  })
})
