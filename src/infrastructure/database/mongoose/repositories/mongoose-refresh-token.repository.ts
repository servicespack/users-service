import type { Model } from 'mongoose'
import type { RefreshToken } from '../../../../domain/entities/refresh-token.entity'
import type { IRefreshTokenRepository } from '../../../../domain/repositories/refresh-token.repository.interface'
import type { IRefreshTokenDocument } from '../models/refresh-token.model'
import { RefreshTokenMapper } from '../mappers/refresh-token.mapper'

export class MongooseRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly model: Model<IRefreshTokenDocument>) {}

  async create(refreshToken: RefreshToken): Promise<void> {
    const data = RefreshTokenMapper.toPersistence(refreshToken)
    await this.model.create(data)
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const doc = await this.model.findOne({ token })
    if (!doc)
      return null
    return RefreshTokenMapper.toDomain(doc)
  }

  async update(refreshToken: RefreshToken): Promise<void> {
    if (!refreshToken.id) {
      throw new Error('Cannot update refresh token without ID')
    }
    const data = RefreshTokenMapper.toPersistence(refreshToken)
    await this.model.findByIdAndUpdate(refreshToken.id, data)
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.model.updateMany({ userId }, { $set: { isRevoked: true } })
  }
}
