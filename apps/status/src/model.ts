import { CHECK_MINUTES, HOSTS } from './config.js';
import { PAST_INCIDENTS, type PastIncident } from './incidents.js';
import { DOWN, MAINTENANCE, PENDING, UP, type KumaIncident, type KumaMaintenance, type KumaPage } from './kuma.js';
import type { DayCount } from './store.js';
import { DAY_MS, MVT_OFFSET_MS, dayKey, formatClock, formatDay } from './time.js';

export const DAYS_SHOWN = 90;

/** A day on the bar: no downtime, some, a lot, or no checks yet */
export type DayState = 'up' | 'partial' | 'down' | 'none';
/** A service right now, from its latest check */
export type Current = 'up' | 'trouble' | 'down' | 'maintenance' | 'unknown';

export interface Tick {
	state: DayState;
	label: string;
}

export interface ServiceView {
	id: number;
	name: string;
	host: string | null;
	current: Current;
	/** Response time of the latest check, ms */
	ping: number | null;
	/** Over the days shown that have checks, percent */
	uptime: number | null;
	ticks: Tick[];
}

export interface Overall {
	state: 'ok' | 'trouble' | 'down' | 'unknown';
	title: string;
	sub: string;
}

export interface Model {
	overall: Overall;
	groups: { name: string; services: ServiceView[] }[];
	incidents: KumaIncident[];
	maintenance: KumaMaintenance[];
	past: PastIncident[];
}

export interface LatestBeat {
	status: number;
	ts: number;
	ping: number | null;
}

export interface ModelInput {
	page: KumaPage | null;
	latest: Map<number, LatestBeat>;
	days: (monitorId: number, fromMs: number) => Map<number, DayCount>;
	now: number;
	/** When Kuma last answered */
	fetchedAt: number | null;
	/** Kuma is considered unreachable when it hasn't answered for this long */
	staleAfterMs: number;
}

export function dayState(pct: number | null): DayState {
	if (pct === null) return 'none';
	if (pct >= 99.9) return 'up';
	if (pct >= 95) return 'partial';
	return 'down';
}

/** Never round 99.996% up to 100%: 100% means no failed check at all. */
export function formatPercent(pct: number): string {
	if (pct >= 100) return '100%';
	return `${(Math.floor(pct * 100) / 100).toFixed(2)}%`;
}

export function formatDowntime(minutes: number): string {
	const m = Math.round(minutes);
	if (m <= 0) return 'no downtime';
	if (m < 60) return `${m} min down`;
	const h = Math.floor(m / 60);
	return m % 60 ? `${h} h ${m % 60} min down` : `${h} h down`;
}

export function currentOf(status: number | undefined): Current {
	switch (status) {
		case UP:
			return 'up';
		case DOWN:
			return 'down';
		case PENDING:
			return 'trouble';
		case MAINTENANCE:
			return 'maintenance';
		default:
			return 'unknown';
	}
}

export function buildTicks(days: Map<number, DayCount>, now: number, count = DAYS_SHOWN): { ticks: Tick[]; uptime: number | null } {
	const today = dayKey(now);
	const ticks: Tick[] = [];
	let total = 0;
	let down = 0;
	for (let key = today - count + 1; key <= today; key++) {
		const day = days.get(key);
		const isToday = key === today;
		const name = isToday ? 'Today so far' : formatDay(key);
		if (!day || day.total === 0) {
			ticks.push({ state: 'none', label: `${name} · not monitored yet` });
			continue;
		}
		total += day.total;
		down += day.down;
		const pct = ((day.total - day.down) / day.total) * 100;
		// Each failed check stands for one check interval of downtime.
		const downMinutes = day.down * CHECK_MINUTES;
		ticks.push({ state: dayState(pct), label: `${name} · ${formatPercent(pct)} uptime · ${formatDowntime(downMinutes)}` });
	}
	return { ticks, uptime: total ? ((total - down) / total) * 100 : null };
}

const listNames = (names: string[]): string =>
	names.length === 1 ? names[0]! : names.length === 2 ? `${names[0]} and ${names[1]}` : `${names.length} services`;

export function overallOf(services: ServiceView[], lastCheck: number | null, unreachable: boolean): Overall {
	const by = (state: Current) => services.filter((s) => s.current === state).map((s) => s.name);
	const down = by('down');
	const trouble = by('trouble');
	const maintenance = by('maintenance');
	const checked = lastCheck ? `Last checked ${formatClock(lastCheck)} MVT.` : '';

	if (!services.length || lastCheck === null) {
		return { state: 'unknown', title: 'Status unavailable', sub: "We can't reach our monitor right now. Please check back soon." };
	}
	const sub = unreachable
		? `We can't reach our monitor right now. ${checked}`
		: down.length + trouble.length + maintenance.length < services.length && (down.length || trouble.length)
			? `Everything else is working. ${checked}`
			: `Checked every minute. ${checked}`;

	if (down.length) return { state: 'down', title: `${listNames(down)} ${down.length === 1 ? 'is' : 'are'} down`, sub };
	if (trouble.length)
		return { state: 'trouble', title: `${listNames(trouble)} ${trouble.length === 1 ? 'is' : 'are'} having trouble`, sub };
	if (maintenance.length)
		return { state: 'trouble', title: `${listNames(maintenance)} ${maintenance.length === 1 ? 'is' : 'are'} under maintenance`, sub };
	return { state: unreachable ? 'unknown' : 'ok', title: 'All systems operational', sub };
}

export function buildModel(input: ModelInput): Model {
	const { page, latest, now } = input;
	const fromMs = (dayKey(now) - DAYS_SHOWN + 1) * DAY_MS - MVT_OFFSET_MS;
	const groups = [...(page?.publicGroupList ?? [])]
		.sort((a, b) => a.weight - b.weight)
		.map((group) => ({
			name: group.name,
			services: group.monitorList.map((monitor): ServiceView => {
				const beat = latest.get(monitor.id);
				const { ticks, uptime } = buildTicks(input.days(monitor.id, fromMs), now);
				return {
					id: monitor.id,
					name: monitor.name,
					host: HOSTS[monitor.id] ?? null,
					current: currentOf(beat?.status),
					ping: beat && beat.status === UP && beat.ping !== null ? Math.round(beat.ping) : null,
					uptime,
					ticks
				};
			})
		}));

	const services = groups.flatMap((g) => g.services);
	const lastCheck = Math.max(0, ...[...latest.values()].map((b) => b.ts)) || null;
	const unreachable = input.fetchedAt === null || now - input.fetchedAt > input.staleAfterMs;
	const oldest = dayKey(now) - DAYS_SHOWN + 1;

	return {
		overall: overallOf(services, lastCheck, unreachable),
		groups,
		incidents: page ? (page.incidents ?? (page.incident ? [page.incident] : [])) : [],
		maintenance: page?.maintenanceList ?? [],
		past: PAST_INCIDENTS.filter((incident) => dayKey(Date.parse(`${incident.date}T00:00:00Z`) - MVT_OFFSET_MS) >= oldest)
	};
}
