import fs from 'node:fs'
import path from 'node:path'
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'

import { UsersGrpcController } from '../../adapters/controllers/grpc/users-grpc.controller'
import { GetUserByIdUseCase } from '../../application/use-cases/users/get-user-by-id.use-case'
import { ListUsersUseCase } from '../../application/use-cases/users/list-users.use-case'
import { logger } from '../../config/logger'
import { UserModel } from '../database/mongoose/models/user.model'
import { MongooseUserRepository } from '../database/mongoose/repositories/mongoose-user.repository'

export interface CreateGrpcServerOptions {
  getUserByIdUseCase?: GetUserByIdUseCase
  listUsersUseCase?: ListUsersUseCase
  controller?: UsersGrpcController
}

export function getProtoPath(): string {
  const candidatePaths = [
    path.resolve(process.cwd(), 'src/infrastructure/grpc/protos/users.proto'),
    path.resolve(process.cwd(), 'dist/protos/users.proto'),
    path.resolve(process.cwd(), 'dist/infrastructure/grpc/protos/users.proto'),
    path.resolve(process.cwd(), 'protos/users.proto'),
  ]

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  return path.resolve(process.cwd(), 'src/infrastructure/grpc/protos/users.proto')
}

export function createGrpcServer(options?: CreateGrpcServerOptions): grpc.Server {
  const protoPath = getProtoPath()

  const packageDefinition = protoLoader.loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  })

  const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any
  const usersProto = protoDescriptor.users.v1

  let controller = options?.controller

  if (!controller) {
    const userRepository = new MongooseUserRepository(UserModel)
    const getUserByIdUseCase = options?.getUserByIdUseCase ?? new GetUserByIdUseCase(userRepository)
    const listUsersUseCase = options?.listUsersUseCase ?? new ListUsersUseCase(userRepository)

    controller = new UsersGrpcController({
      getUserByIdUseCase,
      listUsersUseCase,
    })
  }

  const server = new grpc.Server()

  server.addService(usersProto.UserService.service, {
    GetUserById: controller.getUserById,
    ListUsers: controller.listUsers,
    getUserById: controller.getUserById,
    listUsers: controller.listUsers,
  })

  return server
}

export function startGrpcServer(
  server: grpc.Server,
  port: string | number,
): Promise<number> {
  return new Promise((resolve, reject) => {
    server.bindAsync(
      `0.0.0.0:${port}`,
      grpc.ServerCredentials.createInsecure(),
      (error, boundPort) => {
        if (error) {
          return reject(error)
        }
        logger.info(`gRPC server listening on ${boundPort}`)
        resolve(boundPort)
      },
    )
  })
}

export function stopGrpcServer(server: grpc.Server): Promise<void> {
  return new Promise((resolve) => {
    server.tryShutdown((error) => {
      if (error) {
        logger.error({ error }, 'Error during graceful gRPC shutdown, forcing shutdown')
        server.forceShutdown()
      }
      resolve()
    })
  })
}
