import type { Request, Response } from 'express'
import type { IHealthcheckUseCase } from '../../application/ports/healthcheck.port'

export class HealthcheckController {
  constructor(private readonly healthcheckUseCase: IHealthcheckUseCase) {}

  async get(_request: Request, response: Response): Promise<void> {
    const result = await this.healthcheckUseCase.execute()
    const statusCode = result.status === 'error' ? 503 : 200
    response.status(statusCode).json(result)
  }
}
