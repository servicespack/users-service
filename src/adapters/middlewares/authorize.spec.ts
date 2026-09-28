import type { NextFunction, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authorize } from './authorize'

describe('authorize Middleware', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let nextFunction: NextFunction

  beforeEach(() => {
    mockRequest = {}
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }
    nextFunction = vi.fn()
  })

  it('should return 401 if user is not authenticated', () => {
    const middleware = authorize(['admin'])
    middleware(mockRequest as Request, mockResponse as Response, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'No token provided' })
    expect(nextFunction).not.toHaveBeenCalled()
  })

  it('should return 403 if user does not have any allowed role', () => {
    mockRequest.user = {
      id: 'user-1',
      roles: ['user'],
    }

    const middleware = authorize(['admin'])
    middleware(mockRequest as Request, mockResponse as Response, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(403)
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Forbidden' })
    expect(nextFunction).not.toHaveBeenCalled()
  })

  it('should return 403 if user roles array is empty', () => {
    mockRequest.user = {
      id: 'user-1',
      roles: [],
    }

    const middleware = authorize(['admin', 'manager'])
    middleware(mockRequest as Request, mockResponse as Response, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(403)
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Forbidden' })
    expect(nextFunction).not.toHaveBeenCalled()
  })

  it('should return 403 if user.roles is undefined', () => {
    mockRequest.user = {
      id: 'user-1',
    } as any

    const middleware = authorize(['admin'])
    middleware(mockRequest as Request, mockResponse as Response, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(403)
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Forbidden' })
    expect(nextFunction).not.toHaveBeenCalled()
  })

  it('should call next if user has the required role', () => {
    mockRequest.user = {
      id: 'admin-1',
      roles: ['admin'],
    }

    const middleware = authorize(['admin'])
    middleware(mockRequest as Request, mockResponse as Response, nextFunction)

    expect(nextFunction).toHaveBeenCalled()
    expect(mockResponse.status).not.toHaveBeenCalled()
  })

  it('should call next if user has one of several allowed roles', () => {
    mockRequest.user = {
      id: 'manager-1',
      roles: ['manager', 'user'],
    }

    const middleware = authorize(['admin', 'manager'])
    middleware(mockRequest as Request, mockResponse as Response, nextFunction)

    expect(nextFunction).toHaveBeenCalled()
    expect(mockResponse.status).not.toHaveBeenCalled()
  })
})
