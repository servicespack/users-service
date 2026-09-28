import type { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface'
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface'
import type {
  LoginWithMagicLinkRequest,
  LoginWithMagicLinkResponse,
} from '../../dtos/login-with-magic-link.model'
import type { ITokenProvider } from '../../ports/token-provider.port'
import crypto from 'node:crypto'
import { RefreshToken } from '../../../domain/entities/refresh-token.entity'
import { InvalidMagicLoginTokenError } from '../../../domain/errors'

export class LoginWithMagicLinkUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenProvider: ITokenProvider,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(request: LoginWithMagicLinkRequest): Promise<LoginWithMagicLinkResponse> {
    const user = await this.userRepository.findByMagicLoginToken(request.token)

    if (user === null || !user.id) {
      throw new InvalidMagicLoginTokenError()
    }

    user.authenticateWithMagicLogin(request.token)

    await this.userRepository.update(user)

    const accessToken = this.tokenProvider.generate({
      iss: 'users-service',
      sub: user.id,
      roles: user.roles,
    })

    const refreshTokenString = crypto.randomBytes(40).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiration

    const refreshToken = new RefreshToken({
      token: refreshTokenString,
      userId: user.id,
      expiresAt,
    })

    await this.refreshTokenRepository.create(refreshToken)

    return { accessToken, refreshToken: refreshTokenString }
  }
}
