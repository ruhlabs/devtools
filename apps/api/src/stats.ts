import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { createRequire } from 'node:module';
import type { DatabaseSync as DatabaseSyncType } from 'node:sqlite';
import type { MiddlewareHandler } from 'hono';
import { routePath } from 'hono/route';

/** Routes we don't count: uptime checks would drown everything else out. */
// Loaded at runtime: bundlers strip the "node:" prefix, and "sqlite" without it isn't a module.
const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite');

const IGNORED_PATHS = new Set(['/health', '/favicon.ico']);
const RETENTION_DAYS = 90;
const DAY_MS = 86_400_000;

export interface RequestRecord {
	ts: number;
	method: string;
	/** Matched route pattern, e.g. "/v1/atolls/{query}", or "(not found)" */
	route: string;
	/** Raw path, only kept for unmatched requests so you can see what people try */
	path: string | null;
	status: number;
	durationMs: number;
	/** Daily-salted hash of IP + user agent: counts unique visitors without storing IPs */
	visitor: string;
	/** Whether the request came from a web page (has an Origin header) */
	browser: boolean;
}

export type Range = '24h' | '7d' | '30d' | '90d';
const RANGES: Record<Range, { ms: number; bucket: 'hour' | 'day' }> = {
	'24h': { ms: DAY_MS, bucket: 'hour' },
	'7d': { ms: 7 * DAY_MS, bucket: 'day' },
	'30d': { ms: 30 * DAY_MS, bucket: 'day' },
	'90d': { ms: 90 * DAY_MS, bucket: 'day' }
};
export const isRange = (value: unknown): value is Range => typeof value === 'string' && value in RANGES;

/**
 * Request analytics stored in SQLite (Node's built-in `node:sqlite`, so no
 * native dependencies). One row per request, pruned after 90 days.
 */
export class Stats {
	private db: DatabaseSyncType;
	private insert;
	private salt: { day: string; value: string } | undefined;

	constructor(file: string) {
		this.db = new DatabaseSync(file);
		this.db.exec(`
			PRAGMA journal_mode = WAL;
			PRAGMA synchronous = NORMAL;
			CREATE TABLE IF NOT EXISTS requests (
				ts INTEGER NOT NULL,
				method TEXT NOT NULL,
				route TEXT NOT NULL,
				path TEXT,
				status INTEGER NOT NULL,
				duration_ms REAL NOT NULL,
				visitor TEXT NOT NULL,
				browser INTEGER NOT NULL
			);
			CREATE INDEX IF NOT EXISTS requests_ts ON requests (ts);
			CREATE TABLE IF NOT EXISTS salts (day TEXT PRIMARY KEY, value TEXT NOT NULL);
		`);
		this.insert = this.db.prepare(
			'INSERT INTO requests (ts, method, route, path, status, duration_ms, visitor, browser) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
		);
		this.prune();
		setInterval(() => this.prune(), 6 * 60 * 60_000).unref();
	}

	record(r: RequestRecord) {
		this.insert.run(r.ts, r.method, r.route, r.path, r.status, r.durationMs, r.visitor, r.browser ? 1 : 0);
	}

	/** Hash a client into an anonymous ID that changes every day (UTC). */
	visitorId(ip: string, userAgent: string, now = Date.now()): string {
		const day = new Date(now).toISOString().slice(0, 10);
		if (this.salt?.day !== day) {
			const existing = this.db.prepare('SELECT value FROM salts WHERE day = ?').get(day) as { value: string } | undefined;
			const value = existing?.value ?? randomBytes(16).toString('hex');
			if (!existing) {
				this.db.prepare('INSERT OR IGNORE INTO salts (day, value) VALUES (?, ?)').run(day, value);
				this.db.prepare('DELETE FROM salts WHERE day < ?').run(day); // old salts are useless once rotated
			}
			this.salt = { day, value };
		}
		return createHash('sha256').update(`${this.salt.value}|${ip}|${userAgent}`).digest('hex').slice(0, 16);
	}

	prune(now = Date.now()) {
		this.db.prepare('DELETE FROM requests WHERE ts < ?').run(now - RETENTION_DAYS * DAY_MS);
	}

