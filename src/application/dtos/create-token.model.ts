export interface CreateTokenRequest {
  readonly username: string
  readonly password: string
}

export interface CreateTokenResponse {
  readonly accessToken: string
  readonly refreshToken: string
}
