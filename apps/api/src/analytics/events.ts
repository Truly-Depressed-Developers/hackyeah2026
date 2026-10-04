import { z } from 'zod'

// The analytics event catalog (docs/specs/hac-18-analytics.md §5). The resident app sends these in batches.

export const MAX_BATCH_EVENTS = 50
const CLOCK_SKEW_MS = 5 * 60_000

export const ACTIONS = ['read_more', 'video', 'pdf', 'download', 'phone', 'source', 'innovation_page', 'sms'] as const
export const VISIT_MODES = ['web', 'kiosk'] as const
export const SCREENS = ['mobile', 'tablet', 'desktop'] as const
export const ENTRIES = ['search', 'catalog', 'innovation', 'idea', 'other'] as const

const id = z.string().min(1).max(500)
const position = z.number().int().min(1).max(100)
const base = { at: z.iso.datetime() }

export const shownResultSchema = z.object({
  id,
  title: z.string().min(1).max(500),
  tier: z.enum(['solution', 'related']),
  position,
  category: z.string().max(200).optional(),
})

export const eventSchema = z.discriminatedUnion('type', [
  z.object({ ...base, type: z.literal('visit_started'), mode: z.enum(VISIT_MODES), entry: z.enum(ENTRIES), screen: z.enum(SCREENS) }),
  z.object({ ...base, type: z.literal('visit_heartbeat') }),
  z.object({ ...base, type: z.literal('visit_ended'), durationMs: z.number().int().min(0).max(86_400_000) }),
  z.object({
    ...base,
    type: z.literal('search_submitted'),
    searchId: z.uuid(),
    query: z.string().trim().min(1).max(2000),
    inputMode: z.enum(['text', 'voice']),
  }),
  z.object({
    ...base,
    type: z.literal('results_shown'),
    searchId: z.uuid(),
    latencyMs: z.number().int().min(0).max(600_000),
    noMatch: z.boolean(),
    results: z.array(shownResultSchema).max(50),
    error: z.boolean().optional(),
  }),
  z.object({ ...base, type: z.literal('result_expanded'), searchId: z.uuid(), innovationId: id, position }),
  z.object({
    ...base,
    type: z.literal('action_used'),
    searchId: z.uuid().optional(),
    innovationId: id,
    action: z.enum(ACTIONS),
    position: position.optional(),
  }),
  z.object({
    ...base,
    type: z.literal('innovation_viewed'),
    innovationId: id,
    from: z.enum(['search', 'catalog', 'direct']),
    searchId: z.uuid().optional(),
  }),
  z.object({ ...base, type: z.literal('innovation_left'), innovationId: id, dwellMs: z.number().int().min(0).max(86_400_000) }),
  z.object({ ...base, type: z.literal('catalog_filtered'), category: z.string().min(1).max(200) }),
  z.object({ ...base, type: z.literal('no_result_option'), searchId: z.uuid(), option: z.enum(['idea', 'contact', 'retry']) }),
  z.object({
    ...base,
    type: z.literal('idea_step'),
    step: z.number().int().min(1).max(20),
    stepCount: z.number().int().min(1).max(20),
    searchId: z.uuid().optional(),
  }),
  z.object({ ...base, type: z.literal('idea_abandoned'), lastStep: z.number().int().min(1).max(20) }),
  z.object({ ...base, type: z.literal('voice_used'), outcome: z.enum(['started', 'recognized', 'error', 'unsupported']) }),
  z.object({ ...base, type: z.literal('text_size_changed'), size: z.enum(['small', 'normal', 'large']) }),
])

export const batchSchema = z.object({
  visitId: z.uuid(),
  events: z.array(eventSchema).min(1).max(MAX_BATCH_EVENTS),
})

export type AnalyticsEvent = z.infer<typeof eventSchema>
export type EventType = AnalyticsEvent['type']
export type Batch = z.infer<typeof batchSchema>

export const parseBatch = (input: unknown) => batchSchema.safeParse(input)

/** Client clocks drift; keep event times within five minutes of the server's. */
export function clampTime(at: string, now: Date): Date {
  const time = new Date(at).getTime()
  const min = now.getTime() - CLOCK_SKEW_MS
  const max = now.getTime() + CLOCK_SKEW_MS
  return new Date(Math.min(max, Math.max(min, time)))
}
