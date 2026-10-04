import { env } from '../env.js'

// Sending is behind this one function so the provider can change (another gateway, a company account) without
// touching the kiosk. Today: textbee.dev, an Android phone that sends from its own SIM.

export class SmsError extends Error {
  /** Why it failed, for the logs. Never contains the phone number. */
  readonly reason: 'not_configured' | 'rejected' | 'unavailable'

  constructor(message: string, reason: SmsError['reason']) {
    super(message)
    this.reason = reason
  }
}

const TEXTBEE_URL = 'https://api.textbee.dev/api/v1/gateway/send-sms'
const TIMEOUT_MS = 10_000

/** Sends one SMS. Resolves when the gateway accepted it; delivery happens on the phone afterwards. */
export async function sendSms(to: string, text: string) {
  if (!env.TEXTBEE_API_KEY) throw new SmsError('SMS is not configured (TEXTBEE_API_KEY)', 'not_configured')

  let response: Response
  try {
    response = await fetch(TEXTBEE_URL, {
      method: 'POST',
      headers: { 'x-api-key': env.TEXTBEE_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ recipients: [to], message: text, ...(env.TEXTBEE_DEVICE_ID && { deviceId: env.TEXTBEE_DEVICE_ID }) }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (err) {
    throw new SmsError(`textbee unreachable: ${err instanceof Error ? err.message : String(err)}`, 'unavailable')
  }

  if (!response.ok) {
    // 400 no device / unverified email, 401 bad key, 429 plan limit. The body is the provider's message, no number in it.
    const body = (await response.text().catch(() => '')).slice(0, 300)
    throw new SmsError(`textbee responded ${response.status}: ${body}`, response.status >= 500 ? 'unavailable' : 'rejected')
  }
}
