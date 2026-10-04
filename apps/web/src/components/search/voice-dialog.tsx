import { useCallback, useEffect, useMemo } from 'react'
import { IconMicrophone, IconX } from '@tabler/icons-react'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useVoiceQuery } from '@/hooks/use-voice-query'

const DIALOG_SELECTOR = '[data-slot="dialog-content"]'

/**
 * Deterministic bar shapes, straight from the design. Equalizer only — the Web Speech
 * API exposes no amplitude, so these animate on a timer rather than off the mic.
 */
const BARS = Array.from({ length: 28 }, (_, i) => ({
  durationMs: (0.8 + ((i * 37) % 9) / 10) * 1000,
  delayMs: (-((i * 53) % 11) / 10) * 1000,
  heightPx: Math.round(56 * [0.55, 0.8, 1, 0.7, 0.9, 0.6][i % 6]!),
}))

interface VoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  confirmLabel: string
  /** Shown to screen readers before anything is said. */
  idleHint: string
  /** Shown to screen readers once there is a draft to confirm. */
  readyHint: string
  /** Receives the confirmed transcript; the dialog closes itself first. */
  onConfirm: (text: string) => void
}

/** The listening overlay from the design: orb, equalizer, live transcript, cancel/confirm. */
export function VoiceDialog({ open, onOpenChange, title, confirmLabel, idleHint, readyHint, onConfirm }: VoiceDialogProps) {
  const voice = useVoiceQuery()
  const { start, reset } = voice

  const changeOpen = useCallback(
    (next: boolean) => {
      onOpenChange(next)
      if (!next) reset()
    },
    [onOpenChange, reset],
  )

  // Start listening only once the dialog is mounted and focused. Starting in the
  // click handler races the permission prompt, which steals focus back to the trigger.
  useEffect(() => {
    if (open) start()
  }, [open, start])

  // Requesting the microphone can hand focus back to the trigger, which sits in the
  // aria-hidden background once we are open — a screen reader would be stranded on an
  // element it cannot reach. Pull focus onto the heading once the engine has settled.
  //
  // A no-op when the dialog already placed focus itself; it only fires when focus has
  // actually escaped. Queried rather than ref'd because this has to work no matter how
  // focus got out, including paths where Base UI's own initialFocus did not win.
  const permissionSettled = voice.status === 'listening' || voice.status === 'error'
  useEffect(() => {
    if (!open || !permissionSettled) return
    if (document.activeElement?.closest(DIALOG_SELECTOR) != null) return
    document.querySelector<HTMLElement>(`${DIALOG_SELECTOR} h2`)?.focus()
  }, [open, permissionSettled])

  function confirm() {
    if (!voice.canSubmit) return
    const text = voice.text
    changeOpen(false)
    onConfirm(text)
  }

  const hint = useMemo(() => {
    if (voice.error !== null) return null
    if (voice.isListening) return 'Słuchamy - mów swobodnie. Zatrzymamy się, gdy skończysz.'
    if (voice.draft.length > 0) return readyHint
    return idleHint
  }, [voice.draft.length, voice.error, voice.isListening, idleHint, readyHint])

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent
        showCloseButton={false}
        className="gap-7 rounded-[2rem] bg-[radial-gradient(120%_70%_at_50%_0%,#F1EDFF_0%,#FFFFFF_55%)] px-6 pt-11 pb-9 text-center shadow-[0_40px_80px_-24px_rgb(15_27_45/0.45),0_0_0_1px_rgb(255_255_255/0.6)_inset] ring-0 sm:max-w-[47.5rem] sm:px-10"
      >
        <DialogClose
          aria-label="Zamknij"
          className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-border focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <IconX aria-hidden="true" className="size-5" />
        </DialogClose>

        <DialogTitle tabIndex={-1} className="text-[2.125rem] leading-10 font-[650] tracking-[-0.03em] outline-none">
          {title}
        </DialogTitle>

        <div aria-hidden="true" className="relative mx-auto flex size-50 items-center justify-center">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{ animationDelay: `${i}s` }}
              className="absolute inset-10 rounded-full border-2 border-[rgb(99_82_230/0.35)] motion-reduce:hidden data-listening:animate-[voice-ring_3s_cubic-bezier(.15,.6,.35,1)_infinite]"
              data-listening={voice.isListening || undefined}
            />
          ))}
          <span
            data-listening={voice.isListening || undefined}
            className="absolute inset-[1.875rem] rounded-full bg-[radial-gradient(circle,rgb(124_92_246/0.45),rgb(124_92_246/0)_70%)] blur-[8px] motion-reduce:animate-none data-listening:animate-[voice-glow_1.6s_ease-in-out_infinite]"
          />
          <span
            data-listening={voice.isListening || undefined}
            className="relative flex size-30 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#A08CFF_0%,#6A4FE0_50%,#3E2A9E_100%)] text-white shadow-[0_18px_40px_-12px_rgb(106_79_224/0.75),inset_0_2px_0_rgb(255_255_255/0.25)] motion-reduce:animate-none data-listening:animate-[voice-orb_1.6s_ease-in-out_infinite]"
          >
            <IconMicrophone aria-hidden="true" className="size-12" />
          </span>
        </div>

        <div aria-hidden="true" className="-mt-2 flex h-14 items-center justify-center gap-[5px]">
          {BARS.map((bar, i) => (
            <span
              key={i}
              style={{
                height: `${bar.heightPx}px`,
                animationDuration: `${bar.durationMs}ms`,
                animationDelay: `${bar.delayMs}ms`,
              }}
              data-listening={voice.isListening || undefined}
              className="block w-[5px] origin-center scale-y-[0.18] rounded-full bg-linear-[180deg,#A08CFF,#6A4FE0] motion-reduce:animate-none! data-listening:animate-[voice-bar_ease-in-out_infinite]"
            />
          ))}
        </div>

        {voice.error !== null ? (
          <p role="alert" className="rounded-[1.25rem] border border-destructive/40 bg-destructive/5 p-5 text-left text-destructive">
            {voice.error}
          </p>
        ) : (
          /* Not a live region: interim results land several times a second and would flood a screen reader. */
          <div className="flex w-full flex-col gap-2 rounded-[1.25rem] border bg-card p-5 text-left sm:px-6">
            <span className="text-[0.8125rem] leading-[1.125rem] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
              Rozpoznany tekst
            </span>
            <p className="min-h-8 text-[1.375rem] leading-8 font-medium">
              {voice.displayText.length === 0 && <span className="text-muted-foreground">Czekamy na Twoje słowa…</span>}
              {voice.isListening ? (
                <>
                  {voice.finalText}
                  {voice.interimText.length > 0 && <span className="text-muted-foreground"> {voice.interimText}</span>}
                </>
              ) : (
                voice.draft
              )}
              {voice.isListening && (
                <span
                  aria-hidden="true"
                  className="ml-[3px] inline-block h-[1.1em] w-0.5 -translate-y-px bg-[#6A4FE0] align-text-bottom animate-[voice-caret_1s_steps(1)_infinite] motion-reduce:animate-none"
                />
              )}
            </p>
          </div>
        )}

        <p role="status" aria-live="polite" className="sr-only">
          {hint}
        </p>

        <div className="flex w-full flex-wrap justify-between gap-3">
          <DialogClose className="inline-flex h-14 items-center justify-center rounded-full bg-secondary px-7 text-base font-semibold text-secondary-foreground hover:bg-border focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring">
            Anuluj
          </DialogClose>
          <button
            type="button"
            onClick={confirm}
            disabled={!voice.canSubmit}
            className="inline-flex h-14 items-center justify-center rounded-full bg-primary px-8 text-base font-semibold text-primary-foreground shadow-[0_6px_14px_-6px_rgb(34_99_173/0.55)] transition-colors hover:bg-primary-hover focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
