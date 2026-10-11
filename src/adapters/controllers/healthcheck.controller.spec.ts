import type { Request, Response } from 'express'
import { describe, expect, it, vi } from 'vitest'
import { HealthcheckController } from './healthcheck.controller'

describe('healthcheckController', () => {
  it('should return 200 when status is ok', async () => {
    const useCase = {
      execute: vi.fn().mockResolvedValue({
        status: 'ok',
        uptime: 100,
        timestamp: '2026-09-06T00:00:00.000Z',
        services: {
          database: { status: 'up' },
          notifications: { status: 'up' },
        },
      }),
    }
    const controller = new HealthcheckController(useCase)
    const request = {} as Request
    const response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response

    await controller.get(request, response)

    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'ok' }))
  })

  it('should return 503 when status is error', async () => {
    const useCase = {
      execute: vi.fn().mockResolvedValue({
        status: 'error',
        uptime: 100,
        timestamp: '2026-09-06T00:00:00.000Z',
        services: {
          database: { status: 'down' },
          notifications: { status: 'down' },
        },
      }),
    }
    const controller = new HealthcheckController(useCase)
    const request = {} as Request
    const response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response

    await controller.get(request, response)

    expect(response.status).toHaveBeenCalledWith(503)
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }))
  })
})
