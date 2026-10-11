import { describe, expect, it } from 'vitest'
import { HealthcheckUseCase } from './healthcheck.use-case'

describe('healthcheckUseCase', () => {
  it('should return status ok when database and notifications are up', async () => {
    const useCase = new HealthcheckUseCase({
      checkDatabase: () => 'up',
      checkNotifications: async () => 'up',
      getUptime: () => 123.45,
    })

    const result = await useCase.execute()

    expect(result.status).toBe('ok')
    expect(result.uptime).toBe(123.45)
    expect(result.timestamp).toBeDefined()
    expect(result.services.database.status).toBe('up')
    expect(result.services.notifications.status).toBe('up')
  })

  it('should return status degraded when notifications is down', async () => {
    const useCase = new HealthcheckUseCase({
      checkDatabase: () => 'up',
      checkNotifications: async () => 'down',
      getUptime: () => 100,
    })

    const result = await useCase.execute()

    expect(result.status).toBe('degraded')
    expect(result.services.database.status).toBe('up')
    expect(result.services.notifications.status).toBe('down')
  })

  it('should return status error when database is down', async () => {
    const useCase = new HealthcheckUseCase({
      checkDatabase: () => 'down',
      checkNotifications: async () => 'up',
      getUptime: () => 100,
    })

    const result = await useCase.execute()

    expect(result.status).toBe('error')
    expect(result.services.database.status).toBe('down')
    expect(result.services.notifications.status).toBe('up')
  })

  it('should handle exceptions thrown by checks gracefully', async () => {
    const useCase = new HealthcheckUseCase({
      checkDatabase: () => {
        throw new Error('Database down')
      },
      checkNotifications: () => Promise.reject(new Error('Network error')),
      getUptime: () => 50,
    })

    const result = await useCase.execute()

    expect(result.status).toBe('error')
    expect(result.services.database.status).toBe('down')
    expect(result.services.notifications.status).toBe('down')
  })
})
