import { fetchKuma, parseKumaTime, type KumaPage } from './kuma.js';
import { buildModel, type LatestBeat, type Model } from './model.js';
import type { BeatStore } from './store.js';

/** Reads Kuma on a timer, saves every check, and keeps the page model ready. */
export class Monitor {
	private page: KumaPage | null = null;
	private latest = new Map<number, LatestBeat>();
	private fetchedAt: number | null = null;
	private model: Model;
	private timer: NodeJS.Timeout | undefined;

	constructor(
		private store: BeatStore,
		private options: { kumaUrl: string; slug: string; pollMs: number }
	) {
		this.model = this.build();
	}

	get current(): Model {
		return this.model;
	}

	get lastSuccess(): number | null {
		return this.fetchedAt;
	}

	async poll(): Promise<void> {
		try {
			const { page, beats } = await fetchKuma(this.options.kumaUrl, this.options.slug);
			for (const [id, list] of Object.entries(beats.heartbeatList ?? {})) {
				const monitorId = Number(id);
				const rows = list.map((b) => ({ ts: parseKumaTime(b.time), status: b.status, ping: b.ping ?? null }));
				this.store.add(monitorId, rows);
				const newest = rows.filter((r) => Number.isFinite(r.ts)).sort((a, b) => b.ts - a.ts)[0];
				if (newest) this.latest.set(monitorId, newest);
			}
			this.page = page;
			this.fetchedAt = Date.now();
		} catch (error) {
			console.error('kuma: poll failed', error instanceof Error ? error.message : error);
		}
		this.model = this.build();
	}

	start(): void {
		void this.poll();
		this.timer = setInterval(() => void this.poll(), this.options.pollMs);
		// Prune old checks once a day.
		setInterval(() => this.store.prune(), 86_400_000).unref();
	}

	stop(): void {
		clearInterval(this.timer);
	}

	private build(): Model {
		return buildModel({
			page: this.page,
			latest: this.latest,
			days: (id, from) => this.store.days(id, from),
			now: Date.now(),
			fetchedAt: this.fetchedAt,
			staleAfterMs: this.options.pollMs * 5
		});
	}
}
