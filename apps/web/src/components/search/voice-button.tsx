import { IconMicrophone } from '@tabler/icons-react'
import { useT } from '@/lib/i18n'

interface VoiceButtonProps {
  onClick: () => void
  /** No speech engine on this device — keep the button visible but inert, per the design. */
  unavailable?: boolean
  /** Why it is inert, as a tooltip (an i18n key or plain text). */
  unavailableHint?: string
  /** Accessible name (an i18n key or plain text); defaults to the search wording. */
  label?: string
}

export function VoiceButton({ onClick, unavailable = false, unavailableHint, label }: VoiceButtonProps) {
  const t = useT()
  const name = label ? t.dynamic(label, label) : t('voice.buttonLabel')
  const hint = unavailableHint && t.dynamic(unavailableHint, unavailableHint)
  return (
    <div className="relative size-14 shrink-0">
      {[0, 0.93, 1.86].map((delay) => (
        <span
          key={delay}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 animate-[mic-wave_2.8s_cubic-bezier(.15,.6,.35,1)_infinite] rounded-full border-2 border-primary/45 motion-reduce:hidden"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
      <button
        type="button"
        aria-label={name}
        aria-disabled={unavailable || undefined}
        title={unavailable ? hint : undefined}
        onClick={unavailable ? undefined : onClick}
        className="absolute inset-0 flex animate-[mic-breathe_2.8s_ease-in-out_infinite] items-center justify-center rounded-full border border-primary/30 bg-[radial-gradient(circle_at_50%_30%,#FFFFFF,var(--primary-soft))] text-primary shadow-[0_6px_16px_-8px_rgb(34_99_173/0.45),inset_0_1px_0_#FFFFFF] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring aria-disabled:opacity-60 motion-reduce:animate-none"
      >
        <IconMicrophone aria-hidden="true" className="size-6" />
      </button>
    </div>
  )
}
