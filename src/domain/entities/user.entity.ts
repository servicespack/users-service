import { createHash } from 'node:crypto'
import {
  EmailAlreadyVerifiedError,
  InvalidMagicLoginTokenError,
  InvalidResetTokenError,
  MagicLoginTokenExpiredError,
  ResetTokenExpiredError,
  WrongVerificationKeyError,
} from '../errors'

export interface UserProps {
  id?: string
  name: string
  email: string
  username: string
  password: string
  isEmailVerified?: boolean
  emailVerificationKey?: string
  passwordResetToken?: string
  passwordResetExpiresAt?: Date
  magicLoginToken?: string
  magicLoginExpiresAt?: Date
  roles?: string[]
  createdAt?: Date
  updatedAt?: Date
}

export class User {
  static hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }

  private readonly _id?: string
  private _name: string
  private _email: string
  private _username: string
  private _password: string
  private _isEmailVerified: boolean
  private _emailVerificationKey: string
  private _passwordResetToken?: string
  private _passwordResetExpiresAt?: Date
  private _magicLoginToken?: string
  private _magicLoginExpiresAt?: Date
  private _roles: string[]
  private readonly _createdAt?: Date
  private readonly _updatedAt?: Date

  constructor(props: UserProps) {
    this._id = props.id
    this._name = props.name
    this._email = props.email
    this._username = props.username
    this._password = props.password
    this._isEmailVerified = props.isEmailVerified ?? false
    this._emailVerificationKey = props.emailVerificationKey ?? ''
    this._passwordResetToken = props.passwordResetToken
    this._passwordResetExpiresAt = props.passwordResetExpiresAt
    this._magicLoginToken = props.magicLoginToken
    this._magicLoginExpiresAt = props.magicLoginExpiresAt
    this._roles = props.roles && props.roles.length > 0 ? [...props.roles] : ['user']
    this._createdAt = props.createdAt
    this._updatedAt = props.updatedAt
  }

  get id(): string | undefined {
    return this._id
  }

  get name(): string {
    return this._name
  }

  get email(): string {
    return this._email
  }

  get username(): string {
    return this._username
  }

  get password(): string {
    return this._password
  }

  get isEmailVerified(): boolean {
    return this._isEmailVerified
  }

  get emailVerificationKey(): string {
    return this._emailVerificationKey
  }

  get passwordResetToken(): string | undefined {
    return this._passwordResetToken
  }

  get passwordResetExpiresAt(): Date | undefined {
    return this._passwordResetExpiresAt
  }

  get magicLoginToken(): string | undefined {
    return this._magicLoginToken
  }

  get magicLoginExpiresAt(): Date | undefined {
    return this._magicLoginExpiresAt
  }

  get createdAt(): Date | undefined {
    return this._createdAt
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt
  }

  get roles(): string[] {
    return [...this._roles]
  }

  hasRole(role: string): boolean {
    return this._roles.includes(role)
  }

  updateProfile(props: { name?: string, email?: string, username?: string }): void {
    if (props.name !== undefined) {
      this._name = props.name
    }
    if (props.email !== undefined) {
      this._email = props.email
    }
    if (props.username !== undefined) {
      this._username = props.username
    }
  }

  changePassword(hashedPassword: string): void {
    this._password = hashedPassword
  }

  verifyEmail(key: string): void {
    if (this._isEmailVerified) {
      throw new EmailAlreadyVerifiedError()
    }
    const hashedKey = User.hashToken(key)
    if (hashedKey !== this._emailVerificationKey) {
      throw new WrongVerificationKeyError()
    }
    this._isEmailVerified = true
    this._emailVerificationKey = ''
  }

  requestPasswordReset(token: string, expiresAt: Date): void {
    this._passwordResetToken = User.hashToken(token)
    this._passwordResetExpiresAt = expiresAt
  }

  resetPassword(token: string, newHashedPassword: string): void {
    const hashedToken = User.hashToken(token)
    if (!this._passwordResetToken || this._passwordResetToken !== hashedToken) {
      throw new InvalidResetTokenError()
    }
    if (!this._passwordResetExpiresAt || this._passwordResetExpiresAt < new Date()) {
      throw new ResetTokenExpiredError()
    }
    this._password = newHashedPassword
    this._passwordResetToken = undefined
    this._passwordResetExpiresAt = undefined
  }

  requestMagicLogin(token: string, expiresAt: Date): void {
    this._magicLoginToken = User.hashToken(token)
    this._magicLoginExpiresAt = expiresAt
  }

  authenticateWithMagicLogin(token: string): void {
    const hashedToken = User.hashToken(token)
    if (!this._magicLoginToken || this._magicLoginToken !== hashedToken) {
      throw new InvalidMagicLoginTokenError()
    }
    if (!this._magicLoginExpiresAt || this._magicLoginExpiresAt < new Date()) {
      throw new MagicLoginTokenExpiredError()
    }
    this._magicLoginToken = undefined
    this._magicLoginExpiresAt = undefined
  }

  toJSON() {
    return {
      id: this._id,
      name: this._name,
      email: this._email,
      username: this._username,
      isEmailVerified: this._isEmailVerified,
      roles: this.roles,
    }
  }
}
