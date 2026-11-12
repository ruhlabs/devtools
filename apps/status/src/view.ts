import type { Current, Model, ServiceView, Tick } from './model.js';
import { formatPercent } from './model.js';
import type { Brand } from './brands.js';
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

/**
 * A palm frond with one pair of leaflets per day, oldest at the stem and today at the tip.
 * A day with downtime is a dried leaflet (amber), a bad day a broken one (red, half length),
 * and a day without checks only a bud.
 */
export function frond(ticks: Tick[], cls: string): string {
	const n = ticks.length;
	const step = 10;
	const pad = 6;
	const height = 100;
	const width = pad * 2 + (n - 1) * step + 22;
	const endX = pad + (n - 1) * step;
	const days = ticks
		.map((tick, i) => {
			const t = n > 1 ? i / (n - 1) : 1;
			const x = pad + i * step;
			const y = 47 + 5 * t * t;
			// Short at the stem, longest in the middle, tapering to the tip.
			const envelope = 0.42 + 0.58 * Math.sin(Math.PI * Math.pow(t, 0.8) * 0.9 + 0.2);
			const length = tick.state === 'none' ? 5 : 50 * envelope * (tick.state === 'down' ? 0.5 : 1);
			// Leaflets sweep toward the tip.
			const dx = length * 0.64;
			const dy = length * 0.77;
			return `<g class="t ${tick.state}" data-l="${esc(tick.label)}"><line x1="${r1(x)}" y1="${r1(y)}" x2="${r1(x + dx)}" y2="${r1(y - dy)}"/><line x1="${r1(x)}" y1="${r1(y)}" x2="${r1(x + dx)}" y2="${r1(y + dy)}"/><rect x="${r1(x - step / 2)}" y="0" width="${step}" height="${height}"/></g>`;
		})
		.join('');
	return `<svg class="${cls}" viewBox="0 0 ${width} ${height}" aria-hidden="true"><path class="rib" d="M${pad - 4} 47 Q${r1((pad + endX) / 2)} 47 ${endX + 14} 53.4"/>${days}</svg>`;
}

function service(s: ServiceView, style: Brand['style']): string {
	const current = CURRENT[s.current];
	const ticks =
		style === 'frond'
			? frond(s.ticks, 'wide') + frond(s.ticks.slice(-30), 'narrow')
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
<link rel="stylesheet" href="/app.css">
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
<script src="/app.js" defer></script>
</body>
</html>`;
}

