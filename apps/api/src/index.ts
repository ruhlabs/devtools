import { serve } from '@hono/node-server';
import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 3000);
const server = serve({ fetch: createApp().fetch, port }, (info) => {
	console.log(`Ruh Labs API listening on http://localhost:${info.port}`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
	process.on(signal, () => server.close(() => process.exit(0)));
}
