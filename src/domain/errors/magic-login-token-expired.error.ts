import { DomainError } from './domain.error'

export class MagicLoginTokenExpiredError extends DomainError {
  constructor(message = 'Magic login token has expired') {
    super(message)
  }
}
