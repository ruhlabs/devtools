import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import { Stats } from './stats.js';

let stats: Stats;
afterEach(() => stats?.close());

const setup = () => {
	stats = new Stats(':memory:');
	return createApp({ stats, statsToken: 'secret' });
};
const data = async (app: ReturnType<typeof createApp>, range = '7d', token = 'secret') =>
	app.request(`/stats/data?range=${range}`, { headers: { Authorization: `Bearer ${token}` } });

describe('stats', () => {
	it('counts requests per route, using the route pattern', async () => {
		const app = setup();
		await app.request('/v1/validate/phone?number=7771234');
		await app.request('/v1/validate/phone?number=123');
		await app.request('/v1/atolls/Sh');
		await app.request('/v1/atolls/nope');
		const res = await data(app);
		expect(res.status).toBe(200);
		const body = (await res.json()) as any;
		expect(body.totals.requests).toBe(4);
		expect(body.routes.find((r: any) => r.route === '/v1/validate/phone')).toMatchObject({ method: 'GET', requests: 2 });
		expect(body.routes.find((r: any) => r.route === '/v1/atolls/{query}')).toMatchObject({ requests: 2, clientErrors: 1 });
		expect(body.totals.p95).toBeTypeOf('number');
	});

	it('records unknown paths separately and ignores health checks and preflights', async () => {
		const app = setup();
		await app.request('/health');
		await app.request('/v1/validate/phone', { method: 'OPTIONS', headers: { Origin: 'https://x.dev', 'Access-Control-Request-Method': 'GET' } });
		await app.request('/v1/nope');
		await app.request('/wp-login.php');
		const body = (await (await data(app)).json()) as any;
		expect(body.totals.requests).toBe(2);
		expect(body.routes).toEqual([expect.objectContaining({ route: '(not found)', requests: 2 })]);
		expect(body.notFound.map((n: any) => n.path).sort()).toEqual(['/v1/nope', '/wp-login.php']);
	});

	it('counts unique visitors without storing IPs', async () => {
		const app = setup();
		const as = (ip: string) => ({ headers: { 'x-forwarded-for': ip, 'user-agent': 'test' } });
		await app.request('/v1/atolls', as('1.1.1.1'));
		await app.request('/v1/atolls', as('1.1.1.1'));
		await app.request('/v1/atolls', as('2.2.2.2'));
		const body = (await (await data(app)).json()) as any;
		expect(body.totals).toMatchObject({ requests: 3, visitors: 2 });
		expect(JSON.stringify(body)).not.toContain('1.1.1.1');
	});

	it('fills the time series with empty buckets', async () => {
		const app = setup();
		await app.request('/v1/atolls');
		const day = (await (await data(app, '24h')).json()) as any;
		expect(day.bucket).toBe('hour');
		expect(day.series.length).toBeGreaterThanOrEqual(24);
		expect(day.series.reduce((n: number, s: any) => n + s.requests, 0)).toBe(1);
		const month = (await (await data(app, '30d')).json()) as any;
		expect(month.series.length).toBeGreaterThanOrEqual(30);
	});

	it('protects the data with the token', async () => {
		const app = setup();
		expect((await data(app, '7d', 'wrong')).status).toBe(401);
		expect((await app.request('/stats/data')).status).toBe(401);
		expect((await data(app, 'forever')).status).toBe(400);
		expect((await app.request('/stats')).status).toBe(200);
	});

	it('does not serve /stats without a token', async () => {
		stats = new Stats(':memory:');
		const app = createApp({ stats });
		expect((await app.request('/stats')).status).toBe(404);
	});
});
