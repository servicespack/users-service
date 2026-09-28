import type { Model } from 'mongoose'
import type {
  IUserRepository,
  ListUsersParams,
  PaginatedUsersResult,
} from '../../../../domain/repositories/user.repository.interface'
import type { IUserDoc } from '../models/user.model'
import { User } from '../../../../domain/entities/user.entity'
import { UserNotFoundError } from '../../../../domain/errors'
import { UserMapper } from '../mappers/user.mapper'

export class MongooseUserRepository implements IUserRepository {
  constructor(private readonly model: Model<IUserDoc>) {}

  async create(user: User): Promise<User> {
    const created = await this.model.create(UserMapper.toPersistence(user))
    return UserMapper.toDomain(created)
  }

  async findById(id: string): Promise<User | null> {
    const doc = await this.model.findById(id)
    return doc ? UserMapper.toDomain(doc) : null
  }

  async findByUsername(username: string): Promise<User | null> {
    const doc = await this.model.findOne({ username: username.toLowerCase().trim() })
    return doc ? UserMapper.toDomain(doc) : null
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await this.model.findOne({ email: email.toLowerCase().trim() })
    return doc ? UserMapper.toDomain(doc) : null
  }

  async findByResetToken(passwordResetToken: string): Promise<User | null> {
    const hashedToken = User.hashToken(passwordResetToken)
    const doc = await this.model.findOne({ passwordResetToken: hashedToken })
    return doc ? UserMapper.toDomain(doc) : null
  }

  async findByUsernameOrEmail(identifier: string): Promise<User | null> {
    const doc = await this.model.findOne({
      $or: [
        { username: identifier.toLowerCase().trim() },
        { email: identifier.toLowerCase().trim() },
      ],
    })
    return doc ? UserMapper.toDomain(doc) : null
  }

  async findByMagicLoginToken(magicLoginToken: string): Promise<User | null> {
    const hashedToken = User.hashToken(magicLoginToken)
    const doc = await this.model.findOne({ magicLoginToken: hashedToken })
    return doc ? UserMapper.toDomain(doc) : null
  }

  async list(params: ListUsersParams): Promise<PaginatedUsersResult> {
    let query = {}

    if (params.search && params.search !== '') {
      query = {
        ...query,
        $text: { $search: params.search },
      }
    }

    const [docs, total] = await Promise.all([
      this.model
        .find(query)
        .skip((Number(params.page) - 1) * Number(params.size))
        .limit(Number(params.size)),
      this.model.countDocuments(query),
    ])

    return {
      users: docs.map(doc => UserMapper.toDomain(doc)),
      total,
    }
  }

  async update(user: User): Promise<User> {
    const doc = await this.model.findById(user.id)

    if (!doc) {
      throw new UserNotFoundError()
    }

    doc.name = user.name
    doc.email = user.email
    doc.username = user.username
    doc.password = user.password
    doc.isEmailVerified = user.isEmailVerified
    doc.emailVerificationKey = user.emailVerificationKey
    doc.roles = user.roles
    doc.passwordResetToken = user.passwordResetToken
    doc.passwordResetExpiresAt = user.passwordResetExpiresAt
    doc.magicLoginToken = user.magicLoginToken
    doc.magicLoginExpiresAt = user.magicLoginExpiresAt

    await doc.save()

    return UserMapper.toDomain(doc)
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id)
  }
}
