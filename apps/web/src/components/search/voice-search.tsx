import { useState } from 'react'
import { VoiceButton } from '@/components/search/voice-button'
import { VoiceDialog } from '@/components/search/voice-dialog'
import { track } from '@/lib/analytics'
import { probeVoiceSupport } from '@/lib/speech-recognition'
import { useT } from '@/lib/i18n'

interface VoiceSearchProps {
  /** Hand the confirmed transcript to the same place the typed form sends its query. */
  onSearch: (query: string) => void
}

const support = probeVoiceSupport()

/** Mic button plus the listening overlay. The browser transcribes; only text reaches us. */
export function VoiceSearch({ onSearch }: VoiceSearchProps) {
  const t = useT()
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
        title={t('voice.searchTitle')}
        confirmLabel={t('start.search')}
        idleHint={t('voice.searchIdle')}
        readyHint={t('voice.searchReady')}
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
    ? 'voice.unsupported'
    : 'voice.needsHttps'
}
