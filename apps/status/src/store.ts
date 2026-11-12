import { createRequire } from 'node:module';
import type { DatabaseSync as DatabaseSyncType } from 'node:sqlite';
import { DAY_MS, MVT_OFFSET_MS } from './time.js';

// Loaded at runtime: bundlers strip the "node:" prefix, and "sqlite" without it isn't a module.
const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite');

/** Keep a little more than the 90 days the page shows. */
const RETENTION_MS = 92 * DAY_MS;

export interface DayCount {
	/** Checks that counted (up, down or pending; maintenance is left out) */
	total: number;
	/** Checks that failed */
	down: number;
}

/**
 * Every heartbeat seen, one row per monitor and check time. Kuma's public API only returns
 * the last 100 checks per monitor, so this is what lets the page show 90 days.
 */
export class BeatStore {
	private db: DatabaseSyncType;

	constructor(file: string) {
		this.db = new DatabaseSync(file);
		this.db.exec(`
			PRAGMA journal_mode = WAL;
			CREATE TABLE IF NOT EXISTS beats (
				monitor_id INTEGER NOT NULL,
				ts INTEGER NOT NULL,
				status INTEGER NOT NULL,
				ping INTEGER,
				PRIMARY KEY (monitor_id, ts)
			) WITHOUT ROWID;
		`);
	}

	add(monitorId: number, beats: { ts: number; status: number; ping: number | null }[]): void {
		const insert = this.db.prepare('INSERT OR IGNORE INTO beats (monitor_id, ts, status, ping) VALUES (?, ?, ?, ?)');
		this.db.exec('BEGIN');
		try {
			for (const beat of beats) {
				if (Number.isFinite(beat.ts)) insert.run(monitorId, beat.ts, beat.status, beat.ping === null ? null : Math.round(beat.ping));
			}
			this.db.exec('COMMIT');
		} catch (error) {
			this.db.exec('ROLLBACK');
			throw error;
		}
	}

	/** Counts per Maldives-time day key, for one monitor, from `fromMs` on. */
	days(monitorId: number, fromMs: number): Map<number, DayCount> {
		const rows = this.db
			.prepare(
				`SELECT CAST((ts + ?) / ? AS INTEGER) AS day,
					SUM(CASE WHEN status IN (0, 1, 2) THEN 1 ELSE 0 END) AS total,
					SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) AS down
				FROM beats WHERE monitor_id = ? AND ts >= ? GROUP BY day`
			)
			.all(MVT_OFFSET_MS, DAY_MS, monitorId, fromMs) as { day: number; total: number; down: number }[];
		return new Map(rows.map((row) => [Number(row.day), { total: Number(row.total), down: Number(row.down) }]));
	}

	prune(now = Date.now()): void {
		this.db.prepare('DELETE FROM beats WHERE ts < ?').run(now - RETENTION_MS);
	}

	close(): void {
		this.db.close();
	}
}
