import { IconMicrophone } from '@tabler/icons-react'

// Shown per the design; voice input is S-04 (HAC-10), so the button is aria-disabled until then.
export function VoiceButton() {
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
        aria-label="Powiedz, zamiast pisać — wkrótce"
        aria-disabled="true"
        title="Wyszukiwanie głosem — wkrótce"
        className="absolute inset-0 flex animate-[mic-breathe_2.8s_ease-in-out_infinite] items-center justify-center rounded-full border border-primary/30 bg-[radial-gradient(circle_at_50%_30%,#FFFFFF,var(--primary-soft))] text-primary shadow-[0_6px_16px_-8px_rgb(34_99_173/0.45),inset_0_1px_0_#FFFFFF] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring motion-reduce:animate-none"
      >
        <IconMicrophone aria-hidden="true" className="size-6" />
      </button>
    </div>
  )
}
