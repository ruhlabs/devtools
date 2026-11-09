import { describe, expect, it } from 'vitest';
import { createApp } from './app.js';

const app = createApp();
const get = async (path: string) => {
	const res = await app.request(path);
	return { status: res.status, body: (await res.json()) as Record<string, unknown> };
};

describe('API', () => {
	it('health', async () => {
		expect(await get('/health')).toEqual({ status: 200, body: { status: 'ok' } });
	});

	it('thaana → latin', async () => {
		const { status, body } = await get(`/v1/thaana/to-latin?text=${encodeURIComponent('ދިވެހިރާއްޖެ')}`);
		expect(status).toBe(200);
		expect(body.output).toBe('dhivehiraajje');
	});

	it('latin → thaana', async () => {
		const { body } = await get('/v1/thaana/to-thaana?text=raajje');
		expect(body.output).toBe('ރާއްޖެ');
	});

	it('validates phone numbers', async () => {
		const ok = await get(`/v1/validate/phone?number=${encodeURIComponent('+960 777 1234')}`);
		expect(ok.body).toMatchObject({ valid: true, e164: '+9607771234', type: 'mobile' });
		const bad = await get('/v1/validate/phone?number=123');
		expect(bad.body).toMatchObject({ valid: false });
	});

	it('validates national IDs', async () => {
		const { body } = await get('/v1/validate/national-id?id=a123456');
		expect(body).toMatchObject({ valid: true, normalized: 'A123456' });
	});

	it('rejects missing params and unknown routes', async () => {
		expect((await get('/v1/thaana/to-latin')).status).toBe(400);
		expect((await get('/nope')).status).toBe(404);
	});
});
