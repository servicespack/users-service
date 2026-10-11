import type http from 'node:http'
import mongoose from 'mongoose'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { stopGrpcServer } from '../infrastructure/grpc/server'
import cooldown from './cooldown'
import { logger } from './logger'

vi.mock('mongoose', () => ({
  default: {
    disconnect: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('../infrastructure/grpc/server', () => ({
  stopGrpcServer: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('./logger', () => ({
  logger: {
    error: vi.fn(),
  },
}))

describe('cooldown', () => {
  let mockServer: Partial<http.Server>
  let processOnSpy: any
  let processExitSpy: any

  beforeEach(() => {
    mockServer = {
      close: vi.fn((cb) => {
        if (cb)
          cb(undefined)
        return mockServer as http.Server
      }),
    }
    processOnSpy = vi.spyOn(process, 'on').mockImplementation(() => process)
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should register process event listeners', () => {
    cooldown({ server: mockServer as http.Server })

    expect(processOnSpy).toHaveBeenCalledWith('SIGHUP', expect.any(Function))
    expect(processOnSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function))
    expect(processOnSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function))
  })

  it('should close server, disconnect mongoose and exit process when signal is triggered', async () => {
    cooldown({ server: mockServer as http.Server })

    // Get the registered SIGTERM handler
    const sigtermCall = processOnSpy.mock.calls.find((call: any[]) => call[0] === 'SIGTERM')
    const sigtermHandler = sigtermCall[1]

    // Trigger handler
    sigtermHandler()

    expect(mockServer.close).toHaveBeenCalled()
    // Wait for the promise to resolve in the close callback
    await new Promise(process.nextTick)

    expect(mongoose.disconnect).toHaveBeenCalled()
    expect(processExitSpy).toHaveBeenCalledWith(128 + 15)
  })

  it('should log error if mongoose disconnect fails', async () => {
    const error = new Error('Disconnect failed')
    vi.mocked(mongoose.disconnect).mockRejectedValueOnce(error)

    cooldown({ server: mockServer as http.Server })

    const sigtermCall = processOnSpy.mock.calls.find((call: any[]) => call[0] === 'SIGTERM')
    const sigtermHandler = sigtermCall[1]

    sigtermHandler()

    expect(mockServer.close).toHaveBeenCalled()
    await new Promise(process.nextTick)

    expect(mongoose.disconnect).toHaveBeenCalled()
    expect(logger.error).toHaveBeenCalledWith(error)
    expect(processExitSpy).not.toHaveBeenCalled()
  })

  it('should stop grpcServer if provided on close', async () => {
    const mockGrpcServer = {} as any

    cooldown({ server: mockServer as http.Server, grpcServer: mockGrpcServer })

    const sigtermCall = processOnSpy.mock.calls.find((call: any[]) => call[0] === 'SIGTERM')
    const sigtermHandler = sigtermCall[1]

    sigtermHandler()

    expect(mockServer.close).toHaveBeenCalled()
    await new Promise(process.nextTick)

    expect(stopGrpcServer).toHaveBeenCalledWith(mockGrpcServer)
  })
})
