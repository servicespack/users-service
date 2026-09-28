export interface SendEmailNotificationInput {
  readonly to: string
  readonly subject?: string
  readonly content?: string
  readonly from?: string
  readonly templateCode?: string
  readonly variables?: Record<string, unknown>
}

export interface INotificationSender {
  sendEmail: (input: SendEmailNotificationInput) => Promise<void>
}