	summary(range: Range, now = Date.now()) {
		const { ms, bucket } = RANGES[range];
		const since = now - ms;
		const all = <T>(sql: string, ...params: (string | number)[]) => this.db.prepare(sql).all(...params) as T[];
		const one = <T>(sql: string, ...params: (string | number)[]) => this.db.prepare(sql).get(...params) as T;

		const totals = one<{
			requests: number;
			visitors: number;
			clientErrors: number;
			serverErrors: number;
			browser: number;
		}>(
			`SELECT COUNT(*) AS requests,
				COUNT(DISTINCT visitor) AS visitors,
				COALESCE(SUM(status BETWEEN 400 AND 499), 0) AS clientErrors,
				COALESCE(SUM(status >= 500), 0) AS serverErrors,
				COALESCE(SUM(browser), 0) AS browser
			FROM requests WHERE ts >= ?`,
			since
		);

		const latency = one<{ p50: number | null; p95: number | null }>(
			`WITH r AS (
				SELECT duration_ms, ROW_NUMBER() OVER (ORDER BY duration_ms) AS rn, COUNT(*) OVER () AS n
				FROM requests WHERE ts >= ?
			)
			SELECT MIN(CASE WHEN rn >= 0.5 * n THEN duration_ms END) AS p50,
				MIN(CASE WHEN rn >= 0.95 * n THEN duration_ms END) AS p95
			FROM r`,
			since
		);

		const routes = all<{
			route: string;
			method: string;
			requests: number;
			visitors: number;
			clientErrors: number;
			serverErrors: number;
			p50: number;
			p95: number;
		}>(
			`WITH r AS (
				SELECT route, method, status, visitor, duration_ms,
					ROW_NUMBER() OVER (PARTITION BY route, method ORDER BY duration_ms) AS rn,
					COUNT(*) OVER (PARTITION BY route, method) AS n
				FROM requests WHERE ts >= ?
			)
			SELECT route, method,
				COUNT(*) AS requests,
				COUNT(DISTINCT visitor) AS visitors,
				SUM(status BETWEEN 400 AND 499) AS clientErrors,
				SUM(status >= 500) AS serverErrors,
				MIN(CASE WHEN rn >= 0.5 * n THEN duration_ms END) AS p50,
				MIN(CASE WHEN rn >= 0.95 * n THEN duration_ms END) AS p95
			FROM r GROUP BY route, method ORDER BY requests DESC`,
			since
		);

		// Bucket by UTC+5 (Maldives time) so "days" line up with local days.
		const offset = 5 * 3_600_000;
		const size = bucket === 'hour' ? 3_600_000 : DAY_MS;
		const rows = all<{ bucket: number; requests: number; visitors: number; errors: number }>(
			`SELECT ((CAST(ts AS INTEGER) + CAST(? AS INTEGER)) / CAST(? AS INTEGER)) * CAST(? AS INTEGER) - CAST(? AS INTEGER) AS bucket,
				COUNT(*) AS requests,
				COUNT(DISTINCT visitor) AS visitors,
				SUM(status >= 400) AS errors
			FROM requests WHERE ts >= ? GROUP BY bucket ORDER BY bucket`,
			offset,
			size,
			size,
			offset,
			since
		);
		// Fill empty buckets with zeros so the chart has no gaps.
		const byBucket = new Map(rows.map((row) => [row.bucket, row]));
		const first = Math.floor((since + offset) / size) * size - offset;
		const series = [];
		for (let t = first; t <= now; t += size) {
			const row = byBucket.get(t);
			series.push({ t, requests: row?.requests ?? 0, visitors: row?.visitors ?? 0, errors: row?.errors ?? 0 });
		}

		const statuses = all<{ status: number; requests: number }>(
			'SELECT status, COUNT(*) AS requests FROM requests WHERE ts >= ? GROUP BY status ORDER BY requests DESC',
			since
		);

		const notFound = all<{ path: string; requests: number }>(
			`SELECT path, COUNT(*) AS requests FROM requests
			WHERE ts >= ? AND route = '(not found)' AND path IS NOT NULL
			GROUP BY path ORDER BY requests DESC LIMIT 15`,
			since
		);

		return {
			range,
			bucket,
			generatedAt: now,
			totals: { ...totals, p50: latency.p50, p95: latency.p95 },
			routes,
			series,
			statuses,
			notFound
		};
	}

	close() {
		this.db.close();
	}
}

const clientIp = (header: (name: string) => string | undefined) =>
	header('x-forwarded-for')?.split(',')[0]?.trim() || header('x-real-ip') || 'unknown';

/** Records every request (except health checks, CORS preflights and the stats pages themselves). */
export function trackRequests(stats: Stats): MiddlewareHandler {
	return async (c, next) => {
		const start = performance.now();
		await next();

		const path = c.req.path;
		if (c.req.method === 'OPTIONS' || IGNORED_PATHS.has(path) || path === '/stats' || path.startsWith('/stats/')) return;

		// The last matched route is the handler; wildcard-only matches mean nothing handled it.
		const matched = routePath(c, -1);
		const found = c.res.status !== 404 || !matched.includes('*');
		const route = found ? matched.replace(/:(\w+)/g, '{$1}') : '(not found)';

		try {
			stats.record({
				ts: Date.now(),
				method: c.req.method,
				route,
				path: found ? null : path.slice(0, 200),
				status: c.res.status,
				durationMs: Math.round((performance.now() - start) * 100) / 100,
				visitor: stats.visitorId(clientIp((name) => c.req.header(name)), c.req.header('user-agent') ?? ''),
				browser: Boolean(c.req.header('origin'))
			});
		} catch (error) {
			// Analytics must never break the API.
			console.error('stats: failed to record request', error);
		}
	};
}

/** Constant-time comparison of a provided token against the configured one. */
export function tokenMatches(provided: string | undefined, expected: string): boolean {
	if (!provided) return false;
	const a = Buffer.from(provided);
	const b = Buffer.from(expected);
	return a.length === b.length && timingSafeEqual(a, b);
}
