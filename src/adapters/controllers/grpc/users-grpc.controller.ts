import type { sendUnaryData, ServerUnaryCall } from '@grpc/grpc-js'
import type { GetUserByIdUseCase } from '../../../application/use-cases/users/get-user-by-id.use-case'
import type { ListUsersUseCase } from '../../../application/use-cases/users/list-users.use-case'
import type { User } from '../../../domain/entities/user.entity'
import { status } from '@grpc/grpc-js'
import { InvalidSearchQueryError, UserNotFoundError } from '../../../domain/errors'

export interface UsersGrpcControllerProps {
  getUserByIdUseCase: GetUserByIdUseCase
  listUsersUseCase: ListUsersUseCase
}

function toGrpcUser(user: User) {
  return {
    id: user.id ?? '',
    name: user.name,
    email: user.email,
    username: user.username,
    is_email_verified: user.isEmailVerified,
    roles: user.roles,
    created_at: user.createdAt ? user.createdAt.toISOString() : '',
    updated_at: user.updatedAt ? user.updatedAt.toISOString() : '',
  }
}

export class UsersGrpcController {
  private readonly getUserByIdUseCase: GetUserByIdUseCase
  private readonly listUsersUseCase: ListUsersUseCase

  constructor(props: UsersGrpcControllerProps) {
    this.getUserByIdUseCase = props.getUserByIdUseCase
    this.listUsersUseCase = props.listUsersUseCase
  }

  getUserById = async (
    call: ServerUnaryCall<{ id: string }, any>,
    callback: sendUnaryData<any>,
  ): Promise<void> => {
    try {
      const user = await this.getUserByIdUseCase.execute(call.request.id)
      callback(null, toGrpcUser(user))
    }
    catch (error) {
      if (error instanceof UserNotFoundError) {
        callback({
          code: status.NOT_FOUND,
          message: error.message,
        })
        return
      }
      callback({
        code: status.INTERNAL,
        message: error instanceof Error ? error.message : 'Internal server error',
      })
    }
  }

  listUsers = async (
    call: ServerUnaryCall<{ page?: number, size?: number, search?: string }, any>,
    callback: sendUnaryData<any>,
  ): Promise<void> => {
    try {
      const page = call.request.page && call.request.page > 0 ? Number(call.request.page) : 1
      const size = call.request.size && call.request.size > 0 ? Number(call.request.size) : 10
      const search = call.request.search || undefined

      const result = await this.listUsersUseCase.execute({ page, size, search })

      callback(null, {
        users: result.data.map(toGrpcUser),
        total: result.meta.total,
        page: result.meta.page,
        size: result.meta.size,
        pages: result.meta.pages,
      })
    }
    catch (error) {
      if (error instanceof InvalidSearchQueryError) {
        callback({
          code: status.INVALID_ARGUMENT,
          message: error.message,
        })
        return
      }
      callback({
        code: status.INTERNAL,
        message: error instanceof Error ? error.message : 'Internal server error',
      })
    }
  }
}
