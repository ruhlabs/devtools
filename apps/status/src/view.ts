import type { Current, Model, ServiceView, Tick } from './model.js';
import { formatPercent } from './model.js';
import type { Brand } from './brands.js';
import { ASSET_VERSION } from './assets.js';
import { parseKumaTime } from './kuma.js';
import { formatClock, formatIsoDay } from './time.js';

const esc = (value: unknown): string =>
	String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const ICON = {
	check: '<path d="M20 6 9 17l-5-5"/>',
	cross: '<path d="M18 6 6 18M6 6l12 12"/>',
	alert: '<path d="M12 7v6M12 17h.01"/>',
	wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
	question: '<path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4M12 17h.01"/>'
};
const svg = (paths: string, size: number, width = 2.5) =>
	`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

const CURRENT: Record<Current, { label: string; icon: string }> = {
	up: { label: 'Operational', icon: ICON.check },
	trouble: { label: 'Having trouble', icon: ICON.alert },
	down: { label: 'Down', icon: ICON.cross },
	maintenance: { label: 'Maintenance', icon: ICON.wrench },
	unknown: { label: 'No data yet', icon: ICON.question }
};

const r1 = (n: number): string => (Math.round(n * 10) / 10).toString();

/** A steady pseudo-random number in 0..1 for a leaflet, so a frond looks the same on every refresh. */
const noise = (i: number, seed: number): number => {
	const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
	return x - Math.floor(x);
};

/**
 * A palm frond with one pair of leaflets per day, oldest at the stem and today at the tip.
 * A day with downtime is a dried leaflet (amber), a bad day a broken one (red, half length),
 * and a day without checks a pale one.
 *
 * Shaped like a real frond: a bare stalk, long thin leaflets that sweep toward the tip, widest
 * a third of the way along and shrinking to a point. `seed` gives each service its own frond
 * (arch, length, where it is widest, how the leaflets sweep), the same on every refresh.
 */
export function frond(ticks: Tick[], cls: string, seed = 1): string {
	const n = ticks.length;
	const step = 10;
	const stalk = n > 45 ? 38 : 22;
	const pad = 6;
	const height = 132;
	const width = pad + stalk + (n - 1) * step + 30;
	// This frond's own character.
	const f = (k: number) => noise(1000 + k, seed);
	const arch = 5 + 17 * f(1);
	const archPower = 0.7 + 0.6 * f(2);
	const reach = 52 * (0.86 + 0.24 * f(3));
	const peak = 0.2 + 0.2 * f(4);
	const baseAngle = 44 + 12 * f(5);
	const tipAngle = 17 + 8 * f(6);
	const baseY = 66 + arch * 0.45;
	const ribY = (t: number) => baseY - arch * Math.sin(Math.PI * Math.pow(Math.max(t, 0), archPower) * 0.85);
	const rib: string[] = [];
	const days = ticks
		.map((tick, i) => {
			const t = n > 1 ? i / (n - 1) : 1;
			const x = pad + stalk + i * step;
			const y = ribY(t);
			rib.push(`${r1(x)} ${r1(y)}`);
			// Longest a third of the way along, then smaller and smaller to the tip.
			const envelope = t < peak ? 0.6 + 0.4 * Math.sin((t / peak) * (Math.PI / 2)) : 0.3 + 0.7 * Math.pow((1 - t) / (1 - peak), 0.85);
			const blade = (side: 1 | -1): string => {
				const k = i * 2 + (side === 1 ? 0 : 1);
				// Mostly even, with the odd short or stray leaflet.
				const stray = noise(k, seed + 29) > 0.9 ? 0.72 : 1;
				const length = reach * envelope * (0.88 + 0.22 * noise(k, seed)) * stray * (tick.state === 'down' ? 0.5 : 1);
				// Leaflets lie closer to the stem toward the tip.
				const angle = ((baseAngle + (tipAngle - baseAngle) * t + 9 * (noise(k, seed + 7) - 0.5)) * Math.PI) / 180;
				const dx = length * Math.cos(angle);
				const dy = length * Math.sin(angle);
				const sag = length * (0.02 + 0.07 * noise(k, seed + 13));
				const tipX = x + dx;
				const tipY = y - side * dy + sag;
				// A slight outward bow.
				const bow = length * (0.04 + 0.05 * noise(k, seed + 17));
				const cx = x + dx * 0.5 - bow * Math.sin(angle);
				const cy = y - side * (dy * 0.5 + bow * Math.cos(angle));
				const w = 1.5;
				return `<path d="M${r1(x - w)} ${r1(y)}Q${r1(cx - w * 0.5)} ${r1(cy - side * w * 0.5)} ${r1(tipX)} ${r1(tipY)}Q${r1(cx + w)} ${r1(cy + side * w)} ${r1(x + w)} ${r1(y)}Z"/>`;
			};
			return `<g class="t ${tick.state}" data-l="${esc(tick.label)}">${blade(1)}${blade(-1)}<rect x="${r1(x - step / 2)}" y="0" width="${step}" height="${height}"/></g>`;
		})
		.join('');
	const endX = pad + stalk + (n - 1) * step;
	const stalkPath = `M${pad} ${r1(ribY(0) + 2.5)}L${rib.join('L')}L${endX + 9} ${r1(ribY(1) + 1.5)}`;
	return `<svg class="${cls}" viewBox="0 0 ${width} ${height}" aria-hidden="true"><path class="rib" pathLength="1" d="${stalkPath}"/><path class="stalk" d="M${pad} ${r1(ribY(0) + 2.5)}L${rib[0]}"/>${days}</svg>`;
}

function service(s: ServiceView, style: Brand['style']): string {
	const current = CURRENT[s.current];
	const ticks =
		style === 'frond'
			? frond(s.ticks, 'wide', s.id) + frond(s.ticks.slice(-30), 'narrow', s.id)
			: s.ticks.map((t, i) => `<i class="t ${t.state}${i < s.ticks.length - 30 ? ' o' : ''}" data-l="${esc(t.label)}"></i>`).join('');
	const uptime = s.uptime === null ? '—' : formatPercent(s.uptime);
	return `<div class="row">
	<div class="head">
		<span class="dot ${s.current}">${svg(current.icon, 16, 3)}</span>
		<div class="name"><b>${esc(s.name)}</b><span>${s.host ? `<span class="host">${esc(s.host)}</span>` : ''}<em class="${s.current}">${current.label}</em></span></div>
		<div class="num ping"><b>${s.ping === null ? '—' : `${s.ping} ms`}</b><span>response</span></div>
		<div class="num upt"><b>${uptime}</b><span>uptime</span></div>
	</div>
	<div class="bars${style === 'frond' ? ' frond' : ''}" role="img" aria-label="${esc(`${s.name}: ${uptime} uptime over the last 90 days`)}">${ticks}</div>
	<div class="cap num"><span><span class="wide">90 days ago</span><span class="narrow">30 days ago</span></span><span>Today</span></div>
