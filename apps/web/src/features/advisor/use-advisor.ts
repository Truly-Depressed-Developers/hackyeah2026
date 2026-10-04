import { useCallback, useEffect, useReducer, useRef } from 'react'
import { countLabel } from '@/lib/plural'
import {
  AdvisorHttpError,
  STEP_IDS,
  runAdvisor,
  type AdvisorEvent,
  type AdvisorInput,
  type Citation,
  type GrantMatch,
  type Scorecard,
  type StepId,
} from './advisor-stream'

export interface AdvisorState {
  status: 'idle' | 'running' | 'done' | 'error'
  error?: 'rate-limit' | 'failed'
  active?: StepId
  completed: StepId[]
  log: string[]
  citations: Citation[]
  innovation?: string
  scorecard?: Scorecard
  grantMatch?: GrantMatch
  grantTitle?: string
  maxFundingPln?: number
  coFinancingPct?: number
  markdown: string
}

const FRAGMENT_FORMS = { one: 'pasujący fragment', few: 'pasujące fragmenty', many: 'pasujących fragmentów' }

const INITIAL: AdvisorState = { status: 'idle', completed: [], log: [], citations: [], markdown: '' }

type Action = { type: 'start' } | { type: 'reset' } | { type: 'event'; event: AdvisorEvent } | { type: 'end' } | { type: 'fail'; error: 'rate-limit' | 'failed' }

function reducer(state: AdvisorState, action: Action): AdvisorState {
  switch (action.type) {
    case 'start':
      return { ...INITIAL, status: 'running', active: STEP_IDS[0] }
    case 'reset':
      return INITIAL
    case 'fail':
      return state.status === 'running' ? { ...state, status: 'error', error: action.error } : state
    case 'end':
      // A stream that closes without agent_complete still counts if the report arrived.
      if (state.status !== 'running') return state
      return state.markdown ? { ...state, status: 'done', active: undefined, completed: [...STEP_IDS] } : { ...state, status: 'error', error: 'failed' }
    case 'event':
      return state.status === 'running' ? apply(state, action.event) : state
  }
}

function apply(state: AdvisorState, event: AdvisorEvent): AdvisorState {
  switch (event.type) {
    case 'step_start':
      return { ...state, active: event.stepId }
    case 'step_complete': {
      const completed = state.completed.includes(event.stepId) ? state.completed : [...state.completed, event.stepId]
      const extra =
        event.stepId === 'step_diagnosis' && state.citations[0]
          ? `Znaleziono ${countLabel(state.citations.length, FRAGMENT_FORMS)} w raportach, m.in. „${state.citations[0].report_name}”.`
          : undefined
      return {
        ...state,
        completed,
        grantTitle: event.payload.grant_title ?? state.grantTitle,
        log: extra ? [...state.log, extra] : state.log,
      }
    }
    case 'thought':
      return event.text ? { ...state, log: [...state.log, event.text] } : state
    case 'source_citation':
      return { ...state, citations: [...state.citations, event.citation] }
    case 'tool_result':
      return {
        ...state,
        innovation: event.payload.top_match ?? state.innovation,
        log: event.payload.top_match ? [...state.log, `Najbliższy model: „${event.payload.top_match}”.`] : state.log,
      }
    case 'rating_matrix':
      return { ...state, scorecard: event.scorecard, grantMatch: event.grantMatch ?? state.grantMatch }
    case 'final_markdown_delta':
      return { ...state, markdown: state.markdown + event.delta }
    case 'agent_complete':
      return {
        ...state,
        status: 'done',
        active: undefined,
        completed: [...STEP_IDS],
        grantTitle: event.payload.active_grant_matched ?? state.grantTitle,
        maxFundingPln: event.payload.max_grant_amount_pln,
        coFinancingPct: event.payload.co_financing_rate,
      }
    case 'error':
      return { ...state, status: 'error', error: 'failed' }
  }
}

export function useAdvisor() {
  const [state, dispatch] = useReducer(reducer, INITIAL)
  const controller = useRef<AbortController | null>(null)

  const cancel = useCallback(() => {
    controller.current?.abort()
    controller.current = null
  }, [])

  const start = useCallback(
    (input: AdvisorInput) => {
      cancel()
      const current = new AbortController()
      controller.current = current
      dispatch({ type: 'start' })
      runAdvisor(input, current.signal, (event) => dispatch({ type: 'event', event }))
        .then(() => {
          if (!current.signal.aborted) dispatch({ type: 'end' })
        })
        .catch((err: unknown) => {
          if (current.signal.aborted) return
          console.error('Advisor failed:', err)
          dispatch({ type: 'fail', error: err instanceof AdvisorHttpError && err.status === 429 ? 'rate-limit' : 'failed' })
        })
    },
    [cancel],
  )

  const reset = useCallback(() => {
    cancel()
    dispatch({ type: 'reset' })
  }, [cancel])

  useEffect(() => cancel, [cancel])

  return { state, start, cancel: reset, reset }
}
