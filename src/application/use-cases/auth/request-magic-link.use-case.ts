import type { IUserRepository } from '../../../domain/repositories/user.repository.interface'
import type { RequestMagicLinkRequest } from '../../dtos/request-magic-link.model'
import type { INotificationSender } from '../../ports/notification-sender.port'
import { randomUUID } from 'node:crypto'

export class RequestMagicLinkUseCase {
  private readonly notificationSender?: INotificationSender
  private readonly tokenGenerator: () => string

  constructor(
    private readonly userRepository: IUserRepository,
    notificationSenderOrTokenGenerator?: INotificationSender | (() => string),
    tokenGenerator: () => string = randomUUID,
    private readonly magicLinkExpirationMinutes: number = 15,
    private readonly loginUrl: string = 'https://servicespack.com/login',
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

  async execute(request: RequestMagicLinkRequest): Promise<void> {
    const user = await this.userRepository.findByEmail(request.email)

    if (user === null) {
      return
    }

    const token = this.tokenGenerator()
    const expirationMinutes = this.magicLinkExpirationMinutes
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000)

    user.requestMagicLogin(token, expiresAt)

    await this.userRepository.update(user)

    if (this.notificationSender) {
      await this.notificationSender.sendEmail({
        to: user.email,
        templateCode: 'magic-link',
        variables: {
          name: user.name,
          token,
          loginUrl: `${this.loginUrl}?token=${token}`,
        },
        subject: 'Your magic login link',
        content: `You requested a magic login link. Your magic token is: ${token} (expires in ${expirationMinutes} minutes).`,
      })
    }
  }
}
