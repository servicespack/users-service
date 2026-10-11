import mongoose from 'mongoose'
import { describe, expect, it } from 'vitest'
import { userSchema } from './user.model'

describe('userModel transformations', () => {
  it('should transform toJSON correctly', () => {
    const transform = (userSchema as any).options.toJSON.transform

    const mockId = new mongoose.Types.ObjectId()
    const doc = {}
    const ret = {
      _id: mockId,
      __v: 0,
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashed-password',
      emailVerificationKey: 'key',
      passwordResetToken: 'reset',
      passwordResetExpiresAt: new Date(),
      magicLoginToken: 'magic',
      magicLoginExpiresAt: new Date(),
      roles: ['user'],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    transform(doc, ret)

    expect(ret).toEqual({
      id: mockId.toHexString(),
      name: 'Test User',
      email: 'test@example.com',
      roles: ['user'],
    })
    expect((ret as any)._id).toBeUndefined()
    expect((ret as any).__v).toBeUndefined()
    expect((ret as any).password).toBeUndefined()
    expect((ret as any).emailVerificationKey).toBeUndefined()
    expect((ret as any).createdAt).toBeUndefined()
    expect((ret as any).updatedAt).toBeUndefined()
  })

  it('should transform toObject correctly', () => {
    const transform = (userSchema as any).options.toObject.transform

    const mockId = new mongoose.Types.ObjectId()
    const doc = {}
    const ret = {
      _id: mockId,
      __v: 0,
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashed-password',
      emailVerificationKey: 'key',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    transform(doc, ret)

    expect(ret).toEqual({
      id: mockId.toHexString(),
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashed-password',
      emailVerificationKey: 'key',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    })
    expect((ret as any)._id).toBeUndefined()
    expect((ret as any).__v).toBeUndefined()
  })

  it('should define email and username with lowercase and trim options', () => {
    const emailPath = userSchema.path('email') as any
    const usernamePath = userSchema.path('username') as any

    expect(emailPath.options.lowercase).toBe(true)
    expect(emailPath.options.trim).toBe(true)
    expect(usernamePath.options.lowercase).toBe(true)
    expect(usernamePath.options.trim).toBe(true)

    const rolesPath = userSchema.path('roles') as any
    const defaultVal = typeof rolesPath.defaultValue === 'function' ? rolesPath.defaultValue() : rolesPath.defaultValue
    expect(defaultVal).toEqual(['user'])
  })
})
