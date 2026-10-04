import type { Context } from 'hono'
import { streamSSE } from 'hono/streaming'
import { parseAdvisorRequest, parseEmailRequest, type AdvisorRequest } from './advisor.js'

// Same event names and payload shapes as the AI service's /api/agent/stream (captured 2026-10-04).
// Trigger words: "błąd" → error event mid-run, "nie pasuje" → no grant match.
export async function mockAdvisorStream(c: Context): Promise<Response> {
  const { data, error } = await parseAdvisorRequest(c)
  if (error) return error
  const q = data.query.toLowerCase()
  const matched = !q.includes('nie pasuje')

  return streamSSE(c, async (stream) => {
    let n = 0
    const send = async (event: string, stepId: string | null, payload: object, delayMs = 0) => {
      if (delayMs) await stream.sleep(delayMs)
      n += 1
      await stream.writeSSE({ id: `evt_${n}`, event, data: JSON.stringify({ id: `evt_${n}`, step_id: stepId, type: event, payload }) })
    }

    await send('agent_start', null, { query: data.query, powiat: data.powiat, applicant_type: data.applicantType })

    await send('step_start', 'step_parse', { phase_index: 0 }, 300)
    await send('thought', 'step_parse', { delta: `Analizuję zgłoszenie. Wnioskodawca: ${data.applicantType}, obszar: ${data.powiat}.` }, 500)
    await send('step_complete', 'step_parse', { summary: 'Założenia przetworzone' }, 400)

    await send('step_start', 'step_diagnosis', { phase_index: 1 }, 300)
    for (const citation of CITATIONS) await send('source_citation', 'step_diagnosis', citation, 350)
    if (q.includes('błąd')) {
      await send('error', 'step_diagnosis', { message: 'Mock AI failure' }, 500)
      return
    }
    await send('step_complete', 'step_diagnosis', { matches_count: CITATIONS.length }, 400)

    await send('step_start', 'step_innovation', { phase_index: 2 }, 300)
    await send('tool_result', 'step_innovation', { top_match: INNOVATION, category: 'Innowacje dla seniorów', summary: `Dopasowano model: ${INNOVATION}` }, 900)
    await send('step_complete', 'step_innovation', { top_match: INNOVATION }, 300)

    await send('step_start', 'step_grant_check', { phase_index: 3 }, 300)
    await send(
      'thought',
      'step_grant_check',
      { delta: matched ? 'Projekt kwalifikuje się do naboru Usługa Wrażliwa II.' : 'Projekt nie pasuje do profilu naboru Usługa Wrażliwa II.' },
      700,
    )
    await send('rating_matrix', 'step_grant_check', { scorecard: scorecard(matched), grant_match: grantMatch(matched) }, 300)
    await send('step_complete', 'step_grant_check', { is_active_grant_matched: matched, grant_title: 'Usługa Wrażliwa - II Nabór' }, 300)

    await send('step_start', 'step_synthesis', { phase_index: 4 }, 300)
    for (const delta of chunks(report(data, matched), 60)) await send('final_markdown_delta', 'step_synthesis', { delta }, 25)
    await send('step_complete', 'step_synthesis', {}, 200)

    await send(
      'agent_complete',
      null,
      {
        final_status: 'success',
        is_grant_matched: matched,
        active_grant_matched: matched ? 'Usługa Wrażliwa - II Nabór' : null,
        max_grant_amount_pln: matched ? 600000 : 0,
        co_financing_rate: matched ? 100 : 0,
        rating_matrix: scorecard(matched),
      },
      200,
    )
  })
}

export async function mockAdvisorEmail(c: Context): Promise<Response> {
  const { error } = await parseEmailRequest(c)
  if (error) return error
  await new Promise((resolve) => setTimeout(resolve, 1200))
  return c.json({ sent: true, demo: true })
}

const INNOVATION = 'Organizator kompleksowej opieki w miejscu zamieszkania'

const CITATIONS = [
  {
    report_name: 'Opiekunowie rodzinni osób starszych – problemy, potrzeby, wyzwania dla polityki społecznej',
    year: 2015,
    page_number: 20,
    relevance_score: 0.703,
  },
  { report_name: 'Wyzwania i potrzeby sektora opiekuńczego w Małopolsce', year: 2024, page_number: 42, relevance_score: 0.688 },
]

function scorecard(matched: boolean) {
  return {
    eas: 24.6,
    eas_max: 35,
    uvi: 24.0,
    uvi_max: 25,
    tnb: 19.5,
    tnb_max: 20,
    ifs: 10.0,
    ifs_max: 10,
    gep: matched ? 10.0 : 0,
    gep_max: 10,
    is_grant_matched: matched,
    total_wtd: matched ? 88.1 : 78.1,
    total_max: 100,
    grade: matched ? 'Klasa A (Wysoki potencjał w naborze Usługa Wrażliwa II)' : 'Klasa B (Potencjał merytoryczny)',
  }
}

function grantMatch(matched: boolean) {
  return {
    matched,
    best_distance: matched ? 0.22 : 0.58,
    similarity_pct: matched ? 78.0 : 42.0,
    matched_model_name: matched ? `Model 3: ${INNOVATION}` : null,
    threshold: 0.46,
  }
}

function report({ query, powiat, applicantType }: AdvisorRequest, matched: boolean) {
  return `# Dossier aplikacyjne (dane przykładowe)

**Projekt:** ${query}
**Obszar realizacji:** ${powiat}
**Wnioskodawca:** ${applicantType}

## 1. Diagnoza potrzeb

Raporty ROPS wskazują na rosnącą liczbę niesamodzielnych seniorów i przeciążenie opiekunów rodzinnych, zwłaszcza poza miastami.

## 2. Proponowane rozwiązanie

Wdrożenie modelu „${INNOVATION}”: koordynator w ciągu 24 godzin od wypisu ze szpitala organizuje opiekę w domu i plan wsparcia dla rodziny.

## 3. Działania

- Zatrudnienie i przeszkolenie 2 koordynatorów
- Usługi wytchnieniowe dla opiekunów - do 20 godzin miesięcznie
- Współpraca z OPS i szpitalem powiatowym

## 4. Budżet

| Filar | Kwota | Udział |
| :--- | ---: | ---: |
| Działania merytoryczne | 480 000 zł | 80% |
| Zarządzanie i koordynacja | 100 000 zł | 16,7% |
| Promocja i dostępność | 20 000 zł | 3,3% |

## 5. Finansowanie

${matched ? 'Pomysł spełnia warunki naboru **Usługa Wrażliwa - II nabór** (do 600 000 zł, 100% dofinansowania).' : 'Pomysł nie pasuje do bieżącego naboru. Warto sprawdzić programy FEM 2021-2027 i konkursy ministerialne.'}
`
}

function chunks(text: string, size: number) {
  const out: string[] = []
  for (let i = 0; i < text.length; i += size) out.push(text.slice(i, i + size))
  return out
}
