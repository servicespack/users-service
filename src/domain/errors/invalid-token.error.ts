import { DomainError } from './domain.error'

export class InvalidTokenError extends DomainError {
  constructor() {
    super('Invalid token')
    this.name = 'InvalidTokenError'
  }
}
