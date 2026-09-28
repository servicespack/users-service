import type { IUserRepository } from '../../../domain/repositories/user.repository.interface'
import type { IPasswordHasher } from '../../ports/password-hasher.port'
import crypto from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { User } from '../../../domain/entities/user.entity'
import {
  InvalidPasswordError,
  InvalidSearchQueryError,
  UserNotFoundError,
} from '../../../domain/errors'
import { CreateUserUseCase } from './create-user.use-case'
import { DeleteUserUseCase } from './delete-user.use-case'
import { GetUserByIdUseCase } from './get-user-by-id.use-case'
import { ListUsersUseCase } from './list-users.use-case'
import { UpdateUserPasswordUseCase } from './update-user-password.use-case'
import { UpdateUserUseCase } from './update-user.use-case'

describe('users Use Cases', () => {
  let userRepository: IUserRepository
  let passwordHasher: IPasswordHasher

  beforeEach(() => {
    userRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByUsername: vi.fn(),
      findByEmail: vi.fn(),
      findByResetToken: vi.fn(),
      findByUsernameOrEmail: vi.fn(),
      findByMagicLoginToken: vi.fn(),
      list: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }
    passwordHasher = {
      hash: vi.fn().mockResolvedValue('hashed-pass'),
      verify: vi.fn(),
    }
  })

  describe(CreateUserUseCase.name, () => {
    it('should sanitize input, hash password and persist user', async () => {
      const useCase = new CreateUserUseCase(userRepository, passwordHasher)
      const createdMockUser = new User({
        id: 'u1',
        name: 'Clean Name',
        email: 'test@example.com',
        username: 'cleanuser',
        password: 'hashed-pass',
      })
      vi.mocked(userRepository.create).mockResolvedValue(createdMockUser)

      const result = await useCase.execute({
        name: '<script>alert(1)</script>Clean Name',
        email: 'test@example.com',
        username: 'cleanuser',
        password: 'raw-password',
      })

      expect(passwordHasher.hash).toHaveBeenCalledWith('raw-password')
      expect(userRepository.create).toHaveBeenCalledWith(expect.any(User))
      expect(result).toBe(createdMockUser)
    })

    it('should pass roles to user if provided', async () => {
      const useCase = new CreateUserUseCase(userRepository, passwordHasher)
      let savedUser: User | undefined
      vi.mocked(userRepository.create).mockImplementation(async (u) => {
        savedUser = u
        return u
      })

      await useCase.execute({
        name: 'Admin User',
        email: 'admin@example.com',
        username: 'adminuser',
        password: 'raw-password',
        roles: ['admin', 'user'],
      })

      expect(savedUser?.roles).toEqual(['admin', 'user'])
    })

    it('should call notificationSender.sendEmail when notificationSender is provided', async () => {
      const randomUUIDSpy = vi.spyOn(crypto, 'randomUUID').mockReturnValue('key-123' as any)
      const notificationSender = {
        sendEmail: vi.fn().mockResolvedValue(undefined),
      }
      const useCase = new CreateUserUseCase(userRepository, passwordHasher, notificationSender)
      const createdMockUser = new User({
        id: 'u1',
        name: 'Clean Name',
        email: 'test@example.com',
        username: 'cleanuser',
        password: 'hashed-pass',
        emailVerificationKey: User.hashToken('key-123'),
      })
      vi.mocked(userRepository.create).mockResolvedValue(createdMockUser)

      await useCase.execute({
        name: 'Clean Name',
        email: 'test@example.com',
        username: 'cleanuser',
        password: 'raw-password',
      })

      expect(notificationSender.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          templateCode: 'verify-email',
          subject: 'Verify your email',
          content: expect.stringContaining('key-123'),
        }),
      )

      randomUUIDSpy.mockRestore()
    })
  })

  describe(ListUsersUseCase.name, () => {
    it('should throw InvalidSearchQueryError on ReDoS attempt', async () => {
      const useCase = new ListUsersUseCase(userRepository)

      await expect(useCase.execute({
        search: '(a+)+$',
      })).rejects.toThrow(InvalidSearchQueryError)
    })

    it('should list users with pagination meta', async () => {
      const useCase = new ListUsersUseCase(userRepository)
      const mockUsers = [new User({ name: 'A', email: 'a@a.com', username: 'a', password: 'p' })]
      vi.mocked(userRepository.list).mockResolvedValue({ users: mockUsers, total: 1 })

      const result = await useCase.execute({ page: 1, size: 10, search: 'test' })

      expect(result).toEqual({
        meta: {
          page: 1,
          size: 10,
          pages: 1,
          total: 1,
        },
        data: mockUsers,
      })
      expect(userRepository.list).toHaveBeenCalledWith({ page: 1, size: 10, search: 'test' })
    })
  })

  describe(GetUserByIdUseCase.name, () => {
    it('should throw UserNotFoundError when user is not found', async () => {
      const useCase = new GetUserByIdUseCase(userRepository)
      vi.mocked(userRepository.findById).mockResolvedValue(null)

      await expect(useCase.execute('missing-id')).rejects.toThrow(UserNotFoundError)
    })

    it('should return user when found', async () => {
      const useCase = new GetUserByIdUseCase(userRepository)
      const user = new User({ id: 'u1', name: 'A', email: 'a@a.com', username: 'a', password: 'p' })
      vi.mocked(userRepository.findById).mockResolvedValue(user)

      const result = await useCase.execute('u1')
      expect(result).toBe(user)
    })
  })

  describe(UpdateUserUseCase.name, () => {
    it('should throw UserNotFoundError if user does not exist', async () => {
      const useCase = new UpdateUserUseCase(userRepository)
      vi.mocked(userRepository.findById).mockResolvedValue(null)

      await expect(useCase.execute({ id: 'nonexistent' })).rejects.toThrow(UserNotFoundError)
    })

    it('should update user fields and persist', async () => {
      const useCase = new UpdateUserUseCase(userRepository)
      const user = new User({ id: 'u1', name: 'Old', email: 'old@a.com', username: 'old', password: 'p' })
      vi.mocked(userRepository.findById).mockResolvedValue(user)
      vi.mocked(userRepository.update).mockImplementation(async u => u)

      const updated = await useCase.execute({ id: 'u1', name: 'New' })
      expect(updated.name).toBe('New')
      expect(userRepository.update).toHaveBeenCalledWith(user)
    })
  })

  describe(UpdateUserPasswordUseCase.name, () => {
    it('should throw UserNotFoundError if user does not exist', async () => {
      const useCase = new UpdateUserPasswordUseCase(userRepository, passwordHasher)
      vi.mocked(userRepository.findById).mockResolvedValue(null)

      await expect(useCase.execute({
        id: 'nonexistent',
        currentPassword: 'cur',
        newPassword: 'new',
      })).rejects.toThrow(UserNotFoundError)
    })

    it('should throw InvalidPasswordError if current password does not match', async () => {
      const useCase = new UpdateUserPasswordUseCase(userRepository, passwordHasher)
      const user = new User({ id: 'u1', name: 'A', email: 'a@a.com', username: 'a', password: 'old-hash' })
      vi.mocked(userRepository.findById).mockResolvedValue(user)
      vi.mocked(passwordHasher.verify).mockResolvedValue(false)

      await expect(useCase.execute({
        id: 'u1',
        currentPassword: 'wrong-password',
        newPassword: 'new-password',
      })).rejects.toThrow(InvalidPasswordError)
    })

    it('should update password with new hash when verified', async () => {
      const useCase = new UpdateUserPasswordUseCase(userRepository, passwordHasher)
      const user = new User({ id: 'u1', name: 'A', email: 'a@a.com', username: 'a', password: 'old-hash' })
      vi.mocked(userRepository.findById).mockResolvedValue(user)
      vi.mocked(passwordHasher.verify).mockResolvedValue(true)
      vi.mocked(passwordHasher.hash).mockResolvedValue('new-hash')

      await useCase.execute({
        id: 'u1',
        currentPassword: 'correct-password',
        newPassword: 'new-password',
      })

      expect(user.password).toBe('new-hash')
      expect(userRepository.update).toHaveBeenCalledWith(user)
    })
  })

  describe(DeleteUserUseCase.name, () => {
    it('should throw UserNotFoundError when deleting nonexistent user', async () => {
      const useCase = new DeleteUserUseCase(userRepository)
      vi.mocked(userRepository.findById).mockResolvedValue(null)

      await expect(useCase.execute('missing')).rejects.toThrow(UserNotFoundError)
    })

    it('should delete user when found', async () => {
      const useCase = new DeleteUserUseCase(userRepository)
      const user = new User({ id: 'u1', name: 'A', email: 'a@a.com', username: 'a', password: 'p' })
      vi.mocked(userRepository.findById).mockResolvedValue(user)

      await useCase.execute('u1')
      expect(userRepository.delete).toHaveBeenCalledWith('u1')
    })
  })
})
