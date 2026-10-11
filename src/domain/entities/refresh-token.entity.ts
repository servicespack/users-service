export interface RefreshTokenProps {
  id?: string
  token: string
  userId: string
  expiresAt: Date
  isRevoked?: boolean
  createdAt?: Date
  updatedAt?: Date
}

export class RefreshToken {
  private readonly _id?: string
  private readonly _token: string
  private readonly _userId: string
  private readonly _expiresAt: Date
  private _isRevoked: boolean
  private readonly _createdAt?: Date
  private readonly _updatedAt?: Date

  constructor(props: RefreshTokenProps) {
    this._id = props.id
    this._token = props.token
    this._userId = props.userId
    this._expiresAt = props.expiresAt
    this._isRevoked = props.isRevoked ?? false
    this._createdAt = props.createdAt
    this._updatedAt = props.updatedAt
  }

  get id(): string | undefined { return this._id }
  get token(): string { return this._token }
  get userId(): string { return this._userId }
  get expiresAt(): Date { return this._expiresAt }
  get isRevoked(): boolean { return this._isRevoked }
  get createdAt(): Date | undefined { return this._createdAt }
  get updatedAt(): Date | undefined { return this._updatedAt }

  revoke(): void {
    this._isRevoked = true
  }

  isValid(): boolean {
    return !this._isRevoked && this._expiresAt > new Date()
  }
}
