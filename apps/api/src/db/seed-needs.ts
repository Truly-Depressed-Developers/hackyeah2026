import { count } from 'drizzle-orm'
import { db } from './index.js'
import { idea, need, type IdeaAnswer, type ShownResult } from './schema.js'

// Fictional Potrzeby and Pomysły so the Panel administratora has data before the S-03 forms exist.
// No real personal data: contacts use example.com and the 600 000 0xx range.

const queries = [
  'mama sama nie daje rady z opieką nad tatą po udarze',
  'nie mam z kim zostawić dziecka po szkole',
  'samotny sąsiad 80+ nie wychodzi z domu',
  'syn ma problem z hazardem w internecie',
  'jak pomóc nastolatce z depresją',
  'brak transportu do lekarza na wsi',
  'babcia nie radzi sobie z lekami',
  'szukam pracy po 50 a nikt nie odpisuje',
  'dziecko z autyzmem nie ma terapii w okolicy',
  'nie stać mnie na opał na zimę',
  'tata z demencją wychodzi w nocy z domu',
  'jak wrócić do pracy po długiej chorobie',
  'sąsiedzi hałasują a ja opiekuję się chorą żoną',
  'wnuk całe dnie gra i nie chodzi do szkoły',
  'nie umiem załatwić spraw w urzędzie przez internet',
]

const shown: ShownResult[] = [
  { id: 'dla-seniorow__organizator-kompleksowej-opieki-w-miejscu-zamieszkania', title: 'Organizator kompleksowej opieki w miejscu zamieszkania', tier: 'solution' },
  { id: 'dla-zdrowia-i-medycyny__inteligentny-organizer-do-lekow', title: 'Inteligentny organizer do leków', tier: 'related' },
  { id: 'dla-seniorow__bawita', title: 'BaWita', tier: 'related' },
]

const ideas: { title: string; answers: IdeaAnswer[] }[] = [
  {
    title: 'Sąsiedzka zmiana opieki',
    answers: [
      { question: 'Jaki problem rozwiązuje Twój pomysł?', answer: 'Opiekunowie osób starszych nie mają chwili wytchnienia.' },
      { question: 'Na czym polega rozwiązanie?', answer: 'Sąsiedzi z bloku zapisują się na dyżury po 2 godziny tygodniowo.' },
      { question: 'Kto mógłby pomóc we wdrożeniu?', answer: 'Spółdzielnia mieszkaniowa i parafia.' },
    ],
  },
  {
    title: 'Bus do przychodni raz w tygodniu',
    answers: [
      { question: 'Jaki problem rozwiązuje Twój pomysł?', answer: 'Starsi mieszkańcy wsi nie mają jak dojechać do lekarza.' },
      { question: 'Na czym polega rozwiązanie?', answer: 'Gminny bus kursuje we wtorki rano między sołectwami a przychodnią.' },
    ],
  },
  {
    title: 'Świetlica w szkole do 18:00',
    answers: [
      { question: 'Jaki problem rozwiązuje Twój pomysł?', answer: 'Rodzice pracujący na zmiany nie mają z kim zostawić dzieci.' },
      { question: 'Na czym polega rozwiązanie?', answer: 'Dłuższe godziny świetlicy prowadzone przez wolontariuszy i studentów.' },
      { question: 'Kto mógłby pomóc we wdrożeniu?', answer: 'Rada rodziców i lokalny uniwersytet.' },
    ],
  },
]

const kinds = ['gap', 'gap', 'contact_request', 'idea'] as const
const statuses = ['new', 'new', 'new', 'in_progress', 'done'] as const

const contactFor = (i: number) => (i % 2 === 0 ? `mieszkaniec${i}@example.com` : `600 000 ${String(i).padStart(3, '0')}`)

export async function seedNeeds(total = 60) {
  const [existing] = await db.select({ n: count() }).from(need)
  if ((existing?.n ?? 0) > 0) {
    console.log('Potrzeby already seeded, skipping.')
    return
  }

  const now = Date.now()
  const rows = Array.from({ length: total }, (_, i) => {
    const kind = kinds[i % kinds.length]!
    // Every third non-gap Potrzeba comes from a search that did show Wyniki ("Nic tu nie pasuje?").
    const sawResults = kind !== 'gap' && i % 3 === 0
    const createdAt = new Date(now - i * 47 * 60 * 1000)
    const isContactRequest = kind === 'contact_request'
    return {
      kind,
      status: statuses[i % statuses.length]!,
      query: queries[i % queries.length]!,
      noMatch: !sawResults,
      shownResults: sawResults ? shown : [],
      contact: isContactRequest ? contactFor(i) : null,
      consentAt: isContactRequest ? createdAt : null,
      createdAt,
      updatedAt: createdAt,
    }
  })
  const inserted = await db.insert(need).values(rows).returning({ id: need.id, kind: need.kind, createdAt: need.createdAt })

  // A Pomysł for every Potrzeba of kind 'idea', plus a few proposed without a search.
  const fromNeeds = inserted
    .filter((row) => row.kind === 'idea')
    .map((row, i) => ({ needId: row.id as string | null, createdAt: row.createdAt, i }))
  const standalone = [0, 1, 2].map((i) => ({ needId: null, createdAt: new Date(now - (i * 5 + 2) * 60 * 60 * 1000), i: i + 100 }))
  const ideaRows = [...fromNeeds, ...standalone].map(({ needId, createdAt, i }) => ({
    needId,
    status: statuses[i % statuses.length]!,
    ...ideas[i % ideas.length]!,
    contact: contactFor(i + 1),
    consentAt: createdAt,
    createdAt,
    updatedAt: createdAt,
  }))
  await db.insert(idea).values(ideaRows)
  console.log(`Created ${rows.length} fictional Potrzeby and ${ideaRows.length} Pomysły.`)
}
