export interface LoginWithMagicLinkRequest {
  readonly token: string
}

export interface LoginWithMagicLinkResponse {
  readonly accessToken: string
  readonly refreshToken: string
}
