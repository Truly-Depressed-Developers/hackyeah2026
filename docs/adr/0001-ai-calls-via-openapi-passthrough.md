# AI calls go browser → Hono passthrough → Python, typed by OpenAPI, not tRPC

HubMI has two backends: Hono (`apps/api`, Postgres, tRPC for app data) and a separate Python service owned by the AI dev (search, Chroma, LLM). For AI calls such as search, the web app uses TanStack Query hooks generated from a shared OpenAPI spec (`packages/ai-contract/openapi.yaml`, via `openapi-typescript` + `openapi-fetch` + `openapi-react-query`). It calls Hono at `/ai/*`, and Hono forwards the request to Python unchanged. Locally, before Python exists, the browser fakes the network with MSW (`VITE_MOCK_SEARCH=true`).

We did not wrap search in tRPC, because the Python service owns the contract. With an OpenAPI spec, their changes flow straight into frontend types, without a hand-maintained tRPC mirror. We did not call Python directly from the browser, because a same-origin passthrough avoids CORS, keeps the Python URL server-side, and behaves the same locally, on Render and in the kiosk.

## Consequences

- There are two client styles in `apps/web`: tRPC for Hono data, generated OpenAPI hooks for AI.
- Hono does not validate AI payloads. Contract drift shows up as a type error after the spec is regenerated, not at runtime in Hono.
- This replaces the template's `decide` client (server-side mock/http switch). Mocking moves to the network layer (MSW), so switching to the real service is a flag, not a code change.
