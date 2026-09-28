import type { Response } from 'express'
import {
  DomainError,
  EmailAlreadyVerifiedError,
  InvalidCredentialsError,
  InvalidMagicLoginTokenError,
  InvalidPasswordError,
  InvalidSearchQueryError,
  MagicLoginTokenExpiredError,
  UserNotFoundError,
  WrongVerificationKeyError,
} from '../../domain/errors'

export function handleHttpError(error: unknown, response: Response): Response {
  if (error instanceof UserNotFoundError) {
    return response.status(404).json({ error: error.message })
  }
  if (error instanceof InvalidCredentialsError) {
    return response.status(401).json({ error: error.message })
  }
  if (error instanceof InvalidMagicLoginTokenError) {
    return response.status(401).json({ error: error.message })
  }
  if (error instanceof MagicLoginTokenExpiredError) {
    return response.status(401).json({ error: error.message })
  }
  if (error instanceof InvalidPasswordError) {
    return response.status(401).json({ error: error.message })
  }
  if (error instanceof WrongVerificationKeyError) {
    return response.status(401).json({ error: error.message })
  }
  if (error instanceof EmailAlreadyVerifiedError) {
    return response.status(400).json({ error: error.message })
  }
  if (error instanceof InvalidSearchQueryError) {
    return response.status(400).json({ error: error.message })
  }
  if (error instanceof DomainError) {
    return response.status(400).json({ error: error.message })
  }

  throw error
}
