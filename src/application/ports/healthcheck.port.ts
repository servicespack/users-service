export interface HealthServiceStatus {
  status: 'up' | 'down'
}

export interface HealthcheckResult {
  status: 'ok' | 'degraded' | 'error'
  uptime: number
  timestamp: string
  services: {
    database: HealthServiceStatus
    notifications: HealthServiceStatus
  }
}

export interface IHealthcheckUseCase {
  execute: () => Promise<HealthcheckResult>
}
