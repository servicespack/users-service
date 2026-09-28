import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

import { configuration } from '../../config'

declare global {
  // eslint-disable-next-line ts/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string
        roles: string[]
      }
    }
  }
}

const TOKEN_SECRET = configuration.auth.jwtSecret

function auth({ onlyTheOwner = false } = {}) {
  return async (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    const { authorization } = request.headers

    if (authorization === undefined) {
      return response.status(401).json({
        error: 'No token provided',
      })
    }

    const [, token] = authorization.split(' ')

    try {
      const decoded = jwt.verify(token, TOKEN_SECRET) as { sub?: string, roles?: string[], [key: string]: unknown }
      const { sub, roles } = decoded

      request.user = {
        id: sub as string,
        roles: roles ?? [],
      }

      const { id } = request.params

      if (onlyTheOwner && sub !== id) {
        return response.status(401).json({
          error: 'Only allowed to the owner',
        })
      }

      return next()
    }
    catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid token'
      return response.status(401).json({
        error: message,
      })
    }
  }
}

export default auth
