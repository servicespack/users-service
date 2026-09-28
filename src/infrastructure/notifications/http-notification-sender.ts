import type { INotificationSender, SendEmailNotificationInput } from '../../application/ports/notification-sender.port'
import { logger } from '../../config/logger'

export interface HttpNotificationSenderOptions {
  baseUrl: string
  defaultFrom?: string
  suppressErrors?: boolean
  retries?: number
  retryDelay?: number
  timeout?: number
}

export class HttpNotificationSender implements INotificationSender {
  constructor(
    private readonly options: HttpNotificationSenderOptions,
  ) {}

  async sendEmail(input: SendEmailNotificationInput): Promise<void> {
    const from = input.from || this.options.defaultFrom || 'no-reply@servicespack.com'
    const url = `${this.options.baseUrl.replace(/\/$/, '')}/api/emails`
    const retries = this.options.retries ?? 0
    const retryDelay = this.options.retryDelay ?? 100
    const timeout = this.options.timeout ?? 5000

    let attempt = 0
    let lastError: unknown

    while (attempt <= retries) {
      attempt++
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from,
            to: input.to,
            subject: input.subject,
            content: input.content,
            templateCode: input.templateCode,
            variables: input.variables,
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const err = new Error(`Failed to send email notification: ${response.statusText}`)
          if (response.status >= 500 && attempt <= retries) {
            lastError = err
            await new Promise(resolve => setTimeout(resolve, retryDelay))
            continue
          }
          logger.error({ status: response.status, statusText: response.statusText }, 'Notifications API responded with error')
          if (this.options.suppressErrors === false) {
            throw err
          }
          return
        }

        return
      }
      catch (error) {
        lastError = error
        if (attempt <= retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          continue
        }
      }
    }

    logger.error({ error: lastError }, 'Failed to communicate with notifications-service')
    if (this.options.suppressErrors === false && lastError) {
      throw lastError
    }
  }
}
