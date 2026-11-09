import type { MiddlewareHandler } from 'hono';

interface Options {
	limit: number;
	windowMs: number;
}

/**
 * Simple fixed-window, in-memory rate limiter keyed by client IP.
 * Fine for a single instance; swap for Redis if the API is ever scaled out.
 */
export function rateLimit({ limit, windowMs }: Options): MiddlewareHandler {
	const hits = new Map<string, { count: number; resetAt: number }>();

	setInterval(() => {
		const now = Date.now();
		for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
	}, windowMs).unref();

	return async (c, next) => {
		const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || c.req.header('x-real-ip') || 'unknown';
		const now = Date.now();
		let entry = hits.get(ip);
		if (!entry || entry.resetAt <= now) {
			entry = { count: 0, resetAt: now + windowMs };
			hits.set(ip, entry);
		}
		entry.count++;

		c.header('RateLimit-Limit', String(limit));
		c.header('RateLimit-Remaining', String(Math.max(0, limit - entry.count)));
		c.header('RateLimit-Reset', String(Math.ceil((entry.resetAt - now) / 1000)));

		if (entry.count > limit) return c.json({ error: 'Too many requests' }, 429);
		await next();
	};
}
