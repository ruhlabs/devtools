import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { BRAND, KUMA_SLUG, KUMA_URL, POLL_MS } from './config.js';
import { Monitor } from './monitor.js';
import { BeatStore } from './store.js';

const port = Number(process.env.PORT ?? 3000);
// In Docker, mount a volume at /app/data so the 90-day history survives redeploys.
const dataDir = process.env.DATA_DIR ?? join(process.cwd(), 'data');
mkdirSync(dataDir, { recursive: true });

const store = new BeatStore(join(dataDir, 'status.db'));
const monitor = new Monitor(store, { kumaUrl: KUMA_URL, slug: KUMA_SLUG, pollMs: POLL_MS, brand: BRAND });
monitor.start();

const app = createApp({
	brand: BRAND,
	model: () => monitor.current,
	rssUrl: `${KUMA_URL}/status/${encodeURIComponent(KUMA_SLUG)}/rss`,
	lastSuccess: () => monitor.lastSuccess
});

const server = serve({ fetch: app.fetch, port }, (info) => {
	console.log(`${BRAND.title} listening on http://localhost:${info.port}, reading ${KUMA_URL}/status/${KUMA_SLUG}`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
	process.on(signal, () => {
		monitor.stop();
		server.close(() => {
			store.close();
			process.exit(0);
		});
	});
}
