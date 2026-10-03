# Hackathon template

pnpm + Turborepo monorepo:

- `apps/web`: Vite + React + TanStack Router (file-based) + TanStack Query + shadcn/ui (Tailwind v4)
- `apps/api`: Hono on Node + tRPC + Drizzle ORM 1.0 RC (Postgres)
- Postgres runs in Docker; both apps run natively via `pnpm dev`.
- TypeScript 7 (native `tsgo` compiler) for type-checking, oxlint for linting.

## Day one

Prerequisites:

- **Node 24.21.0**: pinned in `.tool-versions` (asdf: `asdf install`) and `.nvmrc` (nvm: `nvm install && nvm use`).
- **pnpm**: run `corepack enable` once (ships with Node 24). The exact version is pinned in
  `package.json` (`packageManager`), so everyone runs the same pnpm.
- **Docker** (Docker Desktop on macOS/Windows).

```sh
cp .env.example .env
pnpm install
docker compose up -d
pnpm db:push
pnpm dev
```

Open http://localhost:5173, describe a problem and click **Szukaj**. With `VITE_MOCK_SEARCH=true` the
results come from the in-browser mock. The API runs on http://localhost:3000; Vite proxies `/trpc` and `/ai` to it.
Stop with `Ctrl+C`, then `docker compose down` (add `-v` to also wipe the database).

> Port 5432 or 3000 already taken? Change `DB_PORT` (and the port in `DATABASE_URL`) or `API_PORT` in `.env`.
> `.env` is read by both apps, drizzle-kit and docker compose. `VITE_MOCK_SEARCH=true` fakes the AI service.

## Scripts (repo root)

| Script            | What it does                                                    |
| ----------------- | --------------------------------------------------------------- |
| `pnpm dev`        | `turbo dev`: web (Vite) + api (`tsx watch`)                      |
| `pnpm build`      | Build both apps                                                 |
| `pnpm typecheck`  | Type-check both apps                                            |
| `pnpm lint`       | Lint the whole repo with oxlint (`pnpm lint:fix` to autofix)    |
| `pnpm db:push`    | Push the Drizzle schema (`apps/api/src/db/schema.ts`) to the DB  |
| `pnpm db:studio`  | Open Drizzle Studio                                             |
| `pnpm gen:ai`     | Generate AI-service types (`-- --remote` for `${AI_URL}/openapi.json`) |

## Layout

```
apps/api/src
  env.ts            reads the root .env
  db/schema.ts      Drizzle tables
  router.ts         tRPC router; exports AppRouter
  index.ts          Hono server, mounts tRPC at /trpc and forwards /ai/* to AI_URL
apps/web/src
  lib/trpc.ts       tRPC client + QueryClient
  lib/ai/           AI-service client: generated schema.d.ts + TanStack Query hooks ($ai)
  mocks/            MSW fake of the AI service (VITE_MOCK_SEARCH)
  routes/           file-based routes (routeTree.gen.ts is generated; commit it)
  components/ui/    shadcn components (add more: cd apps/web && pnpm dlx shadcn@latest add <name>)
```

End-to-end types: the web app imports `AppRouter` as a type from `api/router`. Change a procedure's
return type in `apps/api` and `pnpm typecheck` fails in `apps/web`.

## Deploy (Render + Neon, free)

Production is a single service: the API also serves the built web app, so there is one URL and no CORS.
`Dockerfile` builds both apps; `render.yaml` describes the Render service.

1. **Database (Neon)**: create a free project at https://neon.com and copy its connection string.
   Create the tables from your machine:
   ```sh
   DATABASE_URL='postgres://...neon.tech/neondb?sslmode=verify-full' pnpm db:push
   ```
   Use `sslmode=verify-full` instead of `require` (avoids a pg warning; same for Render).
   Re-run this after every schema change (env vars take precedence over `.env`).
2. **App (Render)**: in the Render dashboard choose **New → Blueprint**, connect GitHub and pick this repo.
   An org owner has to approve the Render GitHub app for the organization.
   When asked, set `DATABASE_URL` to the Neon string (and `AI_URL` once the AI service is deployed).
3. Every push to `main` redeploys. Health check: `/health`.

Free-tier caveats: the service sleeps after 15 min without traffic and takes about a minute to wake up,
so open the URL a few minutes before a demo. Neon's free plan is 0.5 GB and never expires.

To test the production image locally:
```sh
docker build -t hackyeah2026 .
docker run --rm -p 10000:10000 -e PORT=10000 \
  -e DATABASE_URL=postgres://app:app@host.docker.internal:5432/app hackyeah2026
```

## Notes

- **npm registry**: `pnpm-workspace.yaml` pins the public npm registry, so a machine-wide custom
  registry in `~/.npmrc` doesn't affect installs. pnpm's own version download still reads `~/.npmrc`;
  if that fails, run `npm_config_registry=https://registry.npmjs.org/ pnpm install` once.
- **TypeScript 7** has no classic JS compiler API, which `openapi-typescript` (`pnpm gen:ai`)
  needs. `.pnpmfile.cjs` gives that one package a private TypeScript 6; everything else uses TS 7.
- **Drizzle 1.0 is a release candidate** (what the Drizzle docs currently recommend). If it gives you
  trouble, `pnpm --filter api add drizzle-orm@latest && pnpm --filter api add -D drizzle-kit@latest` goes back to 0.x;
  the schema and queries here work on both.

## Windows (WSL2)

- Clone the repo **inside the WSL filesystem** (e.g. `~/code/...`), not under `/mnt/c/...`. Installs and file
  watching are much faster there, and it avoids line-ending and permission issues.
- Install Docker Desktop on Windows and enable **Settings → Resources → WSL integration** for your distro, so
  `docker compose` works from the WSL shell.
- Run Node/pnpm inside WSL (install Node with asdf or nvm inside WSL), not the Windows versions.
- Open `http://localhost:5173` from the Windows browser as usual; WSL2 forwards localhost.
- `.gitattributes` forces LF line endings, so the same files work on both OSes.

## Connecting the AI service

HubMI has two backends: this Hono API (Postgres, tRPC) and a Python/FastAPI AI service. The web app
calls the AI service through generated TanStack Query hooks (`$ai` in `apps/web/src/lib/ai/client.ts`)
at `/ai/*`, which Hono forwards to `AI_URL`. Why: `docs/adr/0001-ai-calls-via-openapi-passthrough.md`.

- `packages/ai-contract/openapi.yaml` is the draft contract. `pnpm gen:ai` turns it into
  `apps/web/src/lib/ai/schema.d.ts`.
- With `VITE_MOCK_SEARCH=true`, MSW answers `/ai/*` in the browser (`apps/web/src/mocks/handlers.ts`).

To switch to the real service:

1. Start it and set `AI_URL` in `.env` (default `http://localhost:8000`).
2. Run `pnpm gen:ai -- --remote`. This fetches `${AI_URL}/openapi.json` and overwrites `schema.d.ts`.
3. Run `pnpm typecheck` and fix whatever the real contract changed.
4. Set `VITE_MOCK_SEARCH=false` and restart `pnpm dev`.

## PWA (optional)

`apps/web/pwa.config.ts` adds `vite-plugin-pwa` (autoUpdate + basic manifest). It is only active in
production builds (`pnpm build && pnpm --filter web preview`). The icons in `apps/web/public/` are
solid-color placeholders. To remove it: delete `pwa.config.ts` and `pwa()` in `vite.config.ts`, the PWA tags in `index.html`,
the PNG icons in `public/`, and run `pnpm --filter web remove vite-plugin-pwa`.
