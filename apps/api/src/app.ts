import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { toLatin, toThaana, hasThaana } from '@ruhlabs/thaana';
import { isValidNationalId, normalizeNationalId, parsePhone } from '@ruhlabs/validators';
import { rateLimit } from './rate-limit.js';

const MAX_TEXT_LENGTH = 5000;

function requireParam(c: Context, name: string, maxLength = 200): string | Response {
	const value = c.req.query(name);
	if (!value) return c.json({ error: `Missing query parameter "${name}"` }, 400);
	if (value.length > maxLength) return c.json({ error: `"${name}" must be at most ${maxLength} characters` }, 400);
	return value;
}

export function createApp() {
	const app = new Hono();

	app.use('*', secureHeaders());
	app.use('*', cors());
	app.use('/v1/*', rateLimit({ limit: 120, windowMs: 60_000 }));

	app.get('/', (c) =>
		c.json({
			name: 'Maavadi API',
			description: 'Developer tools for Maldivian developers, by Ruh Labs',
			docs: 'https://github.com/ruhlabs/maavadi',
			endpoints: [
				'GET /v1/thaana/to-latin?text=',
				'GET /v1/thaana/to-thaana?text=',
				'GET /v1/validate/phone?number=',
				'GET /v1/validate/national-id?id='
			]
		})
	);

	app.get('/health', (c) => c.json({ status: 'ok' }));

	app.get('/v1/thaana/to-latin', (c) => {
		const text = requireParam(c, 'text', MAX_TEXT_LENGTH);
		if (typeof text !== 'string') return text;
		return c.json({ input: text, output: toLatin(text) });
	});

	app.get('/v1/thaana/to-thaana', (c) => {
		const text = requireParam(c, 'text', MAX_TEXT_LENGTH);
		if (typeof text !== 'string') return text;
		if (hasThaana(text)) return c.json({ error: 'Text is already in Thaana' }, 400);
		return c.json({ input: text, output: toThaana(text) });
	});

	app.get('/v1/validate/phone', (c) => {
		const number = requireParam(c, 'number');
		if (typeof number !== 'string') return number;
		const parsed = parsePhone(number);
		return c.json(parsed ? { input: number, valid: true, ...parsed } : { input: number, valid: false });
	});

	app.get('/v1/validate/national-id', (c) => {
		const id = requireParam(c, 'id');
		if (typeof id !== 'string') return id;
		return c.json({ input: id, valid: isValidNationalId(id), normalized: normalizeNationalId(id) });
	});

	app.notFound((c) => c.json({ error: 'Not found' }, 404));
	app.onError((err, c) => {
		console.error(err);
		return c.json({ error: 'Internal server error' }, 500);
	});

	return app;
}
