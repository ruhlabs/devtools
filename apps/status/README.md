# Ruh Labs status page

The public status page for Ruh Labs services. It reads Uptime Kuma's public status-page API
(`/api/status-page/<slug>` and `/api/status-page/heartbeat/<slug>`) every minute, saves every
check in SQLite, and serves a server-rendered page with a 90-day history per service.

Kuma's public API only returns the last 100 checks per monitor, so the history starts when this
app first runs; earlier days show as "Not monitored yet".

## What to edit

- **Which services appear, and their groups:** the Kuma status page (default slug `ruh`).
- **Addresses shown under each service:** `HOSTS` in `src/config.ts`, by Kuma monitor id.
- **An ongoing incident:** pin an incident on the Kuma status page; it appears within a minute.
- **Past incidents:** `src/incidents.ts`, then redeploy.

## Settings

| Variable | Default | |
|---|---|---|
| `KUMA_URL` | `https://status.oreotm.xyz` | Uptime Kuma base URL |
| `KUMA_SLUG` | `ruh` | Kuma status page to mirror |
| `POLL_MS` | `60000` | How often to read Kuma |
| `CHECK_MINUTES` | `1` | Kuma's check interval; each failed check counts as this much downtime |
| `DATA_DIR` | `./data` (`/app/data` in Docker) | Where `status.db` lives; mount a volume |

## Endpoints

`/` the page · `/api/status` a JSON summary (CORS open) · `/health`

## Run

```bash
pnpm --filter @ruhlabs/status build && pnpm --filter @ruhlabs/status start
docker build -f apps/status/Dockerfile -t ruh-status .
```
