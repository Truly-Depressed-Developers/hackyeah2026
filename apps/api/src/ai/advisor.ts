import type { Context } from 'hono'
import { z } from 'zod'
import { createRateLimiter, ipFromContext } from '../analytics/rate-limit.js'
import { env } from '../env.js'

// One analysis costs ~50 s of Gemini time and the email goes out through the AI service's SMTP, so both are throttled per IP.
const advisorLimiter = createRateLimiter({ limit: 6, windowMs: 10 * 60_000 })
const emailLimiter = createRateLimiter({ limit: 5, windowMs: 10 * 60_000 })

const STREAM_TIMEOUT_MS = 180_000
const EMAIL_TIMEOUT_MS = 60_000

export const advisorRequest = z.object({
  query: z.string().trim().min(1).max(1500),
  powiat: z.string().trim().min(1).max(60),
  applicantType: z.enum(['JST', 'NGO', 'PES']),
})

export const advisorEmailRequest = z.object({
  email: z.email().max(200),
  name: z.string().trim().max(200).optional(),
  query: z.string().trim().min(1).max(1500),
  markdown: z.string().min(1).max(200_000),
})

export type AdvisorRequest = z.infer<typeof advisorRequest>

export async function parseAdvisorRequest(c: Context) {
  if (!advisorLimiter(ipFromContext(c))) return { error: c.json({ error: 'Too many requests' }, 429) }
  const parsed = advisorRequest.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) return { error: c.json({ error: 'Invalid advisor request' }, 400) }
  return { data: parsed.data }
}

/** Pipes the AI service's SSE stream through untouched; only the key stays on this side. */
export async function realAdvisorStream(c: Context): Promise<Response> {
  const { data, error } = await parseAdvisorRequest(c)
  if (error) return error

  let upstream: Response
  try {
    upstream = await fetch(`${env.AI_URL}/api/agent/stream`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.AI_API_KEY },
      body: JSON.stringify({ query: data.query, powiat: data.powiat, applicant_type: data.applicantType }),
      // Closing the tab aborts the request, which stops the Gemini run upstream too.
      signal: AbortSignal.any([c.req.raw.signal, AbortSignal.timeout(STREAM_TIMEOUT_MS)]),
    })
  } catch (err) {
    console.error('AI advisor unreachable:', err)
    return c.json({ error: 'AI service unavailable' }, 502)
  }
  if (!upstream.ok || !upstream.body) {
    console.error(`AI advisor responded ${upstream.status}: ${await upstream.text().catch(() => '')}`)
    return c.json({ error: 'AI service error' }, 502)
  }

  return new Response(upstream.body, {
    headers: { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache, no-transform', 'x-accel-buffering': 'no' },
  })
}

export async function parseEmailRequest(c: Context) {
  if (!emailLimiter(ipFromContext(c))) return { error: c.json({ error: 'Too many requests' }, 429) }
  const parsed = advisorEmailRequest.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) return { error: c.json({ error: 'Invalid email request' }, 400) }
  return { data: parsed.data }
}

export async function realAdvisorEmail(c: Context): Promise<Response> {
  const { data, error } = await parseEmailRequest(c)
  if (error) return error

  let response: Response
  try {
    response = await fetch(`${env.AI_URL}/api/agent/send-email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.AI_API_KEY },
      body: JSON.stringify({
        recipient_email: data.email,
        recipient_name: data.name ?? '',
        query: data.query,
        markdown_report: data.markdown,
      }),
      signal: AbortSignal.timeout(EMAIL_TIMEOUT_MS),
    })
  } catch (err) {
    console.error('AI email unreachable:', err)
    return c.json({ error: 'AI service unavailable' }, 502)
  }

  const body = (await response.json().catch(() => null)) as { status?: string; mock?: boolean } | null
  if (!response.ok || body?.status !== 'success') {
    console.error(`AI email responded ${response.status}: ${JSON.stringify(body)}`)
    return c.json({ error: 'Email not sent' }, 502)
  }
  // `demo` = the AI service has no SMTP configured and only pretended to send.
  return c.json({ sent: true, demo: Boolean(body.mock) })
}
