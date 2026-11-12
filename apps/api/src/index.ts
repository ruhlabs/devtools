import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { Stats } from './stats.js';

const port = Number(process.env.PORT ?? 3000);

// Analytics live in a SQLite file. In Docker, mount a volume at /app/data so it survives redeploys.
const dataDir = process.env.DATA_DIR ?? join(process.cwd(), 'data');
let stats: Stats | undefined;
if (process.env.STATS_DISABLED !== 'true') {
	try {
		mkdirSync(dataDir, { recursive: true });
		stats = new Stats(join(dataDir, 'stats.db'));
	} catch (error) {
		console.error(`stats: disabled, could not open ${dataDir}`, error);
	}
}
const statsToken = process.env.STATS_TOKEN || undefined;
if (stats && !statsToken) console.warn('stats: recording requests, but STATS_TOKEN is not set so /stats is disabled');

const server = serve({ fetch: createApp({ stats, statsToken }).fetch, port }, (info) => {
	console.log(`Ruh Labs API listening on http://localhost:${info.port}`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
	process.on(signal, () =>
		server.close(() => {
			stats?.close();
			process.exit(0);
		})
	);
}
