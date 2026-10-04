# Analytics events live in Postgres, not a time-series database

Pomost records every Wyszukiwanie, shown Wyniki, used Akcje and Wizyty for the Panel administratora's statistics (HAC-18). We store them in the existing Postgres (Docker locally, Neon in production) as an append-only event table plus a typed `search` table and daily rollups, instead of adding InfluxDB or ClickHouse.

The questions ROPS asks are relational (which Zapytania ended in a Luka, which Innowacje get clicked, how many Wyszukiwania become a Potrzeba), so they need joins with `need` and `idea`. A second engine would need its own hosting — Render's free plan has no persistent disk — its own client, and copies of our data, and it would break the Drizzle → tRPC → web type chain. At our scale (worst case ~200 k events/day) Postgres with time indexes and rollups is fast enough.

## Consequences

- Growth path without a rewrite: monthly partitions (`pg_partman`) → TimescaleDB hypertable (Neon ships its Apache-2 edition) → export to ClickHouse only for heavy BI.
- The browser sends events to our API, never to the AI service (ADR-0001 unchanged).
- Research and sources: `docs/research/analytics-storage.md`.
