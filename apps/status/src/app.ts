import { Hono } from 'hono';
import hero from './hero.webp';
import { CSS, FAVICON, JS } from './assets.js';
import { brandCss, type Brand } from './brands.js';
import type { Model } from './model.js';
import { renderMain, renderPage } from './view.js';

export interface AppOptions {
	brand: Brand;
	model: () => Model;
	rssUrl: string;
	/** For /health: when Kuma last answered */
	lastSuccess: () => number | null;
}

const csp = (brand: Brand) => [
	"default-src 'self'",
	"style-src 'self' https://fonts.googleapis.com",
	'font-src https://fonts.gstatic.com',
	"script-src 'self'",
	`img-src 'self' data: ${brand.imgOrigins.join(' ')}`.trim(),
	"connect-src 'self'",
	"base-uri 'none'",
	"form-action 'none'",
	"frame-ancestors 'none'"
].join('; ');

export function createApp(options: AppOptions): Hono {
	const app = new Hono();

	app.use('*', async (c, next) => {
		await next();
		c.header('X-Content-Type-Options', 'nosniff');
		c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
	});

	app.get('/', (c) => {
		const model = options.model();
		c.header('Cache-Control', 'public, max-age=15');
		if (c.req.query('fragment')) return c.html(renderMain(model, options.brand));
		c.header('Content-Security-Policy', csp(options.brand));
		return c.html(renderPage(model, options.brand, options.rssUrl));
	});

	app.get('/api/status', (c) => {
		const model = options.model();
		c.header('Cache-Control', 'public, max-age=15');
		c.header('Access-Control-Allow-Origin', '*');
		return c.json({
			status: model.overall.state,
			title: model.overall.title,
			services: model.groups.flatMap((g) =>
				g.services.map((s) => ({ group: g.name, name: s.name, status: s.current, uptime90d: s.uptime }))
			)
		});
	});

	const asset = (body: string, type: string) => (c: { body: (b: string, s: 200, h: Record<string, string>) => Response }) =>
		c.body(body, 200, { 'Content-Type': type, 'Cache-Control': 'public, max-age=3600' });
	app.get('/app.css', asset(brandCss(options.brand) + CSS, 'text/css; charset=utf-8'));
	app.get('/app.js', asset(JS, 'text/javascript; charset=utf-8'));
	app.get('/favicon.svg', asset(FAVICON, 'image/svg+xml'));
	app.get('/hero.webp', (c) =>
		c.body(hero as Uint8Array<ArrayBuffer>, 200, { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=86400' })
	);
	app.get('/favicon.ico', (c) => c.redirect('/favicon.svg', 301));

	app.get('/health', (c) => c.json({ ok: true, kumaLastAnswered: options.lastSuccess() }));

	app.notFound((c) => c.text('Not found', 404));
	return app;
}
