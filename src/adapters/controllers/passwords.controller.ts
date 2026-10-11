import type { Request, Response } from 'express'
import type { ForgotPasswordUseCase } from '../../application/use-cases/auth/forgot-password.use-case'
import type { ResetPasswordUseCase } from '../../application/use-cases/auth/reset-password.use-case'
import { handleHttpError } from '../helpers/http-error.helper'

export interface PasswordsControllerDependencies {
  forgotPasswordUseCase: ForgotPasswordUseCase
  resetPasswordUseCase: ResetPasswordUseCase
}

export class PasswordsController {
  constructor(private readonly dependencies: PasswordsControllerDependencies) {}

  async forgotPassword(request: Request, response: Response) {
    try {
      const { email } = request.body
      await this.dependencies.forgotPasswordUseCase.execute({ email })

      return response.status(200).json({
        message: 'If the email exists, a password reset link has been sent.',
      })
    }
    catch (error) {
      return handleHttpError(error, response)
    }
  }

  async resetPassword(request: Request, response: Response) {
    try {
      const { token, password } = request.body
      await this.dependencies.resetPasswordUseCase.execute({ token, password })

      return response.status(200).json({
        message: 'Password successfully reset.',
      })
    }
    catch (error) {
      return handleHttpError(error, response)
    }
  }
}
