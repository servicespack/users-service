import type { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface'
import { InvalidTokenError } from '../../../domain/errors'

export interface LogoutRequest {
  refreshToken: string
}

export class LogoutUseCase {
  constructor(
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(request: LogoutRequest): Promise<void> {
    const token = await this.refreshTokenRepository.findByToken(request.refreshToken)

    if (!token) {
      throw new InvalidTokenError()
    }

    token.revoke()
    await this.refreshTokenRepository.update(token)
  }
}
