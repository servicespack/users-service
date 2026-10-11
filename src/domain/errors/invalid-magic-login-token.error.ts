import { DomainError } from './domain.error'

export class InvalidMagicLoginTokenError extends DomainError {
  constructor(message = 'Invalid magic login token') {
    super(message)
  }
}
