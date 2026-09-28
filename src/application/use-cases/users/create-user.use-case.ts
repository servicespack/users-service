import type { IUserRepository } from '../../../domain/repositories/user.repository.interface'
import type { CreateUserRequest } from '../../dtos/create-user.model'
import type { INotificationSender } from '../../ports/notification-sender.port'
import type { IPasswordHasher } from '../../ports/password-hasher.port'
import crypto from 'node:crypto'
import xss from 'xss'
import { User } from '../../../domain/entities/user.entity'

export class CreateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly notificationSender?: INotificationSender,
  ) {}

  async execute(request: CreateUserRequest): Promise<User> {
    const hashedPassword = await this.passwordHasher.hash(request.password)
    const rawVerificationKey = crypto.randomUUID()

    const user = new User({
      name: xss(request.name),
      email: xss(request.email),
      username: xss(request.username),
      password: hashedPassword,
      emailVerificationKey: User.hashToken(rawVerificationKey),
      roles: request.roles ? [...request.roles] : undefined,
    })

    const createdUser = await this.userRepository.create(user)

    if (this.notificationSender) {
      await this.notificationSender.sendEmail({
        to: createdUser.email,
        templateCode: 'verify-email',
        variables: {
          name: createdUser.name,
          verificationUrl: rawVerificationKey,
        },
        subject: 'Verify your email',
        content: `Welcome to ServicesPack! Your verification key is: ${rawVerificationKey}`,
      })
    }

    return createdUser
  }
}
