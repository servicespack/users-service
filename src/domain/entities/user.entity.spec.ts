import { describe, expect, it } from 'vitest'
import {
  EmailAlreadyVerifiedError,
  InvalidResetTokenError,
  ResetTokenExpiredError,
  WrongVerificationKeyError,
} from '../errors'
import { User } from './user.entity'

describe('user Entity', () => {
  it('should instantiate a user with provided properties', () => {
    const user = new User({
      id: 'user-id-1',
      name: 'John Doe',
      email: 'john@example.com',
      username: 'johndoe',
      password: 'hashed-password',
      isEmailVerified: false,
      emailVerificationKey: 'verify-123',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-02'),
    })

    expect(user.id).toBe('user-id-1')
    expect(user.name).toBe('John Doe')
    expect(user.email).toBe('john@example.com')
    expect(user.username).toBe('johndoe')
    expect(user.password).toBe('hashed-password')
    expect(user.isEmailVerified).toBe(false)
    expect(user.emailVerificationKey).toBe('verify-123')
    expect(user.roles).toEqual(['user'])
    expect(user.createdAt).toEqual(new Date('2023-01-01'))
    expect(user.updatedAt).toEqual(new Date('2023-01-02'))
  })

  it('should instantiate a user with custom roles', () => {
    const user = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      username: 'adminuser',
      password: 'hashed-password',
      roles: ['admin', 'manager'],
    })

    expect(user.roles).toEqual(['admin', 'manager'])
    expect(user.hasRole('admin')).toBe(true)
    expect(user.hasRole('manager')).toBe(true)
    expect(user.hasRole('user')).toBe(false)
  })

  it('should default roles to ["user"] if empty array is passed', () => {
    const user = new User({
      name: 'Normal User',
      email: 'normal@example.com',
      username: 'normaluser',
      password: 'hashed-password',
      roles: [],
    })

    expect(user.roles).toEqual(['user'])
    expect(user.hasRole('user')).toBe(true)
  })

  it('should update profile fields', () => {
    const user = new User({
      name: 'John Doe',
      email: 'john@example.com',
      username: 'johndoe',
      password: 'hashed-password',
    })

    user.updateProfile({ name: 'Jane Doe', email: 'jane@example.com' })

    expect(user.name).toBe('Jane Doe')
    expect(user.email).toBe('jane@example.com')
    expect(user.username).toBe('johndoe')

    user.updateProfile({ username: 'janedoe' })
    expect(user.username).toBe('janedoe')
  })

  it('should change password', () => {
    const user = new User({
      name: 'John',
      email: 'john@example.com',
      username: 'john',
      password: 'old-hashed-password',
    })

    user.changePassword('new-hashed-password')
    expect(user.password).toBe('new-hashed-password')
  })

  it('should verify email with correct key', () => {
    const user = new User({
      name: 'John',
      email: 'john@example.com',
      username: 'john',
      password: 'hashed-password',
      isEmailVerified: false,
      emailVerificationKey: 'correct-key',
    })

    user.verifyEmail('correct-key')

    expect(user.isEmailVerified).toBe(true)
    expect(user.emailVerificationKey).toBe('')
  })

  it('should throw WrongVerificationKeyError if key does not match', () => {
    const user = new User({
      name: 'John',
      email: 'john@example.com',
      username: 'john',
      password: 'hashed-password',
      isEmailVerified: false,
      emailVerificationKey: 'correct-key',
    })

    expect(() => user.verifyEmail('wrong-key')).toThrow(WrongVerificationKeyError)
  })

  it('should throw EmailAlreadyVerifiedError if already verified', () => {
    const user = new User({
      name: 'John',
      email: 'john@example.com',
      username: 'john',
      password: 'hashed-password',
      isEmailVerified: true,
      emailVerificationKey: '',
    })

    expect(() => user.verifyEmail('any-key')).toThrow(EmailAlreadyVerifiedError)
  })

  it('should return sanitized JSON', () => {
    const user = new User({
      id: '123',
      name: 'John',
      email: 'john@example.com',
      username: 'john',
      password: 'secret-hash',
      emailVerificationKey: 'secret-key',
      isEmailVerified: false,
    })

    expect(user.toJSON()).toEqual({
      id: '123',
      name: 'John',
      email: 'john@example.com',
      username: 'john',
      isEmailVerified: false,
      roles: ['user'],
    })
  })

  it('should set password reset token and expiresAt', () => {
    const user = new User({
      name: 'John',
      email: 'john@example.com',
      username: 'john',
      password: 'password',
    })

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
    user.requestPasswordReset('reset-token-123', expiresAt)

    expect(user.passwordResetToken).toBe('reset-token-123')
    expect(user.passwordResetExpiresAt).toBe(expiresAt)
  })

  it('should throw InvalidResetTokenError if reset token does not match', () => {
    const user = new User({
      name: 'John',
      email: 'john@example.com',
      username: 'john',
      password: 'old-password',
      passwordResetToken: 'valid-token',
      passwordResetExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    })

    expect(() => user.resetPassword('wrong-token', 'new-password')).toThrow(InvalidResetTokenError)
  })

  it('should throw ResetTokenExpiredError if reset token has expired', () => {
    const user = new User({
      name: 'John',
      email: 'john@example.com',
      username: 'john',
      password: 'old-password',
      passwordResetToken: 'valid-token',
      passwordResetExpiresAt: new Date(Date.now() - 1000),
    })

    expect(() => user.resetPassword('valid-token', 'new-password')).toThrow(ResetTokenExpiredError)
  })

  it('should reset password and clear token and expiry when valid', () => {
    const user = new User({
      name: 'John',
      email: 'john@example.com',
      username: 'john',
      password: 'old-password',
      passwordResetToken: 'valid-token',
      passwordResetExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    })

    user.resetPassword('valid-token', 'new-hashed-password')

    expect(user.password).toBe('new-hashed-password')
    expect(user.passwordResetToken).toBeUndefined()
    expect(user.passwordResetExpiresAt).toBeUndefined()
  })
})
