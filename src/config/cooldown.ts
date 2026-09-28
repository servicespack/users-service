import type * as grpc from '@grpc/grpc-js'
import type http from 'node:http'

import mongoose from 'mongoose'

import { stopGrpcServer } from '../infrastructure/grpc/server'
import { logger } from './logger'

function cooldown({ server, grpcServer }: {
  server: http.Server
  grpcServer?: grpc.Server
}): void {
  const close = (code: number) => () => {
    server.close(async () => {
      if (grpcServer) {
        try {
          await stopGrpcServer(grpcServer)
        }
        catch (error) {
          logger.error(error)
        }
      }
      mongoose.disconnect().then(() => process.exit(code)).catch(error => logger.error(error))
    })
  }

  process.on('SIGHUP', close(128 + 1))
  process.on('SIGINT', close(128 + 2))
  process.on('SIGTERM', close(128 + 15))
}

export default cooldown
