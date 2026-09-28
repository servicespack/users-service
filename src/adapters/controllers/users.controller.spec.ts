import type { Request, Response } from 'express'
import type { Mock } from 'vitest'
import type { UsersControllerDependencies } from './users.controller'

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import {
  InvalidPasswordError,
  InvalidSearchQueryError,
  UserNotFoundError,
} from '../../domain/errors'

import { UsersController } from './users.controller'

describe(UsersController.name, () => {
  let usersController: UsersController
  let dependencies: Record<string, { execute: Mock }>
  let request: Request
  let response: Response

  beforeEach(() => {
    dependencies = {
      createUserUseCase: { execute: vi.fn() },
      listUsersUseCase: { execute: vi.fn() },
      getUserByIdUseCase: { execute: vi.fn() },
      updateUserUseCase: { execute: vi.fn() },
      updateUserPasswordUseCase: { execute: vi.fn() },
      deleteUserUseCase: { execute: vi.fn() },
    }
    usersController = new UsersController(dependencies as unknown as UsersControllerDependencies)
    request = ({
      query: {},
      params: {},
      body: {},
    } as unknown as Request)
    response = ({
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response)
  })

  describe('list', () => {
    it('should return 400 if search is unsafe', async () => {
      request.query.search = '(a+)+$'
      dependencies.listUsersUseCase.execute.mockRejectedValue(new InvalidSearchQueryError())

      await usersController.list(request, response)

      expect(response.status).toHaveBeenCalledWith(400)
    })

    it('should return 200 with list of users', async () => {
      const mockResult = {
        meta: { page: 1, size: 10, pages: 1, total: 0 },
        data: [],
      }
      dependencies.listUsersUseCase.execute.mockResolvedValue(mockResult)

      await usersController.list(request, response)

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.json).toHaveBeenCalledWith(mockResult)
    })
  })

  describe('show', () => {
    it('should return 404 if user not found', async () => {
      dependencies.getUserByIdUseCase.execute.mockRejectedValue(new UserNotFoundError())

      await usersController.show(request, response)

      expect(response.status).toHaveBeenCalledWith(404)
    })

    it('should return 200 if user found', async () => {
      const user = { id: '1' }
      dependencies.getUserByIdUseCase.execute.mockResolvedValue(user)

      await usersController.show(request, response)

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.json).toHaveBeenCalledWith(user)
    })
  })

  describe('create', () => {
    it('should return 201 and create user', async () => {
      request.body = {
        name: 'Name',
        email: 'email@test.com',
        username: 'user',
        password: 'password',
      }
      const created = { id: '1', name: 'Name' }
      dependencies.createUserUseCase.execute.mockResolvedValue(created)

      await usersController.create(request, response)

      expect(response.status).toHaveBeenCalledWith(201)
      expect(response.json).toHaveBeenCalledWith(created)
    })
  })

  describe('update', () => {
    it('should return 404 if user not found', async () => {
      dependencies.updateUserUseCase.execute.mockRejectedValue(new UserNotFoundError())

      await usersController.update(request as Parameters<typeof usersController.update>[0], response)

      expect(response.status).toHaveBeenCalledWith(404)
    })

    it('should return 200 and update user', async () => {
      const updatedUser = { id: '1', name: 'New' }
      dependencies.updateUserUseCase.execute.mockResolvedValue(updatedUser)
      request.params = { id: '1' }
      request.body = { name: 'New' }

      await usersController.update(request as Parameters<typeof usersController.update>[0], response)

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.json).toHaveBeenCalledWith(updatedUser)
    })
  })

  describe('updatePassword', () => {
    it('should return 401 if current password is wrong', async () => {
      dependencies.updateUserPasswordUseCase.execute.mockRejectedValue(new InvalidPasswordError())
      request.params = { id: '1' }
      request.body = { currentPassword: 'wrong', newPassword: 'new' }

      await usersController.updatePassword(request as Parameters<typeof usersController.updatePassword>[0], response)

      expect(response.status).toHaveBeenCalledWith(401)
    })

    it('should return 200 and update password', async () => {
      dependencies.updateUserPasswordUseCase.execute.mockResolvedValue(undefined)
      request.params = { id: '1' }
      request.body = { currentPassword: 'old', newPassword: 'new' }

      await usersController.updatePassword(request as Parameters<typeof usersController.updatePassword>[0], response)

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.json).toHaveBeenCalledWith({ message: 'Password updated' })
    })
  })

  describe('delete', () => {
    it('should return 404 if user not found', async () => {
      dependencies.deleteUserUseCase.execute.mockRejectedValue(new UserNotFoundError())
      request.params = { id: '1' }

      await usersController.delete(request, response)

      expect(response.status).toHaveBeenCalledWith(404)
    })

    it('should return 204 and delete user', async () => {
      dependencies.deleteUserUseCase.execute.mockResolvedValue(undefined)
      request.params = { id: '1' }

      await usersController.delete(request, response)

      expect(response.status).toHaveBeenCalledWith(204)
    })
  })
})
