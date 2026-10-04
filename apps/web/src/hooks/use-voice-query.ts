import { useCallback, useState } from 'react'
import { useVoiceInput, type VoiceResult, type VoiceStatus } from '@/hooks/use-voice-input'
import type { VoiceSupport } from '@/lib/speech-recognition'

/** Below this the query is noise, not a problem description. */
const MIN_QUERY_LENGTH = 3

export const DEFAULT_VOICE_LANG = 'pl-PL'

export interface UseVoiceQueryOptions {
  lang?: string
  silenceTimeoutMs?: number
  maxDurationMs?: number
  /** Fires when dictation settles, before the resident has confirmed anything. */
  onDictated?: (result: VoiceResult) => void
}

export interface UseVoiceQuery {
  status: VoiceStatus
  support: VoiceSupport
  isListening: boolean
  /** Null when nothing is wrong. Already a resident-facing Polish sentence. */
  error: string | null
  /** Settled part of the live transcript. Pair with `interimText` to style the two apart. */
  finalText: string
  /** Words the engine is still revising - render these muted. */
  interimText: string
  /** The whole thing in one string: live transcript while listening, draft otherwise. */
  displayText: string
  /** The editable value. Bind to an input/textarea together with `setDraft`. */
  draft: string
  setDraft: (value: string) => void
  start: () => void
  stop: () => void
  /** Start or stop, whichever applies - wire to a single mic button. */
  toggle: () => void
  /** Drop the transcript and the draft. */
  reset: () => void
  canSubmit: boolean
  /** The trimmed query to search for. Empty until `canSubmit`. */
  text: string
}

/**
 * Everything a search surface needs: dictation, plus an editable draft the resident
 * can correct before searching. Headless - bring your own markup.
 *
 * Feeding voice into a field you already own? Use the lower-level `useVoiceInput`
 * and write `result.text` into your own state instead.
 */
export function useVoiceQuery(options: UseVoiceQueryOptions = {}): UseVoiceQuery {
  const lang = options.lang ?? DEFAULT_VOICE_LANG
  const [draft, setDraft] = useState('')

  const { onDictated } = options
  const handleResult = useCallback(
    (result: VoiceResult) => {
      setDraft(result.text)
      onDictated?.(result)
    },
    [onDictated],
  )

  const voice = useVoiceInput({
    lang,
    silenceTimeoutMs: options.silenceTimeoutMs,
    maxDurationMs: options.maxDurationMs,
    onResult: handleResult,
  })

  const { cancel } = voice
  const reset = useCallback(() => {
    cancel()
    setDraft('')
  }, [cancel])

  const trimmed = draft.trim()
  const canSubmit = trimmed.length >= MIN_QUERY_LENGTH && !voice.isListening

  return {
    status: voice.status,
    support: voice.support,
    isListening: voice.isListening,
    error: voice.error,
    finalText: voice.finalText,
    interimText: voice.interimText,
    displayText: voice.isListening ? voice.text : draft,
    draft,
    setDraft,
    start: voice.start,
    stop: voice.stop,
    toggle: voice.toggle,
    reset,
    canSubmit,
    text: canSubmit ? trimmed : '',
  }
}
