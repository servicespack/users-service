import type { Request, Response } from 'express'
import type { VerifyEmailUseCase } from '../../application/use-cases/verifications/verify-email.use-case'
import { handleHttpError } from '../helpers/http-error.helper'

export class VerificationsController {
  constructor(private readonly verifyEmailUseCase: VerifyEmailUseCase) {}

  async create(request: Request, response: Response) {
    try {
      const { user_id: userId, key } = request.body

      await this.verifyEmailUseCase.execute({ userId, key })

      return response.status(201).json({
        success: 'Email verified',
      })
    }
    catch (error) {
      return handleHttpError(error, response)
    }
  }
}
