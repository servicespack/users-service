import type { ClassConstructor } from 'class-transformer'
import type { NextFunction, Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'

export function validator(params: {
  Dto: ClassConstructor<unknown>
}) {
  return async (request: Request, response: Response, next: NextFunction) => {
    const payload = request.method === 'GET' ? request.query : request.body
    const dto = plainToInstance(params.Dto, payload)
    const errors = await validate(dto as object)

    if (errors.length > 0) {
      return response.status(400).json({ errors })
    }

    return next()
  }
}
