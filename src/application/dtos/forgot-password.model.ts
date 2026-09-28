export interface ForgotPasswordRequest {
  readonly email: string
}

export interface ForgotPasswordResponse {
  readonly resetToken?: string
}
