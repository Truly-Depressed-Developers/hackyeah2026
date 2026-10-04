// Web Speech API — the browser owns transcription, so audio never reaches our backend.
// Note it may still leave the device: Chrome relays it to Google's recognition service
// (hence no offline support), while on-device engines keep it local.
// lib.dom (TS 7) ships the event and result types but not the SpeechRecognition
// controller itself, so we declare only the missing piece.

interface SpeechRecognitionEventMap {
  start: Event
  end: Event
  result: SpeechRecognitionEvent
  error: SpeechRecognitionErrorEvent
  nomatch: SpeechRecognitionEvent
}

export interface SpeechRecognitionLike extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  addEventListener<K extends keyof SpeechRecognitionEventMap>(
    type: K,
    listener: (event: SpeechRecognitionEventMap[K]) => void,
    options?: AddEventListenerOptions | boolean,
  ): void
  removeEventListener<K extends keyof SpeechRecognitionEventMap>(
    type: K,
    listener: (event: SpeechRecognitionEventMap[K]) => void,
    options?: EventListenerOptions | boolean,
  ): void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

interface SpeechWindow {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}

/** Chrome and Safari still ship this prefixed; Firefox ships nothing. */
export function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  const candidate = window as unknown as SpeechWindow
  return candidate.SpeechRecognition ?? candidate.webkitSpeechRecognition ?? null
}

export interface VoiceSupport {
  /** Browser exposes a SpeechRecognition constructor. */
  recognition: boolean
  /** HTTPS or localhost — the API refuses to start outside a secure context. */
  secureContext: boolean
  /** getUserMedia exists, so there is a microphone pipeline at all. */
  microphone: boolean
  /** All of the above — safe to offer the voice toggle. */
  usable: boolean
}

/**
 * Probe the running device. Rendered on the /voice route so the kiosk tablet can
 * answer PRD open question 5 ("czy rozpoznawanie mowy po polsku działa na
 * docelowym tablecie") without a debugger attached.
 */
export function probeVoiceSupport(): VoiceSupport {
  if (typeof window === 'undefined') {
    return { recognition: false, secureContext: false, microphone: false, usable: false }
  }

  const recognition = getSpeechRecognition() !== null
  const secureContext = window.isSecureContext
  const microphone = typeof navigator.mediaDevices?.getUserMedia === 'function'

  return {
    recognition,
    secureContext,
    microphone,
    usable: recognition && secureContext,
  }
}

/** Returns an i18n key (`voice.error.*`); the screen showing the error translates it. */
export function describeSpeechError(code: SpeechRecognitionErrorCode): string {
  return code in SPEECH_ERROR_CODES ? `voice.error.${code}` : 'voice.error.unknown'
}

const SPEECH_ERROR_CODES: Record<SpeechRecognitionErrorCode, true> = {
  'aborted': true,
  'audio-capture': true,
  'language-not-supported': true,
  'network': true,
  'no-speech': true,
  'not-allowed': true,
  'phrases-not-supported': true,
  'service-not-allowed': true,
}

/** Errors that will not fix themselves — never auto-restart after one of these. */
export function isFatalSpeechError(code: SpeechRecognitionErrorCode): boolean {
  return (
    code === 'not-allowed' ||
    code === 'service-not-allowed' ||
    code === 'audio-capture' ||
    code === 'language-not-supported'
  )
}

/** Dictation arrives lowercase and loosely spaced; tidy it before it leaves the client. */
export function normalizeTranscript(raw: string): string {
  const collapsed = raw.replaceAll(/\s+/g, ' ').trim()
  if (collapsed.length === 0) return ''
  return collapsed[0]!.toUpperCase() + collapsed.slice(1)
}
