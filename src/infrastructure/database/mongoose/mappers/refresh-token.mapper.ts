import type { IRefreshTokenDocument } from '../models/refresh-token.model'
import { RefreshToken } from '../../../../domain/entities/refresh-token.entity'

export class RefreshTokenMapper {
  static toDomain(doc: IRefreshTokenDocument): RefreshToken {
    return new RefreshToken({
      id: doc._id.toString(),
      token: doc.token,
      userId: doc.userId,
      expiresAt: doc.expiresAt,
      isRevoked: doc.isRevoked,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    })
  }

  static toPersistence(entity: RefreshToken): any {
    return {
      token: entity.token,
      userId: entity.userId,
      expiresAt: entity.expiresAt,
      isRevoked: entity.isRevoked,
    }
  }
}
