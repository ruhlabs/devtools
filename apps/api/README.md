# Ruh Labs API

A small HTTP API around the `@ruhlabs/*` packages, built with [Hono](https://hono.dev).

**Docs:** https://api.oreotm.xyz/docs — interactive reference with examples, a "Test Request" button and code samples in many languages. The OpenAPI 3.1 spec is at [`/openapi.json`](https://api.oreotm.xyz/openapi.json).

The docs are generated from the route definitions in `src/app.ts`: each route is declared with `createRoute` and Zod schemas, which validate requests *and* describe them in the spec, so the docs can't drift from the code.

| Endpoint | Example |
|---|---|
| `GET /health` | `{ "status": "ok" }` |
| `GET /v1/thaana/to-latin?text=` | `ދިވެހި` → `{ "output": "dhivehi" }` |
| `GET /v1/thaana/to-thaana?text=` | `raajje` → `{ "output": "ރާއްޖެ" }` |
| `GET /v1/validate/phone?number=` | `+960 777 1234` → `{ "valid": true, "e164": "+9607771234", ... }` |
| `GET /v1/validate/national-id?id=` | `a123456` → `{ "valid": true, "normalized": "A123456" }` |
| `GET /v1/atolls` | All 20 atolls and the 5 cities |
| `GET /v1/atolls/:query` | `Haa Alif`, `HA`, `ހއ` or `MV-07` → the atoll |
| `GET /v1/address/parse?island=` | `B. Eydhafushi` → `{ "atoll": { "code": "B", ... }, "island": "Eydhafushi" }` |

`/v1/*` is rate limited to 120 requests per minute per IP. CORS is open, so it can be called from the browser.

## Usage stats

The API records each request (route, status, response time) in a SQLite file and shows a private dashboard at **`/stats`**: busiest routes, requests over time, unique visitors, error rates, p50/p95 response times and the paths people tried that don't exist.

- Health checks, CORS preflights and the dashboard itself aren't counted.
- IP addresses are never stored. Unique visitors come from a hash of IP + user agent with a salt that rotates daily.
- Rows older than 90 days are deleted.

| Env var | Default | |
|---|---|---|
| `STATS_TOKEN` | – | Required to open `/stats`. Without it, requests are still recorded but the dashboard isn't served. |
| `DATA_DIR` | `./data` (`/app/data` in Docker) | Where `stats.db` lives. Mount a volume here. |
| `STATS_DISABLED` | – | Set to `true` to turn tracking off. |

## Running

```bash
pnpm dev:api          # from the repo root, http://localhost:3000
docker build -t ruhlabs-api . && docker run -p 3000:3000 ruhlabs-api
```

The `PORT` environment variable sets the port (default `3000`).
