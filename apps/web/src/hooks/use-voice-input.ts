import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  describeSpeechError,
  getSpeechRecognition,
  isFatalSpeechError,
  normalizeTranscript,
  probeVoiceSupport,
  type SpeechRecognitionLike,
  type VoiceSupport,
} from '@/lib/speech-recognition'

export type VoiceStatus = 'unsupported' | 'idle' | 'listening' | 'error'

export interface VoiceResult {
  /** Normalized transcript — this is the string the API receives. */
  text: string
  lang: string
  /** Mean confidence over the final segments, or null when the engine reports none. */
  confidence: number | null
  durationMs: number
}

export interface UseVoiceInputOptions {
  lang?: string
  /** Stop on its own after this long without new speech. */
  silenceTimeoutMs?: number
  /** Hard cap, so an unattended kiosk never listens forever. */
  maxDurationMs?: number
  onResult?: (result: VoiceResult) => void
}

const DEFAULT_LANG = 'pl-PL'
const DEFAULT_SILENCE_TIMEOUT_MS = 2500
const DEFAULT_MAX_DURATION_MS = 60_000
/** Chrome ends a session on every pause; cap the restarts so a broken engine cannot spin. */
const MAX_RESTARTS = 10

/**
 * Dictation through the browser's own speech engine. Audio stays on the device —
 * nothing is uploaded — and the caller gets a plain string to send to the API.
 */
export function useVoiceInput(options: UseVoiceInputOptions = {}) {
  const support: VoiceSupport = useMemo(() => probeVoiceSupport(), [])

  const [status, setStatus] = useState<VoiceStatus>(support.usable ? 'idle' : 'unsupported')
  const [finalText, setFinalText] = useState('')
  const [interimText, setInterimText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const optionsRef = useRef(options)
  useEffect(() => {
    optionsRef.current = options
  })

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const listenersRef = useRef<AbortController | null>(null)
  const wantsListeningRef = useRef(false)
  const finalRef = useRef('')
  const interimRef = useRef('')
  const confidencesRef = useRef<number[]>([])
  const startedAtRef = useRef(0)
  const restartsRef = useRef(0)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = useCallback(() => {
    if (silenceTimerRef.current !== null) clearTimeout(silenceTimerRef.current)
    if (maxTimerRef.current !== null) clearTimeout(maxTimerRef.current)
    silenceTimerRef.current = null
    maxTimerRef.current = null
  }, [])

  const teardown = useCallback(() => {
    clearTimers()
    listenersRef.current?.abort()
    listenersRef.current = null
    const recognition = recognitionRef.current
    recognitionRef.current = null
    recognition?.abort()
  }, [clearTimers])

  /** End the session cleanly and hand the transcript to the caller. */
  const finish = useCallback(() => {
    wantsListeningRef.current = false
    teardown()

    const text = normalizeTranscript(`${finalRef.current} ${interimRef.current}`)
    const scores = confidencesRef.current.filter((score) => score > 0)
    const durationMs = startedAtRef.current === 0 ? 0 : Math.round(performance.now() - startedAtRef.current)

    setFinalText(text)
    setInterimText('')
    interimRef.current = ''
    setStatus((current) => (current === 'error' ? current : 'idle'))

    if (text.length === 0) return
    optionsRef.current.onResult?.({
      text,
      lang: optionsRef.current.lang ?? DEFAULT_LANG,
      confidence: scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null,
      durationMs,
    })
  }, [teardown])

  const stop = useCallback(() => {
    if (!wantsListeningRef.current) return
    wantsListeningRef.current = false
    clearTimers()
    // Let the engine flush its last interim result; `onend` calls finish().
    recognitionRef.current?.stop()
  }, [clearTimers])

  const armSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current !== null) clearTimeout(silenceTimerRef.current)
    const timeout = optionsRef.current.silenceTimeoutMs ?? DEFAULT_SILENCE_TIMEOUT_MS
    silenceTimerRef.current = setTimeout(stop, timeout)
  }, [stop])

  const start = useCallback(() => {
    const Recognition = getSpeechRecognition()
    if (Recognition === null || !support.usable) {
      setStatus('unsupported')
      return
    }
    if (wantsListeningRef.current) return

    teardown()
    finalRef.current = ''
    interimRef.current = ''
    confidencesRef.current = []
    restartsRef.current = 0
    startedAtRef.current = performance.now()
    wantsListeningRef.current = true

    setFinalText('')
    setInterimText('')
    setError(null)
    setStatus('listening')

    const recognition = new Recognition()
    recognition.lang = optionsRef.current.lang ?? DEFAULT_LANG
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    const listeners = new AbortController()
    listenersRef.current = listeners
    const { signal } = listeners

    recognition.addEventListener('result', (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]!
        const alternative = result[0]!
        if (result.isFinal) {
          finalRef.current = `${finalRef.current} ${alternative.transcript}`.trim()
          confidencesRef.current.push(alternative.confidence)
        } else {
          interim = `${interim} ${alternative.transcript}`.trim()
        }
      }
      interimRef.current = interim
      setFinalText(normalizeTranscript(finalRef.current))
      setInterimText(interim)
      armSilenceTimer()
    }, { signal })

    recognition.addEventListener('error', (event) => {
      if (event.error === 'aborted') return // we caused it
      if (event.error === 'no-speech' && finalRef.current.length > 0) return // already have text

      if (isFatalSpeechError(event.error) || event.error === 'no-speech') {
        wantsListeningRef.current = false
        setError(describeSpeechError(event.error))
        setStatus('error')
      }
      // Non-fatal (e.g. 'network'): the 'end' handler decides whether to retry.
    }, { signal })

    recognition.addEventListener('end', () => {
      if (!wantsListeningRef.current) {
        finish()
        return
      }
      // Chrome ends the session on every longer pause — resume until the user stops us.
      restartsRef.current += 1
      if (restartsRef.current > MAX_RESTARTS) {
        finish()
        return
      }
      try {
        recognition.start()
      } catch {
        finish()
      }
    }, { signal })

    try {
      recognition.start()
    } catch {
      wantsListeningRef.current = false
      setError('voice.error.startFailed')
      setStatus('error')
      return
    }

    recognitionRef.current = recognition
    armSilenceTimer()
    maxTimerRef.current = setTimeout(stop, optionsRef.current.maxDurationMs ?? DEFAULT_MAX_DURATION_MS)
  }, [armSilenceTimer, finish, stop, support.usable, teardown])

  /** Drop the session and the transcript without emitting a result. */
  const cancel = useCallback(() => {
    wantsListeningRef.current = false
    teardown()
    finalRef.current = ''
    interimRef.current = ''
    confidencesRef.current = []
    setFinalText('')
    setInterimText('')
    setError(null)
    setStatus(support.usable ? 'idle' : 'unsupported')
  }, [support.usable, teardown])

  const isListening = status === 'listening'

  const toggle = useCallback(() => {
    if (isListening) stop()
    else start()
  }, [isListening, start, stop])

  useEffect(() => teardown, [teardown])

  return {
    status,
    support,
    isListening,
    /** Settled transcript. */
    finalText,
    /** Words the engine is still revising — render them muted. */
    interimText,
    /** What to show on screen while dictating. */
    text: normalizeTranscript(`${finalText} ${interimText}`),
    error,
    start,
    stop,
    /** Start or stop, whichever applies — wire this to a single mic button. */
    toggle,
    cancel,
  }
}
