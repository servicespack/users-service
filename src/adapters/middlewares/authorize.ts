import type { NextFunction, Request, Response } from 'express'

export function authorize(allowedRoles: string[]) {
  return (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    if (!request.user) {
      return response.status(401).json({
        error: 'No token provided',
      })
    }

    const userRoles = request.user.roles ?? []
    const hasPermission = allowedRoles.some(role => userRoles.includes(role))

    if (!hasPermission) {
      return response.status(403).json({
        error: 'Forbidden',
      })
    }

    return next()
  }
}

export default authorize
