import type { IUserRepository } from '../../../domain/repositories/user.repository.interface'
import type { ResetPasswordRequest } from '../../dtos/reset-password.model'
import type { IPasswordHasher } from '../../ports/password-hasher.port'
import { InvalidResetTokenError } from '../../../domain/errors'

export class ResetPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(request: ResetPasswordRequest): Promise<void> {
    const user = await this.userRepository.findByResetToken(request.token)

    if (user === null) {
      throw new InvalidResetTokenError()
    }

    const hashedPassword = await this.passwordHasher.hash(request.password)
    user.resetPassword(request.token, hashedPassword)

    await this.userRepository.update(user)
  }
}
