import { DomainError } from './domain.error'

export class ResetTokenExpiredError extends DomainError {
  constructor(message = 'Reset token has expired') {
    super(message)
  }
}
