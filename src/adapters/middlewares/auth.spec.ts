import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import auth from './auth'

vi.mock('jsonwebtoken')
vi.mock('../../config', () => ({
  configuration: {
    auth: {
      jwtSecret: 'secret',
    },
  },
}))

describe('auth Middleware', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let nextFunction: NextFunction

  beforeEach(() => {
    mockRequest = {
      headers: {},
      params: {},
    }
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }
    nextFunction = vi.fn()
  })

  it('should return 401 if no token provided', async () => {
    const middleware = auth()
    await middleware(mockRequest as Request, mockResponse as Response, nextFunction)
    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'No token provided' })
  })

  it('should call next if token is valid', async () => {
    mockRequest.headers = { authorization: 'Bearer valid-token' }
    vi.mocked(jwt.verify).mockReturnValue({ sub: 'user-id', roles: ['admin'] } as any)

    const middleware = auth()
    await middleware(mockRequest as Request, mockResponse as Response, nextFunction)

    expect(nextFunction).toHaveBeenCalled()
    expect(mockRequest.user).toEqual({
      id: 'user-id',
      roles: ['admin'],
    })
  })

  it('should return 401 if onlyTheOwner is true and sub !== id', async () => {
    mockRequest.headers = { authorization: 'Bearer valid-token' }
    mockRequest.params = { id: 'other-id' }
    vi.mocked(jwt.verify).mockReturnValue({ sub: 'user-id' } as any)

    const middleware = auth({ onlyTheOwner: true })
    await middleware(mockRequest as Request, mockResponse as Response, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Only allowed to the owner' })
  })

  it('should call next if onlyTheOwner is true and sub === id', async () => {
    mockRequest.headers = { authorization: 'Bearer valid-token' }
    mockRequest.params = { id: 'user-id' }
    vi.mocked(jwt.verify).mockReturnValue({ sub: 'user-id' } as any)

    const middleware = auth({ onlyTheOwner: true })
    await middleware(mockRequest as Request, mockResponse as Response, nextFunction)

    expect(nextFunction).toHaveBeenCalled()
  })

  it('should return 401 if token verification fails', async () => {
    mockRequest.headers = { authorization: 'Bearer invalid-token' }
    const error = new Error('Invalid token')
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw error
    })

    const middleware = auth()
    await middleware(mockRequest as Request, mockResponse as Response, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' })
  })

  it('should return 401 with default error message if thrown value is not an Error instance', async () => {
    mockRequest.headers = { authorization: 'Bearer invalid-token' }
    vi.mocked(jwt.verify).mockImplementation(() => {
      // eslint-disable-next-line no-throw-literal
      throw 'string error'
    })

    const middleware = auth()
    await middleware(mockRequest as Request, mockResponse as Response, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' })
  })
})
