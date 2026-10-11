import type { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface'
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface'
import type { CreateTokenRequest, CreateTokenResponse } from '../../dtos/create-token.model'
import type { IPasswordHasher } from '../../ports/password-hasher.port'
import type { ITokenProvider } from '../../ports/token-provider.port'
import crypto from 'node:crypto'
import { RefreshToken } from '../../../domain/entities/refresh-token.entity'
import { InvalidCredentialsError } from '../../../domain/errors'

export class CreateTokenUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenProvider: ITokenProvider,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(request: CreateTokenRequest): Promise<CreateTokenResponse> {
    const user = await this.userRepository.findByUsernameOrEmail(request.username)

    if (user === null || !user.id) {
      throw new InvalidCredentialsError()
    }

    const isPasswordCorrect = await this.passwordHasher.verify(
      user.password,
      request.password,
    )

    if (!isPasswordCorrect) {
      throw new InvalidCredentialsError()
    }

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
