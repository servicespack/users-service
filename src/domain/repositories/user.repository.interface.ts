import type { User } from '../entities/user.entity'

export interface ListUsersParams {
  readonly page: number
  readonly size: number
  readonly search?: string
}

export interface PaginatedUsersResult {
  readonly users: readonly User[]
  readonly total: number
}

export interface IUserRepository {
  create: (user: User) => Promise<User>
  findById: (id: string) => Promise<User | null>
  findByUsername: (username: string) => Promise<User | null>
  findByEmail: (email: string) => Promise<User | null>
  findByResetToken: (token: string) => Promise<User | null>
  findByUsernameOrEmail: (identifier: string) => Promise<User | null>
  findByMagicLoginToken: (token: string) => Promise<User | null>
  list: (params: ListUsersParams) => Promise<PaginatedUsersResult>
  update: (user: User) => Promise<User>
  delete: (id: string) => Promise<void>
}
