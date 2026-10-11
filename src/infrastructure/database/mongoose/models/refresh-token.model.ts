import mongoose from 'mongoose'

export interface IRefreshTokenDocument extends mongoose.Document {
  token: string
  userId: string
  expiresAt: Date
  isRevoked: boolean
  createdAt: Date
  updatedAt: Date
}

const refreshTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    isRevoked: { type: Boolean, required: true, default: false },
  },
  {
    timestamps: true,
  },
)

export const RefreshTokenModel = mongoose.model<IRefreshTokenDocument>('RefreshToken', refreshTokenSchema)
