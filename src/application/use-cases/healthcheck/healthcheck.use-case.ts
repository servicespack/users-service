import type { HealthcheckResult, IHealthcheckUseCase } from '../../ports/healthcheck.port'
import process from 'node:process'

export interface HealthcheckDependencies {
  checkDatabase: () => Promise<'up' | 'down'> | 'up' | 'down'
  checkNotifications: () => Promise<'up' | 'down'>
  getUptime?: () => number
}

export class HealthcheckUseCase implements IHealthcheckUseCase {
  constructor(private readonly dependencies: HealthcheckDependencies) {}

  execute = async (): Promise<HealthcheckResult> => {
    const [databaseStatus, notificationsStatus] = await Promise.all([
      (async () => this.dependencies.checkDatabase())().catch(() => 'down' as const),
      (async () => this.dependencies.checkNotifications())().catch(() => 'down' as const),
    ])

    let status: 'ok' | 'degraded' | 'error' = 'ok'
    if (databaseStatus === 'down') {
      status = 'error'
    }
    else if (notificationsStatus === 'down') {
      status = 'degraded'
    }

    const uptime = this.dependencies.getUptime ? this.dependencies.getUptime() : process.uptime()

    return {
      status,
      uptime,
      timestamp: new Date().toISOString(),
      services: {
        database: { status: databaseStatus },
        notifications: { status: notificationsStatus },
      },
    }
  }
}
