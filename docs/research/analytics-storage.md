# Analytics storage: Postgres vs InfluxDB (and friends)

Question (HAC-18): where should Pomost keep analytics events (Wyszukiwania, used Akcje, Wizyty) so ROPS gets fast, good-looking statistics — and what do we say when the jury asks "why not a time-series database?"

**Recommendation: Postgres (the database we already run: Docker locally, Neon in production), with an append-only event table, the right indexes, and daily rollups. Keep a documented path to TimescaleDB (also on Neon) and, much later, ClickHouse.** Decision recorded in `docs/adr/0002-analytics-events-in-postgres.md`.

## Expected load (what "efficient" has to mean here)

- PRD `target_scale.users: large (do 10 tys.)`. Assume an aggressive 10 000 residents/day × 3 Wyszukiwania × ~6 events each (search, results shown, 1–2 Akcje, visit start/end) ≈ **200 000 events/day ≈ 70 M/year**.
- Realistic for the pilot (kiosks + web in Małopolska): 1–5 % of that.
- Reads: a handful of Pracownicy ROPS opening a dashboard; queries are aggregates over 7/30/90 days.

That is a small analytics workload. Postgres handles tables of tens of millions of rows with time-range indexes and pre-aggregated rollups comfortably; the dashboard reads rollups, not raw events.

## Options compared

| | **Postgres (chosen)** | **TimescaleDB on Postgres** | **InfluxDB 3 Core** | **ClickHouse** |
|---|---|---|---|---|
| New infrastructure | none | extension on the same DB (Neon supports it) | separate server + storage | separate server + storage |
| Production on our stack (Render free + Neon) | ✅ works today | ✅ Neon ships the Apache-2 edition | ❌ Render free has no persistent disk; needs paid disk or InfluxDB Cloud | ❌ same problem; ClickHouse Cloud is paid |
| Join with Potrzeby / Pomysły / users | ✅ plain SQL JOIN | ✅ plain SQL JOIN | ❌ different engine, join in app code | ⚠️ needs replication of Postgres data |
| Data model fit (events with nested results, ids, text) | ✅ rows + `jsonb` | ✅ hypertable + `jsonb` | ⚠️ tags/fields model; high-cardinality text (Zapytania) is a poor fit | ✅ columnar, great for events |
| Aggregation speed at our size | ✅ ms–s with indexes + rollups | ✅ faster on big ranges (time partitioning) | ✅ fast on recent time ranges | ✅ fastest at 100 M+ rows |
| Retention / cleanup | `DELETE` by date or partitions (`pg_partman` on Neon) | `drop_chunks` | built-in retention | TTL |
| Types end to end (Drizzle → tRPC → web) | ✅ one schema, typed | ✅ same | ❌ separate client, untyped | ❌ separate client |
| Team cost in a 24 h hackathon | lowest | low | high | high |

### Facts behind the table

- **Neon supports `timescaledb`**, but only the Apache-2 edition: TSL features such as native compression and continuous-aggregate internals are not enabled. Hypertables (automatic time partitioning) are available. — [Neon: timescaledb](https://neon.com/docs/extensions/timescaledb), [Neon extensions](https://neon.com/docs/extensions/pg-extensions)
- **Neon supports `pg_partman`** (time-based partitioning, background worker enabled), so plain Postgres can partition by month if the table ever grows large. — [Neon: pg_partman](https://neon.com/docs/extensions/pg_partman)
- **Neon publishes a guide for time-series data in Postgres**, i.e. this is a supported pattern on our host. — [Neon: Timeseries data in Postgres](https://neon.com/guides/timeseries-data)
- **InfluxDB 3 Core** (the open-source edition) is a "recent-data engine": it shipped with a ~72 h query window that was later lifted, but it still caps the number of Parquet files a single query may touch (default 432) and limits Core to 5 databases / 2 000 tables; long-range queries get expensive. — [InfluxDB 3 Core query docs](https://docs.influxdata.com/influxdb3/core/get-started/query/), [QuestDB benchmark & caveats](https://questdb.com/blog/influxdb3-core-alpha-benchmarks-and-caveats/), [InfluxData on lifting the 72 h limit](https://x.com/InfluxDB/status/1886421902115131866), [file-limit write-up](https://labhub.hopto.org/blog/2026-07-16-influxdb3-parquet-file-limit?lang=en)
- **Render free web services cannot attach a persistent disk**; their filesystem is wiped on redeploy/spin-down. A self-hosted Influx or ClickHouse would lose data on our current production plan. — [Render: Deploy for Free](https://render.com/docs/free), [Render: Persistent Disks](https://render.com/docs/disks.md)

## Why not "just add Influx in Docker"?

Locally it is easy (`docker compose` service). The problems are everywhere else:
1. **Production**: no free persistent disk on Render → a second paid service or InfluxDB Cloud account, plus secrets and backups for one more system.
2. **Our questions are relational**: "which Zapytania ended in a Luka", "which Innowacje got clicked after which Zapytanie", "share of Wyszukiwania that became a Potrzeba" — all JOINs with Postgres tables. Influx would force us to copy data both ways.
3. **High-cardinality text**: Zapytania are free text; time-series engines are tuned for metrics with low-cardinality tags.
4. **Types**: Drizzle + tRPC give us typed queries from the DB to the chart. A second engine breaks that chain.

## What makes Postgres fast enough (the plan the spec implements)

1. **Append-only `analytics_event` table** with narrow columns + `jsonb` payload; index on `(type, occurred_at)` and `(visit_id)`; BRIN index on `occurred_at` (tiny, ideal for append-only time data).
2. **Typed search table** `search` (one row per Wyszukiwanie) for the most common joins; events reference it by `search_id`.
3. **Rollups**: a daily rollup table refreshed by the API (on dashboard load if stale, or a cron) — the dashboard reads rollups for long ranges, raw events only for the last days.
4. **Batching**: the browser sends events in batches (`navigator.sendBeacon` on page hide), so write load is a few inserts per Wizyta.
5. **Growth path**, if numbers ever demand it (in order): monthly partitions with `pg_partman` → `timescaledb` hypertable (same SQL) → export to ClickHouse for heavy BI.

## Talking points for the presentation

- "Analityka siedzi w tej samej bazie co zgłoszenia — jedna kopia prawdy, statystyki łączą się z Potrzebami i Pomysłami jednym zapytaniem."
- "Zero dodatkowej infrastruktury i kosztów — działa na darmowym Neonie i Renderze, gotowe do wdrożenia w ROPS."
- "Skaluje się: indeksy czasowe + dzienne agregaty; gdy ruch urośnie, włączamy partycjonowanie albo TimescaleDB na tej samej bazie, bez przepisywania aplikacji."
- "Prywatność: zapytania maskujemy przed zapisem (e-mail, telefon, PESEL), nie ma kont ani śledzenia osób — Wizyta to losowy identyfikator na jedną sesję."
