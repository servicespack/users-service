export interface TokenPayload {
  readonly iss?: string
  readonly sub: string
  readonly roles?: readonly string[]
}

export interface ITokenProvider {
  generate: (payload: TokenPayload) => string
}
