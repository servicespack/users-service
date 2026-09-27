import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('configuration', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('should use default values when environment variables are not set', async () => {
    const originalEnv = process.env
    process.env = {}

    const { configuration } = await import('../src/config')

    expect(configuration.environment).toBe('development')
    expect(configuration.database.uri).toBe('mongodb://localhost:27017/users-service')
    expect(configuration.servers.http.port).toBe('3000')
    expect(configuration.servers.grpc.port).toBe('50051')
    expect(configuration.notifications.url).toBe('http://localhost:3001')

    process.env = originalEnv
  })
})
