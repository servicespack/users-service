import type { RefreshToken } from '../entities/refresh-token.entity'

export interface IRefreshTokenRepository {
  create: (refreshToken: RefreshToken) => Promise<void>
  findByToken: (token: string) => Promise<RefreshToken | null>
  update: (refreshToken: RefreshToken) => Promise<void>
  revokeAllForUser: (userId: string) => Promise<void>
}
