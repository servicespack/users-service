import type { Request, Response } from 'express'
import type { CreateUserUseCase } from '../../application/use-cases/users/create-user.use-case'
import type { DeleteUserUseCase } from '../../application/use-cases/users/delete-user.use-case'
import type { GetUserByIdUseCase } from '../../application/use-cases/users/get-user-by-id.use-case'
import type { ListUsersUseCase } from '../../application/use-cases/users/list-users.use-case'
import type { UpdateUserPasswordUseCase } from '../../application/use-cases/users/update-user-password.use-case'
import type { UpdateUserUseCase } from '../../application/use-cases/users/update-user.use-case'
import type { UpdatePasswordDto } from '../dtos/update-password.dto'
import type { UpdateUserDto } from '../dtos/update-user.dto'
import { handleHttpError } from '../helpers/http-error.helper'

export interface UsersControllerDependencies {
  createUserUseCase: CreateUserUseCase
  listUsersUseCase: ListUsersUseCase
  getUserByIdUseCase: GetUserByIdUseCase
  updateUserUseCase: UpdateUserUseCase
  updateUserPasswordUseCase: UpdateUserPasswordUseCase
  deleteUserUseCase: DeleteUserUseCase
}

export class UsersController {
  constructor(private readonly dependencies: UsersControllerDependencies) {}

  async list(request: Request, response: Response) {
    try {
      const { page, size, search } = request.query
      const result = await this.dependencies.listUsersUseCase.execute({
        page: page as string,
        size: size as string,
        search: search as string,
      })
      return response.status(200).json(result)
    }
    catch (error) {
      return handleHttpError(error, response)
    }
  }

  async show(request: Request, response: Response) {
    try {
      const user = await this.dependencies.getUserByIdUseCase.execute(request.params.id as string)
      return response.status(200).json(user)
    }
    catch (error) {
      return handleHttpError(error, response)
    }
  }

  async create(request: Request, response: Response) {
    try {
      const user = await this.dependencies.createUserUseCase.execute(request.body)
      return response.status(201).json(user)
    }
    catch (error) {
      return handleHttpError(error, response)
    }
  }

  async update(request: Request<{ id: string }, unknown, UpdateUserDto>, response: Response) {
    try {
      const user = await this.dependencies.updateUserUseCase.execute({
        id: request.params.id,
        name: request.body.name,
        email: request.body.email,
        username: request.body.username,
      })
      return response.status(200).json(user)
    }
    catch (error) {
      return handleHttpError(error, response)
    }
  }

  async updatePassword(request: Request<{ id: string }, unknown, UpdatePasswordDto>, response: Response) {
    try {
      await this.dependencies.updateUserPasswordUseCase.execute({
        id: request.params.id,
        currentPassword: request.body.currentPassword,
        newPassword: request.body.newPassword,
      })
      return response.status(200).json({
        message: 'Password updated',
      })
    }
    catch (error) {
      return handleHttpError(error, response)
    }
  }

  async delete(request: Request, response: Response) {
    try {
      await this.dependencies.deleteUserUseCase.execute(request.params.id as string)
      return response.status(204).json({})
    }
    catch (error) {
      return handleHttpError(error, response)
    }
  }
}
