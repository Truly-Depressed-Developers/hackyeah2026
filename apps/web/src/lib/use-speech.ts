import { useEffect, useState } from 'react'

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

export function useSpeech(text: string) {
  const [speaking, setSpeaking] = useState(false)

  useEffect(() => () => {
    if (supported) window.speechSynthesis.cancel()
  }, [])

  function toggle() {
    if (!supported) return
    const synth = window.speechSynthesis
    if (speaking) {
      synth.cancel()
      setSpeaking(false)
      return
    }
    synth.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'pl-PL'
    utterance.voice = synth.getVoices().find((voice) => voice.lang.startsWith('pl')) ?? null
    utterance.addEventListener('end', () => setSpeaking(false))
    utterance.addEventListener('error', () => setSpeaking(false))
    synth.speak(utterance)
    setSpeaking(true)
  }

  return { supported, speaking, toggle }
}
