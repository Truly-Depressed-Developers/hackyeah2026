// Client for POST /ai/advisor: Hono passes the AI service's SSE stream through, so these
// are the AI service's own event shapes (captured 2026-10-04). Only the fields we show are typed.

export type ApplicantType = 'JST' | 'NGO' | 'PES'

export interface AdvisorInput {
  query: string
  powiat: string
  applicantType: ApplicantType
}

export const STEP_IDS = ['step_parse', 'step_diagnosis', 'step_innovation', 'step_grant_check', 'step_synthesis'] as const
export type StepId = (typeof STEP_IDS)[number]

export interface Scorecard {
  eas: number
  eas_max: number
  uvi: number
  uvi_max: number
  tnb: number
  tnb_max: number
  ifs: number
  ifs_max: number
  gep: number
  gep_max: number
  is_grant_matched: boolean
  total_wtd: number
  total_max: number
  grade: string
}

export interface GrantMatch {
  matched: boolean
  similarity_pct: number
  threshold: number
  matched_model_name?: string | null
}

export interface Citation {
  report_name: string
  year?: number
  page_number?: number
  relevance_score?: number
}

export type AdvisorEvent =
  | { type: 'step_start'; stepId: StepId }
  | { type: 'step_complete'; stepId: StepId; payload: { summary?: string; grant_title?: string; top_match?: string } }
  | { type: 'thought'; text: string }
  | { type: 'source_citation'; citation: Citation }
  | { type: 'tool_result'; payload: { top_match?: string; summary?: string } }
  | { type: 'rating_matrix'; scorecard: Scorecard; grantMatch?: GrantMatch }
  | { type: 'final_markdown_delta'; delta: string }
  | { type: 'agent_complete'; payload: { is_grant_matched?: boolean; active_grant_matched?: string | null; max_grant_amount_pln?: number; co_financing_rate?: number } }
  | { type: 'error'; message: string }

export class AdvisorHttpError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`Advisor request failed with ${status}`)
    this.status = status
  }
}

export async function runAdvisor(input: AdvisorInput, signal: AbortSignal, onEvent: (event: AdvisorEvent) => void) {
  const response = await fetch('/ai/advisor', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
    signal,
  })
  if (!response.ok || !response.body) throw new AdvisorHttpError(response.status)

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += value.replaceAll('\r\n', '\n')
    const blocks = buffer.split('\n\n')
    buffer = blocks.pop() ?? ''
    for (const block of blocks) {
      const event = parseBlock(block)
      if (event) onEvent(event)
    }
  }
}

function parseBlock(block: string): AdvisorEvent | undefined {
  let name = 'message'
  const data: string[] = []
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) name = line.slice(6).trim()
    else if (line.startsWith('data:')) data.push(line.slice(5).trimStart())
  }
  if (data.length === 0) return undefined

  let envelope: { step_id?: string | null; payload?: Record<string, unknown> }
  try {
    envelope = JSON.parse(data.join('\n'))
  } catch {
    return undefined
  }
  const payload = (envelope.payload ?? envelope) as Record<string, never>
  const stepId = STEP_IDS.find((id) => id === envelope.step_id)

  switch (name) {
    case 'step_start':
      return stepId && { type: name, stepId }
    case 'step_complete':
      return stepId && { type: name, stepId, payload }
    case 'thought':
      return { type: name, text: String(payload.delta ?? payload.thought ?? '') }
    case 'source_citation':
      return { type: name, citation: payload as unknown as Citation }
    case 'tool_result':
      return { type: name, payload }
    case 'rating_matrix':
      return { type: name, scorecard: payload.scorecard ?? payload, grantMatch: payload.grant_match }
    case 'final_markdown_delta':
      return { type: name, delta: String(payload.delta ?? '') }
    case 'agent_complete':
      return { type: name, payload }
    case 'error':
      return { type: name, message: String(payload.message ?? '') }
    default:
      return undefined
  }
}

export async function sendAdvisorEmail(body: { email: string; name?: string; query: string; markdown: string }) {
  const response = await fetch('/ai/advisor/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new AdvisorHttpError(response.status)
  return (await response.json()) as { sent: boolean; demo: boolean }
}
