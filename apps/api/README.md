# Maavadi API

A small HTTP API around the `@ruhlabs/*` packages, built with [Hono](https://hono.dev).

| Endpoint | Example |
|---|---|
| `GET /health` | `{ "status": "ok" }` |
| `GET /v1/thaana/to-latin?text=` | `ދިވެހި` → `{ "output": "dhivehi" }` |
| `GET /v1/thaana/to-thaana?text=` | `raajje` → `{ "output": "ރާއްޖެ" }` |
| `GET /v1/validate/phone?number=` | `+960 777 1234` → `{ "valid": true, "e164": "+9607771234", ... }` |
| `GET /v1/validate/national-id?id=` | `a123456` → `{ "valid": true, "normalized": "A123456" }` |

`/v1/*` is rate limited to 120 requests per minute per IP. CORS is open, so it can be called from the browser.

## Running

```bash
pnpm dev:api          # from the repo root, http://localhost:3000
docker build -t maavadi-api . && docker run -p 3000:3000 maavadi-api
```

The `PORT` environment variable sets the port (default `3000`).
