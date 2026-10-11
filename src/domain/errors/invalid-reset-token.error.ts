import { DomainError } from './domain.error'

export class InvalidResetTokenError extends DomainError {
  constructor(message = 'Invalid reset token') {
    super(message)
  }
}
