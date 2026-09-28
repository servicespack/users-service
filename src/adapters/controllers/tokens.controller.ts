import type { Request, Response } from 'express'
import type { CreateTokenUseCase } from '../../application/use-cases/auth/create-token.use-case'
import type { LoginWithMagicLinkUseCase } from '../../application/use-cases/auth/login-with-magic-link.use-case'
import type { LogoutUseCase } from '../../application/use-cases/auth/logout.use-case'

import type { RefreshTokenUseCase } from '../../application/use-cases/auth/refresh-token.use-case'
import type { RequestMagicLinkUseCase } from '../../application/use-cases/auth/request-magic-link.use-case'
import { handleHttpError } from '../helpers/http-error.helper'

export class TokensController {
  constructor(
    private readonly createTokenUseCase: CreateTokenUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly requestMagicLinkUseCase: RequestMagicLinkUseCase,
    private readonly loginWithMagicLinkUseCase: LoginWithMagicLinkUseCase,
  ) {}

  async create(request: Request, response: Response) {
    try {
      const { username, password } = request.body
      const { accessToken, refreshToken } = await this.createTokenUseCase.execute({ username, password })

      return response.status(201).json({
        Authorization: `Bearer ${accessToken}`,
        RefreshToken: refreshToken,
      })
    }
    catch (error) {
      return handleHttpError(error, response)
    }
  }

  async requestMagicLink(request: Request, response: Response) {
    try {
      const { email } = request.body
      await this.requestMagicLinkUseCase.execute({ email })

      return response.status(200).json({
        message: 'If the email exists, a magic login link has been sent.',
      })
    }
    catch (error) {
      return handleHttpError(error, response)
    }
  }

  async loginWithMagicLink(request: Request, response: Response) {
    try {
      const { token } = request.body
      const { accessToken, refreshToken } = await this.loginWithMagicLinkUseCase.execute({ token })

      return response.status(201).json({
        Authorization: `Bearer ${accessToken}`,
        RefreshToken: refreshToken,
      })
    }
    catch (error) {
      return handleHttpError(error, response)
    }
  }

  async refresh(request: Request, response: Response) {
    try {
      const { refreshToken } = request.body
      const { accessToken, refreshToken: newRefreshToken } = await this.refreshTokenUseCase.execute({ refreshToken })

      return response.status(201).json({
        Authorization: `Bearer ${accessToken}`,
        RefreshToken: newRefreshToken,
      })
    }
    catch (error) {
      return handleHttpError(error, response)
    }
  }

  async logout(request: Request, response: Response) {
    try {
      const { refreshToken } = request.body
      await this.logoutUseCase.execute({ refreshToken })

      return response.status(204).send()
    }
    catch (error) {
      return handleHttpError(error, response)
    }
  }
}
