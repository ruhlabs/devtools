import { describe, expect, it } from 'vitest';
import { buildModel, buildTicks, dayState, formatDowntime, formatPercent, overallOf, type ServiceView } from './model.js';
import { dayKey } from './time.js';

// 12 Nov 2026, 18:00 in the Maldives
const now = Date.UTC(2026, 10, 12, 13, 0);

describe('dayKey', () => {
	it('groups by Maldives day, not UTC day', () => {
		// 23:30 UTC on the 11th is 04:30 on the 12th in the Maldives
		expect(dayKey(Date.UTC(2026, 10, 11, 23, 30))).toBe(dayKey(now));
		expect(dayKey(Date.UTC(2026, 10, 11, 18, 59))).toBe(dayKey(now) - 1);
	});
});

describe('dayState and formatting', () => {
	it('sorts days by uptime', () => {
		expect(dayState(null)).toBe('none');
		expect(dayState(100)).toBe('up');
		expect(dayState(99.93)).toBe('up');
		expect(dayState(98)).toBe('partial');
		expect(dayState(79.7)).toBe('down');
	});
	it('never rounds a failed check up to 100%', () => {
		expect(formatPercent(99.999)).toBe('99.99%');
		expect(formatPercent(100)).toBe('100%');
	});
	it('words downtime', () => {
		expect(formatDowntime(0)).toBe('no downtime');
		expect(formatDowntime(12.4)).toBe('12 min down');
		expect(formatDowntime(292)).toBe('4 h 52 min down');
		expect(formatDowntime(120)).toBe('2 h down');
	});
});

describe('buildTicks', () => {
	it('shows 90 days, oldest first, with gaps as not monitored', () => {
		const today = dayKey(now);
		const days = new Map([
			[today - 1, { total: 1440, down: 0 }],
			[today, { total: 1000, down: 200 }]
		]);
		const { ticks, uptime } = buildTicks(days, now);
		expect(ticks).toHaveLength(90);
		expect(ticks[0]!.state).toBe('none');
		expect(ticks[88]!.state).toBe('up');
		expect(ticks[89]!.state).toBe('down');
		expect(ticks[89]!.label).toMatch(/^Today so far · 80\.00% uptime · 3 h 20 min down$/);
		expect(uptime).toBeCloseTo((2440 - 200) / 2440 * 100);
	});
	it('has no uptime when nothing was checked', () => {
		expect(buildTicks(new Map(), now).uptime).toBeNull();
	});
});

describe('overallOf', () => {
	const svc = (name: string, current: ServiceView['current']): ServiceView => ({
		id: 1, name, host: null, current, ping: null, uptime: null, ticks: []
	});
	it('says all is well', () => {
		expect(overallOf([svc('A', 'up'), svc('B', 'up')], now, false)).toMatchObject({ state: 'ok', title: 'All systems operational' });
	});
	it('names what is down and says the rest works', () => {
		const o = overallOf([svc('SET25 HQ', 'down'), svc('B', 'up')], now, false);
		expect(o).toMatchObject({ state: 'down', title: 'SET25 HQ is down' });
		expect(o.sub).toMatch(/^Everything else is working/);
		expect(overallOf([svc('A', 'down'), svc('B', 'down')], now, false).title).toBe('A and B are down');
		expect(overallOf([svc('A', 'down'), svc('B', 'down'), svc('C', 'down')], now, false).title).toBe('3 services are down');
	});
	it('admits when the monitor cannot be reached', () => {
		expect(overallOf([svc('A', 'up')], now, true).state).toBe('unknown');
		expect(overallOf([], null, true).title).toBe('Status unavailable');
	});
});

describe('buildModel', () => {
	it('orders groups and keeps recent past incidents only', () => {
		const model = buildModel({
			page: {
				config: { title: 'x' },
				incidents: [],
				publicGroupList: [
					{ id: 2, name: 'Second', weight: 2, monitorList: [{ id: 5, name: 'API' }] },
					{ id: 1, name: 'First', weight: 1, monitorList: [{ id: 3, name: 'SET25' }] }
				]
			},
			latest: new Map([[3, { status: 1, ts: now - 30_000, ping: 412.4 }]]),
			days: () => new Map(),
			now,
			fetchedAt: now,
			staleAfterMs: 300_000,
			hosts: { 3: 'set25.mv' },
			pastIncidents: [{ date: '2026-11-12', title: 't', body: 'b' }, { date: '2026-01-01', title: 'old', body: 'b' }]
		});
		expect(model.groups.map((g) => g.name)).toEqual(['First', 'Second']);
		expect(model.groups[0]!.services[0]).toMatchObject({ current: 'up', ping: 412, host: 'set25.mv' });
		expect(model.groups[1]!.services[0]!.current).toBe('unknown');
		expect(model.past.map((p) => p.title)).toEqual(['t']);
	});
});

describe('brands', async () => {
	const { BRANDS, brandCss, pickBrand } = await import('./brands.js');
	it('every brand sets the same CSS variables', () => {
		const keys = Object.keys(BRANDS.ruh!.vars).sort();
		for (const brand of Object.values(BRANDS)) expect(Object.keys(brand.vars).sort()).toEqual(keys);
		expect(brandCss(BRANDS.aircorps!)).toMatch(/^:root\{--font-display:/);
	});
	it('refuses an unknown brand', () => {
		expect(() => pickBrand('nope')).toThrow(/Unknown BRAND/);
		expect(pickBrand('aircorps').kumaSlug).toBe('aircorps');
	});
});

describe('frond', async () => {
	const { frond } = await import('./view.js');
	it('draws one pair of leaflets per day and breaks the down ones', () => {
		const svg = frond(
			[
				{ state: 'up', label: 'a' },
				{ state: 'down', label: 'b <x>' },
				{ state: 'none', label: 'c' }
			],
			'wide'
		);
		expect(svg.match(/<g class="t /g)).toHaveLength(3);
		expect(svg.match(/<line /g)).toHaveLength(6);
		expect(svg).toContain('data-l="b &lt;x&gt;"');
	});
});
