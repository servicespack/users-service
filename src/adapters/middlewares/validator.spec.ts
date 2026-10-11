import type { NextFunction, Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { validator } from './validator'

vi.mock('class-transformer', () => ({
  plainToInstance: vi.fn(),
}))

vi.mock('class-validator', () => ({
  validate: vi.fn(),
}))

class MockDto {}

describe('validator Middleware', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let nextFunction: NextFunction

  beforeEach(() => {
    mockRequest = {
      method: 'POST',
      body: { name: 'test' },
      query: {},
    }
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }
    nextFunction = vi.fn()
  })

  it('should use query for GET requests', async () => {
    mockRequest.method = 'GET'
    mockRequest.query = { q: 'search' }
    const mockDtoInstance = new MockDto()
    vi.mocked(plainToInstance).mockReturnValue(mockDtoInstance)
    vi.mocked(validate).mockResolvedValue([])

    const middleware = validator({ Dto: MockDto })
    await middleware(mockRequest as Request, mockResponse as Response, nextFunction)

    expect(plainToInstance).toHaveBeenCalledWith(MockDto, { q: 'search' })
    expect(nextFunction).toHaveBeenCalled()
  })

  it('should use body for non-GET requests', async () => {
    const mockDtoInstance = new MockDto()
    vi.mocked(plainToInstance).mockReturnValue(mockDtoInstance)
    vi.mocked(validate).mockResolvedValue([])

    const middleware = validator({ Dto: MockDto })
    await middleware(mockRequest as Request, mockResponse as Response, nextFunction)

    expect(plainToInstance).toHaveBeenCalledWith(MockDto, { name: 'test' })
    expect(nextFunction).toHaveBeenCalled()
  })

  it('should return 400 if validation errors exist', async () => {
    const mockDtoInstance = new MockDto()
    vi.mocked(plainToInstance).mockReturnValue(mockDtoInstance)
    const mockErrors = [{ property: 'name', constraints: { isNotEmpty: 'name should not be empty' } }]
    vi.mocked(validate).mockResolvedValue(mockErrors as any)

    const middleware = validator({ Dto: MockDto })
    await middleware(mockRequest as Request, mockResponse as Response, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith({ errors: mockErrors })
    expect(nextFunction).not.toHaveBeenCalled()
  })
})
