import type { Request, Response } from 'express'
import type { Mock } from 'vitest'
import type { ForgotPasswordUseCase } from '../../application/use-cases/auth/forgot-password.use-case'
import type { ResetPasswordUseCase } from '../../application/use-cases/auth/reset-password.use-case'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EmailAlreadyVerifiedError, InvalidResetTokenError, ResetTokenExpiredError } from '../../domain/errors'
import { PasswordsController } from './passwords.controller'

describe(PasswordsController.name, () => {
  let controller: PasswordsController
  let forgotPasswordUseCase: { execute: Mock }
  let resetPasswordUseCase: { execute: Mock }
  let request: Request
  let response: Response

  beforeEach(() => {
    forgotPasswordUseCase = { execute: vi.fn() }
    resetPasswordUseCase = { execute: vi.fn() }
    controller = new PasswordsController({
      forgotPasswordUseCase: forgotPasswordUseCase as unknown as ForgotPasswordUseCase,
      resetPasswordUseCase: resetPasswordUseCase as unknown as ResetPasswordUseCase,
    })
    request = { body: {} } as Request
    response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response
  })

  describe('forgotPassword', () => {
    it('should return 200 with generic message even if user does not exist', async () => {
      request.body = { email: 'nonexistent@example.com' }
      forgotPasswordUseCase.execute.mockResolvedValue({})

      await controller.forgotPassword(request, response)

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.json).toHaveBeenCalledWith({
        message: 'If the email exists, a password reset link has been sent.',
      })
    })

    it('should handle DomainError when forgotPasswordUseCase throws', async () => {
      request.body = { email: 'john@example.com' }
      forgotPasswordUseCase.execute.mockRejectedValue(new EmailAlreadyVerifiedError())

      await controller.forgotPassword(request, response)

      expect(response.status).toHaveBeenCalledWith(400)
    })
  })

  describe('resetPassword', () => {
    it('should return 400 if reset token is invalid', async () => {
      request.body = { token: 'invalid', password: 'newPassword123' }
      resetPasswordUseCase.execute.mockRejectedValue(new InvalidResetTokenError())

      await controller.resetPassword(request, response)

      expect(response.status).toHaveBeenCalledWith(400)
      expect(response.json).toHaveBeenCalledWith({ error: 'Invalid reset token' })
    })

    it('should return 400 if reset token is expired', async () => {
      request.body = { token: 'expired', password: 'newPassword123' }
      resetPasswordUseCase.execute.mockRejectedValue(new ResetTokenExpiredError())

      await controller.resetPassword(request, response)

      expect(response.status).toHaveBeenCalledWith(400)
      expect(response.json).toHaveBeenCalledWith({ error: 'Reset token has expired' })
    })

    it('should return 200 when password reset is successful', async () => {
      request.body = { token: 'valid-token', password: 'newPassword123' }
      resetPasswordUseCase.execute.mockResolvedValue(undefined)

      await controller.resetPassword(request, response)

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.json).toHaveBeenCalledWith({ message: 'Password successfully reset.' })
    })
  })
})
