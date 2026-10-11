import type { Request, Response } from 'express'

export class RootController {
  get(_request: Request, response: Response) {
    return response.status(200).json({ healthcheck: 'live' })
  }
}
