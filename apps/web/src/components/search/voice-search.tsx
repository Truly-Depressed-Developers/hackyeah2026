import { useState } from 'react'
import { VoiceButton } from '@/components/search/voice-button'
import { VoiceDialog } from '@/components/search/voice-dialog'
import { track } from '@/lib/analytics'
import { probeVoiceSupport } from '@/lib/speech-recognition'

interface VoiceSearchProps {
  /** Hand the confirmed transcript to the same place the typed form sends its query. */
  onSearch: (query: string) => void
}

const support = probeVoiceSupport()

/** Mic button plus the listening overlay. The browser transcribes; only text reaches us. */
export function VoiceSearch({ onSearch }: VoiceSearchProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <VoiceButton
        onClick={() => {
          track({ type: 'voice_used', outcome: support.usable ? 'started' : 'unsupported' })
          setOpen(true)
        }}
        unavailable={!support.usable}
        unavailableHint={unavailableHint(support.secureContext)}
      />
      <VoiceDialog
        open={open}
        onOpenChange={setOpen}
        title="Powiedz, z czym masz kłopot"
        confirmLabel="Szukaj"
        idleHint="Naciśnij mikrofon i powiedz, czego potrzebujesz."
        readyHint="Sprawdź, czy dobrze zrozumieliśmy, i naciśnij „Szukaj”."
        onConfirm={(query) => {
          track({ type: 'voice_used', outcome: 'recognized' })
          onSearch(query)
        }}
      />
    </>
  )
}

export function unavailableHint(secureContext: boolean) {
  return secureContext
    ? 'Ta przeglądarka nie rozpoznaje mowy - wpisz tekst na klawiaturze.'
    : 'Rozpoznawanie mowy wymaga połączenia HTTPS.'
}
