---
name: voice-input
description: >
  Wire HubMI's voice mode into a screen. Covers which hook to call, how the
  transcript reaches the search, and the device traps that break dictation in a
  public kiosk. Trigger phrases: "dodaj tryb głosowy", "podłącz mikrofon",
  "voice input", "mieszkaniec mówi", "wyszukiwanie głosem", "S-04", "HAC-10",
  "FR-002". Use when building ANY screen where a resident speaks instead of
  typing — the search box, the kiosk start screen, or the idea form (FR-007).
  The dictation logic already exists; this skill is about consuming it, NOT about
  writing new speech code. Do NOT use for read-aloud / TTS (that is S-05, FR-006)
  — see the last section for why that is a different API.
---

# Voice input in HubMI

Dictation is **done**. Two modules in `apps/web/src` hold it:

| Module | What it is | Do you touch it? |
| --- | --- | --- |
| `lib/speech-recognition.ts` | Browser API wrapper, device probe, Polish error copy | No |
| `hooks/use-voice-input.ts` | The state machine: live transcript, timers, restarts | No |
| `hooks/use-voice-query.ts` | Dictation + an editable draft the resident can correct | **Call this** |

Speech is transcribed **by the browser**. There is no STT provider, no API key, no
audio upload. What comes out is a plain string.

## Pick your hook

**Building a search surface?** → `useVoiceQuery`. It owns the draft so you only
write markup. The transcript reaches the results the same way typing does: the
start page drives search off the `?q=` URL param, so navigate with it.

```tsx
const voice = useVoiceQuery()
const navigate = Route.useNavigate()

// …mic button
<button type="button" aria-pressed={voice.isListening} onClick={voice.toggle}>

// …live transcript, settled vs. still-being-revised
<p>
  {voice.finalText}
  <span className="opacity-60 italic"> {voice.interimText}</span>
</p>

// …confirm, then search exactly as the typed form does
<button
  type="button"
  disabled={!voice.canSubmit}
  onClick={() => navigate({ search: { q: voice.text }, replace: true })}
>
```

Keep `replace: true`: a shared kiosk must not leave the previous resident's query
in history.

**Feeding a field you already own** (idea form FR-007, react-hook-form)? →
`useVoiceInput`, the layer below. It never holds a draft; it hands you a string.

```tsx
const voice = useVoiceInput({
  onResult: (result) => form.setValue('description', result.text),
})
```

## What the hooks give you

`useVoiceQuery` → `status` · `support` · `isListening` · `error` · `finalText` ·
`interimText` · `displayText` · `draft` · `setDraft` · `start` · `stop` · `toggle` ·
`reset` · `canSubmit` · `text`

`useVoiceInput` → same minus the draft half, plus `cancel` and `text`
(final + interim in one string). Options: `lang`, `silenceTimeoutMs`,
`maxDurationMs`, `onResult` — the last one also carries `confidence` and
`durationMs` if a screen ever needs to log them.

`error` is already a resident-facing Polish sentence. Render it; don't translate
error codes yourself.

## Traps that will bite you

**Never claim the audio stays on the device.** Chrome relays it to Google's
recognition service — that is why voice mode needs a connection. Accurate wording:
*„Mowę rozpoznaje Twoja przeglądarka — do nas trafia sam tekst."*

**Handle `status === 'unsupported'` or the kiosk dead-ends.** Firefox ships no
`SpeechRecognition`, and an Android WebView without Google services may not either.
Always leave the typing path visible. `support.secureContext` tells the two failure
causes apart (no engine vs. page served over plain HTTP) — word the message to match.

**HTTPS is mandatory.** `localhost` counts; a tablet on `http://192.168.x.x:5173`
does not and will get no microphone.

**Don't rebuild the state machine.** Chrome ends a session on every pause despite
`continuous = true`, so the hook restarts it (capped at 10). It also auto-stops after
2.5 s of silence and hard-stops at 60 s because the kiosk is unattended. Reimplementing
this in a component reintroduces bugs that are already fixed.

**Don't add an STT provider.** If a tablet test proves browser recognition unusable,
the fallback is ElevenLabs Scribe v2 behind a Hono proxy — never a key in the bundle.
That swap replaces `use-voice-input.ts` only; consumers stay untouched. Raise it with
the team first; it is a scope change, not a bug fix.

**Accessibility is a PRD guardrail** (WCAG 2.1 AA). Keep `aria-pressed` on the mic
toggle, an `aria-live="polite"` status line, and `role="alert"` on errors. Do not make
the live transcript itself a live region — it updates several times per second and
floods a screen reader.

## Checking a real device

Call `probeVoiceSupport()` from `lib/speech-recognition.ts`; it reports engine, secure
context and microphone separately. PRD open question 5 ("czy rozpoznawanie mowy po
polsku działa na docelowym tablecie") is still open — whoever runs it on the tablet
should write the answer into `context/foundation/roadmap.md`.

## Not this skill: read-aloud (S-05)

Speaking results back is `SpeechSynthesis`, a different half of the Web Speech API —
fully typed in `lib.dom`, no wrapper needed, and supported where `SpeechRecognition`
is not. Per FR-006 it must be **on demand only, never automatic**, because the kiosk
stands in a public place.