</div>`;
}

function paragraphs(text: string): string {
	return text
		.split(/\n\s*\n/)
		.map((p) => p.trim())
		.filter(Boolean)
		.map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
		.join('');
}

/** The part of the page that refreshes itself every minute. */
export function renderMain(model: Model, brand: Brand): string {
	const o = model.overall;
	const heroIcon = { ok: ICON.check, trouble: ICON.alert, down: ICON.cross, unknown: ICON.question }[o.state];

	const live = [
		...model.incidents.map(
			(i) => `<section class="card note">
	<div class="meta"><span class="pill warn">Update</span><span>Posted ${esc(formatClock(parseKumaTime(i.lastUpdatedDate || i.createdDate)))} MVT</span></div>
	<h2>${esc(i.title)}</h2>${paragraphs(i.content ?? '')}
</section>`
		),
		...model.maintenance.map(
			(m) => `<section class="card note">
	<div class="meta"><span class="pill">Maintenance</span></div>
	<h2>${esc(m.title)}</h2>${paragraphs(m.description ?? '')}
</section>`
		)
	].join('');

	const groups = model.groups
		.map((g) => `<section class="group"><h2 class="label">${esc(g.name)}</h2><div class="card list">${g.services.map((s) => service(s, brand.style)).join('')}</div></section>`)
		.join('');

	const past = model.past
		.map(
			(i) => `<div class="card note">
	<div class="meta"><span class="pill ok">Resolved</span><span>${esc(formatIsoDay(i.date))}${i.duration ? ` · ${esc(i.duration)}` : ''}</span></div>
	<h3>${esc(i.title)}</h3><p>${esc(i.body)}</p>
</div>`
		)
		.join('');

	const title = o.state === 'ok' && brand.okTitle ? brand.okTitle : o.title;
	return `<section class="hero ${o.state}">
	<span class="hero-icon">${svg(heroIcon, 26)}</span>
	<div><h1>${esc(title)}<span class="stop" aria-hidden="true">.</span></h1><p>${esc(o.sub)}</p></div>
</section>
${live}
${groups}
<div class="legend">
	<span><i class="t up"></i>${brand.style === 'frond' ? 'Healthy day' : 'No downtime'}</span><span><i class="t partial"></i>Some downtime</span><span><i class="t down"></i>Major downtime</span><span><i class="t none"></i>Not monitored yet</span>
</div>
<section id="incidents" class="group">
	<h2 class="label">Past incidents</h2>
	${past}
	<p class="muted">${model.past.length ? 'No other incidents in the last 90 days.' : 'No incidents in the last 90 days.'}</p>
</section>`;
}

export function renderPage(model: Model, brand: Brand, rssUrl: string): string {
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(model.overall.state === 'ok' ? brand.title : `${model.overall.title} · ${brand.title}`)}</title>
<meta name="description" content="${esc(brand.description)}">
<meta name="theme-color" content="${esc(brand.vars.bg ?? '#ffffff')}">
<link rel="icon" href="${esc(brand.favicon.href)}" type="${esc(brand.favicon.type)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${esc(brand.fontsHref)}">
<link rel="stylesheet" href="/app.css?v=${ASSET_VERSION}">
</head>
<body class="s-${brand.style} first" data-title="${esc(brand.title)}">
<div class="wrap">
<header>
	<a class="brand" href="/" aria-label="${esc(brand.title)}">${brand.headerHtml}</a>
	<nav><a href="#incidents">Past incidents</a><a href="${esc(rssUrl)}">RSS feed</a></nav>
</header>
<main>
${renderMain(model, brand)}
</main>
<footer>
	<span>Checked every minute from our servers. Times are Maldives time.</span>
	${brand.footerHtml}
</footer>
</div>
<script src="/app.js?v=${ASSET_VERSION}" defer></script>
</body>
</html>`;
}

