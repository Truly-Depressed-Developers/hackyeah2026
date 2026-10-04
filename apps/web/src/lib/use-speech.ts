import { useEffect, useState } from 'react'

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

export function useSpeech(text: string) {
  const [speaking, setSpeaking] = useState(false)
  const [paused, setPaused] = useState(false)

  useEffect(() => () => {
    if (supported) window.speechSynthesis.cancel()
  }, [])

  function stop() {
    if (!supported) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
    setPaused(false)
  }

  function speak() {
    if (!supported) return
    const synth = window.speechSynthesis
    synth.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'pl-PL'
    utterance.voice = synth.getVoices().find((voice) => voice.lang.startsWith('pl')) ?? null
    utterance.addEventListener('end', () => {
      setSpeaking(false)
      setPaused(false)
    })
    utterance.addEventListener('error', () => {
      setSpeaking(false)
      setPaused(false)
    })
    synth.speak(utterance)
    setSpeaking(true)
    setPaused(false)
  }

  /** Czytaj albo przerwij — jeden przycisk, tak jak używa tego strona innowacji. */
  function toggle() {
    if (speaking) stop()
    else speak()
  }

  /**
   * Pauza i wznowienie dla kiosku, gdzie odczyt ma osobne sterowanie play/pause + stop.
   *
   * `speechSynthesis.pause()` bywa zawodne w niektórych wydaniach WebKita — jeśli na
   * docelowym iPadzie stan nie trzyma, zdegraduj przycisk pauzy do zatrzymania.
   */
  function pause() {
    if (!supported || !speaking) return
    window.speechSynthesis.pause()
    setPaused(true)
  }

  function resume() {
    if (!supported || !speaking) return
    window.speechSynthesis.resume()
    setPaused(false)
  }

  return { supported, speaking, paused, toggle, speak, pause, resume, stop }
}
