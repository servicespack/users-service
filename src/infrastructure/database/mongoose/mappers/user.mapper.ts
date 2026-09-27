import type { IUserDoc } from '../models/user.model'
import { User } from '../../../../domain/entities/user.entity'

export class UserMapper {
  static toDomain(doc: IUserDoc): User {
    const id = doc.id ? doc.id : (doc._id as string | object).toString()

    return new User({
      id,
      name: doc.name,
      email: doc.email,
      username: doc.username,
      password: doc.password,
      isEmailVerified: doc.isEmailVerified,
      emailVerificationKey: doc.emailVerificationKey,
      roles: doc.roles,
      passwordResetToken: doc.passwordResetToken,
      passwordResetExpiresAt: doc.passwordResetExpiresAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    })
  }

  static toPersistence(user: User): Record<string, unknown> {
    return {
      name: user.name,
      email: user.email,
      username: user.username,
      password: user.password,
      isEmailVerified: user.isEmailVerified,
      emailVerificationKey: user.emailVerificationKey,
      roles: user.roles,
      passwordResetToken: user.passwordResetToken,
      passwordResetExpiresAt: user.passwordResetExpiresAt,
    }
  }
}
