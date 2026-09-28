import type { IUserRepository } from '../../../domain/repositories/user.repository.interface'
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
} from '../../dtos/forgot-password.model'
import type { INotificationSender } from '../../ports/notification-sender.port'
import { randomUUID } from 'node:crypto'

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000

export class ForgotPasswordUseCase {
  private readonly notificationSender?: INotificationSender
  private readonly tokenGenerator: () => string

  constructor(
    private readonly userRepository: IUserRepository,
    notificationSenderOrTokenGenerator?: INotificationSender | (() => string),
    tokenGenerator: () => string = randomUUID,
    private readonly resetPasswordUrl: string = 'https://servicespack.com/reset-password',
  ) {
    if (typeof notificationSenderOrTokenGenerator === 'function') {
      this.tokenGenerator = notificationSenderOrTokenGenerator
      this.notificationSender = undefined
    }
    else {
      this.notificationSender = notificationSenderOrTokenGenerator
      this.tokenGenerator = tokenGenerator
    }
  }

  async execute(request: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    const user = await this.userRepository.findByEmail(request.email)

    if (user === null) {
      return {}
    }

    const token = this.tokenGenerator()
    const expiresAt = new Date(Date.now() + FIFTEEN_MINUTES_MS)

    user.requestPasswordReset(token, expiresAt)

    await this.userRepository.update(user)

    if (this.notificationSender) {
      await this.notificationSender.sendEmail({
        to: user.email,
        templateCode: 'reset-password',
        variables: {
          name: user.name,
          token,
          resetUrl: `${this.resetPasswordUrl}?token=${token}`,
        },
        subject: 'Reset your password',
        content: `You requested a password reset. Your reset token is: ${token} (expires in 15 minutes).`,
      })
    }

    return { resetToken: token }
  }
}
