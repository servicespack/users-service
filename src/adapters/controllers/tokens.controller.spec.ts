import type { Request, Response } from 'express'
import type { Mock } from 'vitest'
import type { CreateTokenUseCase } from '../../application/use-cases/auth/create-token.use-case'
import type { LoginWithMagicLinkUseCase } from '../../application/use-cases/auth/login-with-magic-link.use-case'
import type { RequestMagicLinkUseCase } from '../../application/use-cases/auth/request-magic-link.use-case'

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { InvalidCredentialsError, InvalidMagicLoginTokenError } from '../../domain/errors'

import { TokensController } from './tokens.controller'

describe(TokensController.name, () => {
  let tokensController: TokensController
  let createTokenUseCase: { execute: Mock }
  let requestMagicLinkUseCase: { execute: Mock }
  let loginWithMagicLinkUseCase: { execute: Mock }
  let request: Request
  let response: Response

  beforeEach(() => {
    createTokenUseCase = {
      execute: vi.fn(),
    }
    requestMagicLinkUseCase = {
      execute: vi.fn(),
    }
    loginWithMagicLinkUseCase = {
      execute: vi.fn(),
    }
    tokensController = new TokensController(
      createTokenUseCase as unknown as CreateTokenUseCase,
      {} as any,
      {} as any,
      requestMagicLinkUseCase as unknown as RequestMagicLinkUseCase,
      loginWithMagicLinkUseCase as unknown as LoginWithMagicLinkUseCase,
    )
    request = {
      body: { username: 'testuser', password: 'password123' },
    } as Request
    response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response
  })

  describe('create', () => {
    it('should return 401 if credentials are invalid', async () => {
      createTokenUseCase.execute.mockRejectedValue(new InvalidCredentialsError())

      await tokensController.create(request, response)

      expect(response.status).toHaveBeenCalledWith(401)
      expect(response.json).toHaveBeenCalledWith({ error: 'Invalid credentials' })
    })

    it('should return 201 with token if credentials are correct', async () => {
      vi.mocked(createTokenUseCase.execute).mockResolvedValue({
        accessToken: 'jwt-token-123',
        refreshToken: 'refresh-token-123',
      })
      await tokensController.create(request, response)

      expect(response.status).toHaveBeenCalledWith(201)
      expect(response.json).toHaveBeenCalledWith({
        Authorization: 'Bearer jwt-token-123',
        RefreshToken: 'refresh-token-123',
      })
    })
  })

  describe('requestMagicLink', () => {
    it('should return 200 with confirmation message', async () => {
      request.body = { email: 'john@example.com' }
      requestMagicLinkUseCase.execute.mockResolvedValue({})

      await tokensController.requestMagicLink(request, response)

      expect(requestMagicLinkUseCase.execute).toHaveBeenCalledWith({ email: 'john@example.com' })
      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.json).toHaveBeenCalledWith({
        message: 'If the email exists, a magic login link has been sent.',
      })
    })
  })

  describe('loginWithMagicLink', () => {
    it('should return 401 if token is invalid or expired', async () => {
      request.body = { token: 'invalid-token' }
      loginWithMagicLinkUseCase.execute.mockRejectedValue(new InvalidMagicLoginTokenError())

      await tokensController.loginWithMagicLink(request, response)

      expect(response.status).toHaveBeenCalledWith(401)
      expect(response.json).toHaveBeenCalledWith({ error: 'Invalid magic login token' })
    })

    it('should return 201 with tokens if token is valid', async () => {
      request.body = { token: 'valid-token' }
      loginWithMagicLinkUseCase.execute.mockResolvedValue({
        accessToken: 'jwt-token-123',
        refreshToken: 'refresh-token-123',
      })

      await tokensController.loginWithMagicLink(request, response)

      expect(response.status).toHaveBeenCalledWith(201)
      expect(response.json).toHaveBeenCalledWith({
        Authorization: 'Bearer jwt-token-123',
        RefreshToken: 'refresh-token-123',
      })
    })
  })
})
