---
project: Pomost
created: 2026-10-03
source: hackathon-template repo + team decisions (no tech-stack-selector run)
---

# Tech stack — Pomost

Status legend: **present** = already in the template repo; **planned** = decided, not yet built; **open** = undecided.

## Repo & tooling (present)

- Monorepo: pnpm workspaces + Turborepo; Node ≥ 24; TypeScript; oxlint.
- `apps/api` and `apps/web`.

## Backend (present)

- Hono on Node, tRPC router exposed to the web app; zod validation.
- Drizzle ORM + drizzle-kit (`db:push`, limited to public schema).
- External "decide" service client generated from OpenAPI (`DECIDE_URL`, `DECIDE_MODE=mock` by default).

## Frontend (present)

- React 19 + Vite, TanStack Router + TanStack Query via tRPC client.
- Tailwind v4, shadcn / Base UI components, lucide icons, Geist font.
- PWA plugin configured (relevant for the tablet kiosk mode).

## Database (present + planned)

- Postgres 18 locally (docker-compose), Neon in deployment.
- **planned:** pgvector + Postgres full-text search (Polish) for hybrid search; single `search_doc` index table across content kinds.
- **planned:** shared tag taxonomy (area, target group, innovation type, stage, TERYT location).

## Deployment (present)

- Render web service (Docker, free plan), auto-deploy on commit to `main`, health check `/health`.

## AI & voice (open)

- LLM provider for query understanding, ranking and "why it matches": **open**.
- Embedding model: **open**.
- Speech-to-text and text-to-speech in Polish on the kiosk tablet: **open** — must be verified on the target device (browser-native vs server-side).

## Data ingestion (planned)

- Scraping Biblioteka Innowacji Społecznych (personal contact data stripped on import).
- Obserwator Statystyk Społecznych via CSV import.
- Selected reports / Mapa Wyzwań as PDF chunks.
- Fictional helpers (experts / NGOs) — no real personal data.

## Team

- 2 fullstack, 1 AI dev, 3 product (presentation / design / PRD).
