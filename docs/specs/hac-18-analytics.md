# HAC-18 — Analityka wyszukiwań (spec for the implementing agent)

Linear: [HAC-18](https://linear.app/hackyeah2026/issue/HAC-18/analityka-wyszukiwan-zapis-wyszukiwan-i-akcji-statystyki-w-panelu) · Branch: `michaldakol/hac-18-analityka-wyszukiwan-zapis-wyszukiwan-i-akcji-statystyki-w` (already created from `main`, contains this spec).

This document holds what the code cannot tell you: the decisions, the reasons, the event catalog, the dashboard design and the working rules of this repo. Read the code for everything else.

## 0. Before you start

1. Read, in this order: `AGENTS.md` (repo rules, **WCAG audit before every UI PR**), `CONTEXT.md` (domain glossary — use these words in code, UI and PR), `docs/adr/0001-*.md`, `docs/adr/0002-analytics-events-in-postgres.md`, `docs/research/analytics-storage.md`, `docs/agents/issue-tracker.md`.
2. Skills to use (installed in `~/.cursor/skills/`): **`implement`** (drives this work), **`tdd`** (pure modules, see §8), **`shadcn`** (every UI component: charts, cards, tabs, toggle group — follow its rules), **`domain-modeling`** (if a new term appears, add it to `CONTEXT.md`), **`writing-for-agents`** (if you touch `AGENTS.md`), **`code-review`** (before the PR), **`diagnosing-bugs`** (if something breaks).
3. Product context: `context/foundation/prd.md` (NFRs: WCAG 2.1 AA, no real personal data, 320 px, results < 5 s).

## 1. Problem

ROPS (the challenge owner) wants to know what residents need: what they search for most, which answers prove useful (they click them), where nothing helps (Luki), how long a Wizyta takes, which needs are most often unmet. Today only Potrzeby (searches that ended without help) are stored; successful searches and resident behaviour leave no trace.

## 2. Solution in one paragraph

The resident app sends anonymous **analytics events** (Wyszukiwanie, shown Wyniki, Użycie Akcji, Wizyta start/end, steps of the no-result flow…) in batches to our Hono API, which validates, masks personal data, rate-limits and stores them in **Postgres** (`analytics_event` + typed `search` + `visit` tables, daily rollups). A new **Statystyki** page in the Panel administratora (`/panel/analytics`) shows KPIs, trends and rankings with polished shadcn charts. A demo seed fills 30 days of realistic fake data.

## 3. Decisions (settled with the user — do not reopen)

| # | Decision |
|---|---|
| D1 | **Storage: Postgres** (Docker locally, Neon in prod). No Influx/ClickHouse. See ADR-0002 + research doc for arguments. |
| D2 | **Events are collected on the front end** (we know what the resident clicks) and sent to **our** API. Never to the AI service. Hono stays a passthrough for search (ADR-0001). |
| D3 | **Record everything useful** (catalog in §5): searches, latency, shown results with tier/position, every Akcja, result expansion, innovation page views and dwell time, catalog use, voice use, no-result flow choices, idea wizard steps/abandonment, Wizyta duration. |
| D4 | **Wizyta** = random UUID in `sessionStorage` (`hubmi:visit`), new on page load if missing, cleared on kiosk reset; sent with every batch. No accounts, no cross-visit tracking, no cookies. |
| D5 | **Potrzeba ↔ Wyszukiwanie**: add nullable `search_id` to `need`; S-03 front passes the current `searchId` into `needs.recordGap`, `needs.requestContact` and `ideas.submit` (`search.searchId`). |
| D6 | **PII masking before storage**: e-mails, phone numbers, PESEL (11 digits), postal-address-like numbers are replaced (`[email]`, `[telefon]`, `[pesel]`) in every stored Zapytanie (also in `need.query`). |
| D7 | **Rate limit** public writes per IP in memory (e.g. 30 requests/min for `/api/events`, 10/min for `needs.*`/`ideas.submit`), 429 on excess. |
| D8 | **Dashboard**: "fajny ekran statystyk, grafy i fancy" — polished, fast, accessible (§7). |
| D9 | Work in Cursor; spec in this file + HAC-18; Matt Pocock skills copied to `~/.cursor/skills`. |

## 4. Data model (Drizzle, `apps/api/src/db/schema.ts`)

Follow the existing schema style (snake_case column names via `text('col_name')`, `timestamps`, `uuid().primaryKey().defaultRandom()`).

```ts
// One anonymous stay. Created lazily on the first event batch of a visitId.
visit: id uuid PK (client-generated), startedAt, lastSeenAt, endedAt?, durationMs?,
       mode ('web' | 'kiosk'), userAgentFamily? ('mobile' | 'tablet' | 'desktop'), entry ('search' | 'catalog' | 'innovation' | 'idea' | 'other')

// One Wyszukiwanie. id is generated client-side at submit time so later events link without a round trip.
search: id uuid PK (client-generated), visitId FK, occurredAt, query (masked), queryNormalized (lowercase, no diacritics, trimmed — for grouping),
        inputMode ('text' | 'voice'), resultCount, solutionCount, relatedCount, noMatch bool, latencyMs, error bool,
        shownResults jsonb [{ id, title, tier, position, category? }]

// Everything else, append-only.
analytics_event: id bigint identity PK, visitId, searchId? FK, type (text, see §5), occurredAt (client time, clamped to server time ± 5 min), receivedAt default now,
                 innovationId?, payload jsonb
  indexes: (type, occurredAt), (searchId), (visitId), BRIN(occurredAt)

// Daily rollups the dashboard reads for long ranges (refresh: on dashboard load if older than 10 min, plus after seeding).
analytics_daily: day date, metric text, key text ('' for totals), value numeric, PK (day, metric, key)

need.searchId: uuid nullable FK → search.id   // D5
```

Push with `pnpm db:push` (drizzle-kit 1.0 RC may ask `--hints` for create/rename — answer "create").

## 5. Event catalog

Client sends `{ visitId, events: Event[] }`. Every event: `{ type, at (ISO), searchId?, innovationId?, ...payload }`. Validate with a zod discriminated union on `type`; unknown types → 400.

| type | when (where in code) | payload |
|---|---|---|
| `visit_started` | first batch of a visit (`lib/analytics.ts`) | `mode`, `entry`, `screen` ('mobile'/'tablet'/'desktop') |
| `visit_heartbeat` | every 30 s while visible | — (updates `visit.lastSeenAt`) |
| `visit_ended` | `pagehide` / kiosk reset | `durationMs` |
| `search_submitted` | submit in `routes/index.tsx` (text) and `components/search/voice-button.tsx` (voice) | `searchId`, `query`, `inputMode` → **creates the `search` row** |
| `results_shown` | when `$ai.useQuery` resolves (`routes/index.tsx`) | `searchId`, `latencyMs`, `noMatch`, `results[{id,title,tier,position,category}]`, `error?` → **completes the `search` row** |
| `result_expanded` | "Więcej" toggle in `components/search/result-card.tsx` | `searchId`, `innovationId`, `position` |
| `action_used` | every Akcja in `result-card.tsx` / `video-dialog.tsx` / innovation page | `searchId?`, `innovationId`, `action` ('read_more' \| 'video' \| 'pdf' \| 'download' \| 'phone' \| 'source' \| 'innovation_page'), `position?` |
| `innovation_viewed` | `routes/innowacja.$id.tsx` mount | `innovationId`, `from` ('search' \| 'catalog' \| 'direct'), `searchId?` |
| `innovation_left` | unmount / pagehide | `innovationId`, `dwellMs` |
| `catalog_filtered` | category change in `components/catalog/knowledge-base.tsx` | `category` |
| `no_result_option` | choice on the no-result screen (`features/no-result/*`) | `searchId`, `option` ('idea' \| 'contact' \| 'retry') |
| `idea_step` | each step of `features/idea/idea-wizard.tsx` | `step`, `stepCount`, `searchId?` |
| `idea_abandoned` | wizard left before submit | `lastStep` |
| `voice_used` | voice button start/result/error | `outcome` ('started' \| 'recognized' \| 'error' \| 'unsupported') |
| `text_size_changed` | `components/layout/text-size.tsx` | `size` — accessibility signal for ROPS |

Server-derived (no client event needed): Potrzeba created (from `need` rows with `search_id`).

**Definition of "znaleziona pomoc" (helpful search)**: a Wyszukiwanie with ≥ 1 `action_used` and no Potrzeba. **Unmet need**: Wyszukiwanie with `noMatch` or ending in a Potrzeba.

## 6. Server (apps/api)

- New module `src/analytics/`:
  - `mask.ts` — `maskPii(text)` (pure, TDD it).
  - `normalize.ts` — `normalizeQuery(text)` for grouping (lowercase, strip diacritics, collapse spaces; pure, TDD).
  - `ingest.ts` — zod schema for the batch, `ingest(batch, ip)` → upserts `visit`, inserts/updates `search`, inserts `analytics_event`; caps batch at 50 events and payload size at 32 KB.
  - `rate-limit.ts` — tiny in-memory sliding window per IP (Hono middleware), reused for `needs.*` and `ideas.submit` (tRPC middleware or Hono route guard).
  - `queries.ts` — dashboard aggregates (SQL via Drizzle `sql` where needed), all taking `{ from, to }`.
  - `rollup.ts` — `refreshDailyRollups(from, to)`.
  - `router.ts` — `panel.analytics.*` on **`panelProcedure`** (dashboard data is staff-only): `overview`, `searchesOverTime`, `topQueries`, `topGaps`, `topInnovations`, `actionsBreakdown`, `funnel`, `hourHeatmap`, `categories`, `voiceAndAccessibility`.
- Route **`POST /api/events`** in `src/index.ts` (plain Hono, not tRPC, because `navigator.sendBeacon` sends `text/plain` without custom headers): parse JSON from text, validate, rate-limit, `ingest`, reply `204`. Use the client IP from `x-forwarded-for` (Render proxy), like `auth.ts` does.
- Extend `needs/router.ts` + `ideas/router.ts` inputs with optional `searchId` and store it (D5); mask `query` there too (D6).
- Seed `src/db/seed-analytics.ts` (called from `seed.ts`, skip if events exist): 30 days, ~2–4 k searches with realistic Polish queries (reuse/extend the lists in `seed-needs.ts`), real Innowacja ids/titles from the catalog fixtures (`src/ai/fixtures.ts`) so top-innovation charts look real, daily/weekly rhythm (more on weekdays 9–15), ~25 % noMatch, ~55 % with an Akcja, some voice, some kiosk. **Fictional data only** — no real personal data.

## 7. Dashboard `/panel/analytics` ("Statystyki")

Add **Statystyki** to the panel top bar (`features/panel/panel-header.tsx`) and the panel start page. Use shadcn **`chart`** (Recharts) — install with the shadcn skill/CLI (`pnpm dlx shadcn@latest add chart card tabs toggle-group tooltip`), icons from `@tabler/icons-react` (project icon library), colors only from theme tokens (`--chart-1..5`, `--primary`, `--success`, `--destructive`; define nice `--chart-*` values in `index.css` if they are grey — they currently are; keep AA contrast against the card background).

Layout (desktop 2–3 columns, single column below `md`, no horizontal scroll at 320 px):

1. **Header**: title "Statystyki", range toggle **7 dni / 30 dni / 90 dni** (`ToggleGroup`, value in the URL `?range=30`), "Ostatnia aktualizacja: …".
2. **KPI cards** (each with value, delta vs previous period ▲▼ coloured, tiny sparkline):
   Wyszukiwania · Wizyty · **Znaleziona pomoc** (% helpful searches) · **Brak odpowiedzi** (% noMatch) · Potrzeby z wyszukiwań · Średni czas Wizyty · Mediana czasu odpowiedzi wyszukiwarki (NFR: < 5 s, colour red if above).
3. **Wyszukiwania w czasie** — stacked area/bar per day: helpful / no action / Brak odpowiedzi / ended as Potrzeba.
4. **Lejek** — Wyszukiwanie → Wyniki pokazane → Użycie Akcji → (alternatively) Potrzeba: horizontal funnel bars with %.
5. **Najczęstsze Zapytania** (table: Zapytanie, liczba, % z pomocą, trend) and **Najczęstsze Luki** (Zapytania with noMatch/Potrzeba, link to `/panel/needs?q=…`).
6. **Najskuteczniejsze Innowacje** — table/bar: shown count, Użycia Akcji, CTR (actions / shown), link to `/panel/innovations/$id`; and **Innowacje bez kliknięć** (shown often, never used — content to improve).
7. **Akcje** — donut/bar: read_more / video / pdf / download / phone / source.
8. **Kategorie** — bar of searches/clicks per Kategoria (category names from data).
9. **Kiedy szukają** — heatmap day-of-week × hour (CSS grid of cells with tooltip; accessible table fallback).
10. **Kanały i dostępność** — web vs kiosk, tekst vs głos, voice errors, text-size changes.

Accessibility (WCAG 2.1 AA, mandatory — `AGENTS.md`): every chart has a visible title, an `aria-describedby` text summary of the key number, and a "Pokaż jako tabelę" disclosure with the same data in a `<table>`; never colour alone (labels/patterns + legend); keyboard-reachable tooltips or the table; respect `prefers-reduced-motion` for chart animations; status region announces loading; 320 px and 200 % zoom.

Performance: one tRPC batch per range change; queries read `analytics_daily` for ranges > 7 days; target < 1 s on the seed data; skeletons while loading.

## 8. Testing (tdd skill)

No test runner exists yet. Add **vitest to `apps/api` only** and TDD the pure seams: `maskPii`, `normalizeQuery`, batch zod schema (valid/invalid events), rollup math on in-memory rows if you extract it. UI is verified in the browser (manual + WCAG audit). Run `pnpm typecheck` and `pnpm lint` (oxlint) regularly.

## 9. Acceptance criteria (paste into the PR)

- [ ] Every Wyszukiwanie is stored with masked Zapytanie, input mode, latency, shown Wyniki (tier, position) and its Wizyta.
- [ ] Every Użycie Akcji, result expansion, innovation view/dwell, catalog filter, voice use, no-result choice and idea wizard step is stored and linked to its Wyszukiwanie where one exists.
- [ ] Potrzeby created from a search carry `search_id`.
- [ ] `/api/events` validates, masks, rate-limits (429) and never blocks the UI (beacon, fire-and-forget).
- [ ] `/panel/analytics` shows all sections of §7 for 7/30/90 days, < 1 s on seed data; data only for a logged-in Pracownik ROPS (401 otherwise).
- [ ] Seed gives 30 days of believable fictional data.
- [ ] WCAG audit per `AGENTS.md` listed in the PR; 320 px and 200 % OK.
- [ ] `CONTEXT.md` terms used (Wyszukiwanie, Wizyta, Użycie Akcji, Luka, Potrzeba, Innowacja, Akcja).

## 10. Repo working rules (learned the hard way)

- **Commits/PRs: never add Claude/AI attribution** (no `Co-Authored-By`, no "Generated with" footer). Git author is the user.
- Branch is already created; commit small steps. PR with `gh pr create`, title `feat(HAC-18): …`, body in Polish like PR #7/#13 (what, how to check, WCAG audit, risks). **Ask the user before merging.** Squash-merge with an explicit `--body` (so no trailers leak).
- Linear (MCP, team `Hackyeah2026`): move HAC-18 to **In Progress** when you start, **Done** + summary comment after merge. Integration GitHub↔Linear is not installed — add the PR link to the issue manually.
- Before the PR: merge latest `main` (teammates push often); if `apps/web/src/routeTree.gen.ts` conflicts, take `main`'s and regenerate it (`vite build` or run dev).
- Don't modify teammates' resident-side design beyond adding `track()` calls; keep those calls one-liners.
- Shell: the user runs the project in **WSL with `pnpm`** (`pnpm install && pnpm db:push && pnpm db:seed && pnpm dev`). On the Windows side `pnpm` isn't on PATH — use `corepack pnpm`.
- Env: `AI_*` values are trimmed in `env.ts`; empty `AI_URL` = mocked AI search (good for local work).
- Testing against the **live AI collection** (Innowacje): delete only ids you created, never by title search (we lost data that way once).
- UI: shadcn components only (Base UI flavour; `render` prop, not `asChild`), tabler icons, semantic color tokens, `gap-*` not `space-*`, toasts via `features/panel/notify.ts`, lists via `components/data-table.tsx` + `components/list-pagination.tsx`, panel layout via `routes/panel/_authed.tsx`.
