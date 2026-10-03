import { delay, http, HttpResponse } from 'msw'
import type { Result, SearchResponse } from '@/lib/ai/client'

// Demo stand-in for the Python AI service. Typical data until F-01 and the design land.
// Trigger words: "nic" → Brak odpowiedzi, "pokrewne" → only Rozwiązania pokrewne, "błąd" → HTTP 500.

const BIBLIOTEKA = { label: 'Biblioteka Innowacji Społecznych', url: 'https://example.org/biblioteka' }
const OBSERWATOR = { label: 'Obserwator Statystyk Społecznych', url: 'https://example.org/obserwator' }

const solutions: Result[] = [
  {
    id: 'inn-opieka-wytchnieniowa',
    kind: 'innovation',
    title: 'Opieka wytchnieniowa w domu',
    summary: 'Opiekun z gminy przejmuje opiekę nad osobą zależną na kilka godzin w tygodniu, aby rodzina mogła odpocząć.',
    why: 'Dotyczy odciążenia rodziny, która sama opiekuje się bliskim wymagającym stałej pomocy.',
    source: BIBLIOTEKA,
  },
  {
    id: 'helper-fundacja-opiekunow',
    kind: 'helper',
    title: 'Fundacja Wsparcia Opiekunów (dane fikcyjne)',
    summary: 'Doradztwo dla opiekunów rodzinnych: formalności, dofinansowania, grupy wsparcia.',
    why: 'Pomaga opiekunom rodzinnym w organizacji opieki i uzyskaniu wsparcia finansowego.',
    source: { label: 'Baza helperów HubMI' },
  },
  {
    id: 'inn-asystent-seniora',
    kind: 'innovation',
    title: 'Asystent seniora po hospitalizacji',
    summary: 'Asystent odwiedza seniora po wyjściu ze szpitala i pomaga w codziennych czynnościach i rehabilitacji.',
    why: 'Odpowiada na sytuację osoby wracającej do domu po pobycie w szpitalu.',
    source: BIBLIOTEKA,
  },
]

const related: Result[] = [
  {
    id: 'inn-grupa-wsparcia',
    kind: 'innovation',
    title: 'Grupy wsparcia dla opiekunów rodzinnych',
    summary: 'Cykliczne spotkania opiekunów prowadzone przez psychologa w centrum usług społecznych.',
    why: 'Wspiera samopoczucie opiekuna, choć nie przejmuje samej opieki.',
    source: BIBLIOTEKA,
  },
  {
    id: 'fact-opiekunowie-malopolska',
    kind: 'fact',
    title: 'Opiekunowie osób zależnych w Małopolsce',
    summary: 'Wskaźnik: liczba osób korzystających z usług opiekuńczych na 10 tys. mieszkańców, wg powiatów.',
    why: 'Pokazuje skalę potrzeb opiekuńczych w regionie.',
    source: OBSERWATOR,
  },
]

export const handlers = [
  http.post('/ai/search', async ({ request }) => {
    const { query } = (await request.json()) as { query: string }
    const q = query.toLowerCase()
    await delay(1500)

    if (q.includes('błąd')) return new HttpResponse(null, { status: 500 })

    const body: SearchResponse = q.includes('nic')
      ? { solutions: [], related: [], noMatch: true }
      : q.includes('pokrewne')
        ? { solutions: [], related, noMatch: false }
        : { solutions, related, noMatch: false }
    return HttpResponse.json(body)
  }),
]
