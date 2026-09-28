import type { GetUserByIdUseCase } from '../../../application/use-cases/users/get-user-by-id.use-case'
import type { ListUsersUseCase } from '../../../application/use-cases/users/list-users.use-case'
import { status } from '@grpc/grpc-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { User } from '../../../domain/entities/user.entity'
import { InvalidSearchQueryError, UserNotFoundError } from '../../../domain/errors'
import { UsersGrpcController } from './users-grpc.controller'

describe(UsersGrpcController.name, () => {
  let getUserByIdUseCase: GetUserByIdUseCase
  let listUsersUseCase: ListUsersUseCase
  let controller: UsersGrpcController

  beforeEach(() => {
    getUserByIdUseCase = {
      execute: vi.fn(),
    } as unknown as GetUserByIdUseCase

    listUsersUseCase = {
      execute: vi.fn(),
    } as unknown as ListUsersUseCase

    controller = new UsersGrpcController({
      getUserByIdUseCase,
      listUsersUseCase,
    })
  })

  describe('getUserById', () => {
    it('should return user data when user exists', async () => {
      const now = new Date()
      const user = new User({
        id: 'u123',
        name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'hash',
        isEmailVerified: true,
        roles: ['user'],
        createdAt: now,
        updatedAt: now,
      })

      vi.mocked(getUserByIdUseCase.execute).mockResolvedValue(user)

      const call = { request: { id: 'u123' } } as any
      const callback = vi.fn()

      await controller.getUserById(call, callback)

      expect(getUserByIdUseCase.execute).toHaveBeenCalledWith('u123')
      expect(callback).toHaveBeenCalledWith(null, {
        id: 'u123',
        name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        is_email_verified: true,
        roles: ['user'],
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
    })

    it('should return NOT_FOUND error when user is not found', async () => {
      vi.mocked(getUserByIdUseCase.execute).mockRejectedValue(new UserNotFoundError())

      const call = { request: { id: 'unknown-id' } } as any
      const callback = vi.fn()

      await controller.getUserById(call, callback)

      expect(callback).toHaveBeenCalledWith({
        code: status.NOT_FOUND,
        message: expect.any(String),
      })
    })

    it('should return INTERNAL error with default message when non-Error is thrown in getUserById', async () => {
      vi.mocked(getUserByIdUseCase.execute).mockRejectedValue('string-error')

      const call = { request: { id: 'u123' } } as any
      const callback = vi.fn()

      await controller.getUserById(call, callback)

      expect(callback).toHaveBeenCalledWith({
        code: status.INTERNAL,
        message: 'Internal server error',
      })
    })

    it('should return user with empty dates when createdAt/updatedAt are undefined', async () => {
      const user = new User({
        id: 'u123',
        name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'hash',
        roles: ['user'],
      })

      vi.mocked(getUserByIdUseCase.execute).mockResolvedValue(user)

      const call = { request: { id: 'u123' } } as any
      const callback = vi.fn()

      await controller.getUserById(call, callback)

      expect(callback).toHaveBeenCalledWith(null, expect.objectContaining({
        created_at: '',
        updated_at: '',
      }))
    })
  })

  describe('listUsers', () => {
    it('should return paginated users list', async () => {
      const user = new User({
        id: 'u1',
        name: 'Alice',
        email: 'alice@example.com',
        username: 'alice',
        password: 'hash',
        roles: ['admin'],
      })

      vi.mocked(listUsersUseCase.execute).mockResolvedValue({
        data: [user],
        meta: {
          total: 1,
          page: 1,
          size: 10,
          pages: 1,
        },
      })

      const call = { request: { page: 1, size: 10, search: 'alice' } } as any
      const callback = vi.fn()

      await controller.listUsers(call, callback)

      expect(listUsersUseCase.execute).toHaveBeenCalledWith({
        page: 1,
        size: 10,
        search: 'alice',
      })
      expect(callback).toHaveBeenCalledWith(null, {
        users: [
          expect.objectContaining({
            id: 'u1',
            name: 'Alice',
            roles: ['admin'],
          }),
        ],
        total: 1,
        page: 1,
        size: 10,
        pages: 1,
      })
    })

    it('should return INVALID_ARGUMENT when query contains unsafe regex', async () => {
      vi.mocked(listUsersUseCase.execute).mockRejectedValue(new InvalidSearchQueryError())

      const call = { request: { search: '(a+)+$' } } as any
      const callback = vi.fn()

      await controller.listUsers(call, callback)

      expect(callback).toHaveBeenCalledWith({
        code: status.INVALID_ARGUMENT,
        message: expect.any(String),
      })
    })

    it('should return INTERNAL error on unexpected exception', async () => {
      vi.mocked(listUsersUseCase.execute).mockRejectedValue(new Error('Unexpected list error'))

      const call = { request: {} } as any
      const callback = vi.fn()

      await controller.listUsers(call, callback)

      expect(callback).toHaveBeenCalledWith({
        code: status.INTERNAL,
        message: 'Unexpected list error',
      })
    })

    it('should fallback to default page=1 and size=10 when negative values are provided', async () => {
      vi.mocked(listUsersUseCase.execute).mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, size: 10, pages: 0 },
      })

      const call = { request: { page: -1, size: 0 } } as any
      const callback = vi.fn()

      await controller.listUsers(call, callback)

      expect(listUsersUseCase.execute).toHaveBeenCalledWith({
        page: 1,
        size: 10,
        search: undefined,
      })
      expect(callback).toHaveBeenCalledWith(null, expect.objectContaining({ page: 1, size: 10 }))
    })

    it('should return INTERNAL error with default message when non-Error is thrown in listUsers', async () => {
      vi.mocked(listUsersUseCase.execute).mockRejectedValue('non-error-thrown')

      const call = { request: {} } as any
      const callback = vi.fn()

      await controller.listUsers(call, callback)

      expect(callback).toHaveBeenCalledWith({
        code: status.INTERNAL,
        message: 'Internal server error',
      })
    })
  })
})
