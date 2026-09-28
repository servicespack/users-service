import type { Request, Response } from 'express'
import type { Mock } from 'vitest'
import type { VerifyEmailUseCase } from '../../application/use-cases/verifications/verify-email.use-case'

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import {
  EmailAlreadyVerifiedError,
  UserNotFoundError,
  WrongVerificationKeyError,
} from '../../domain/errors'

import { VerificationsController } from './verifications.controller'

describe(VerificationsController.name, () => {
  let verificationsController: VerificationsController
  let verifyEmailUseCase: { execute: Mock }
  let request: Request
  let response: Response

  beforeEach(() => {
    verifyEmailUseCase = {
      execute: vi.fn(),
    }
    verificationsController = new VerificationsController(verifyEmailUseCase as unknown as VerifyEmailUseCase)
    request = ({
      body: { user_id: '1', key: 'correct-key' },
    } as Request)
    response = ({
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response)
  })

  describe('create', () => {
    it('should return 404 if user is not found', async () => {
      verifyEmailUseCase.execute.mockRejectedValue(new UserNotFoundError())

      await verificationsController.create(request, response)

      expect(response.status).toHaveBeenCalledWith(404)
      expect(response.json).toHaveBeenCalledWith({ error: 'User not found' })
    })

    it('should return 401 if key is wrong', async () => {
      verifyEmailUseCase.execute.mockRejectedValue(new WrongVerificationKeyError())

      await verificationsController.create(request, response)

      expect(response.status).toHaveBeenCalledWith(401)
      expect(response.json).toHaveBeenCalledWith({ error: 'Wrong key' })
    })

    it('should return 400 if email is already verified', async () => {
      verifyEmailUseCase.execute.mockRejectedValue(new EmailAlreadyVerifiedError())

      await verificationsController.create(request, response)

      expect(response.status).toHaveBeenCalledWith(400)
      expect(response.json).toHaveBeenCalledWith({ error: 'Email already verified' })
    })

    it('should return 201 and verify email if key is correct', async () => {
      verifyEmailUseCase.execute.mockResolvedValue(undefined)

      await verificationsController.create(request, response)

      expect(verifyEmailUseCase.execute).toHaveBeenCalledWith({
        userId: '1',
        key: 'correct-key',
      })
      expect(response.status).toHaveBeenCalledWith(201)
      expect(response.json).toHaveBeenCalledWith({ success: 'Email verified' })
    })
  })
})
