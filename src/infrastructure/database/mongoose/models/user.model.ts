import type { Document } from 'mongoose'
import mongoose, { Schema } from 'mongoose'

export interface IUserDoc extends Document {
  name: string
  email: string
  emailVerificationKey: string
  isEmailVerified: boolean
  username: string
  password: string
  roles: string[]
  passwordResetToken?: string
  passwordResetExpiresAt?: Date
  createdAt: Date
  updatedAt: Date
}

export const userSchema = new Schema<IUserDoc>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    emailVerificationKey: { type: String, default: '' },
    isEmailVerified: { type: Boolean, default: false },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    roles: { type: [String], default: ['user'] },
    passwordResetToken: { type: String, default: null },
    passwordResetExpiresAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = (ret._id as mongoose.Types.ObjectId).toHexString()
        delete ret._id
        delete ret.__v
        delete ret.password
        delete ret.emailVerificationKey
        delete ret.passwordResetToken
        delete ret.passwordResetExpiresAt
        delete ret.createdAt
        delete ret.updatedAt
      },
    },
    toObject: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = (ret._id as mongoose.Types.ObjectId).toHexString()
        delete ret._id
        delete ret.__v
      },
    },
  },
)

userSchema.index({ name: 'text', email: 'text', username: 'text' })
userSchema.index({ passwordResetToken: 1 }, { sparse: true })

export const UserModel = mongoose.models.User || mongoose.model<IUserDoc>('User', userSchema)

export const userValidationRules = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['name', 'email', 'username', 'password'],
    properties: {
      name: { bsonType: 'string', description: 'must be a string and is required' },
      email: { bsonType: 'string', description: 'must be a string and is required' },
      emailVerificationKey: { bsonType: 'string' },
      isEmailVerified: { bsonType: 'bool' },
      username: { bsonType: 'string', description: 'must be a string and is required' },
      password: { bsonType: 'string', description: 'must be a string and is required' },
      roles: { bsonType: 'array', items: { bsonType: 'string' } },
      passwordResetToken: { bsonType: ['string', 'null'] },
      passwordResetExpiresAt: { bsonType: ['date', 'null'] },
    },
  },
}
