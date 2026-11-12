import type { Current, Model, ServiceView } from './model.js';
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

function service(s: ServiceView): string {
	const current = CURRENT[s.current];
	const ticks = s.ticks
		.map((t, i) => `<i class="t ${t.state}${i < s.ticks.length - 30 ? ' o' : ''}" data-l="${esc(t.label)}"></i>`)
		.join('');
	const uptime = s.uptime === null ? '—' : formatPercent(s.uptime);
	return `<div class="row">
	<div class="head">
		<span class="dot ${s.current}">${svg(current.icon, 16, 3)}</span>
		<div class="name"><b>${esc(s.name)}</b><span>${s.host ? `${esc(s.host)} · ` : ''}<em class="${s.current}">${current.label}</em></span></div>
		<div class="num ping"><b>${s.ping === null ? '—' : `${s.ping} ms`}</b><span>response</span></div>
		<div class="num upt"><b>${uptime}</b><span>uptime</span></div>
	</div>
	<div class="bars" role="img" aria-label="${esc(`${s.name}: ${uptime} uptime over the last 90 days`)}">${ticks}</div>
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
export function renderMain(model: Model): string {
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
		.map((g) => `<section class="group"><h2 class="label">${esc(g.name)}</h2><div class="card list">${g.services.map(service).join('')}</div></section>`)
		.join('');

	const past = model.past
		.map(
			(i) => `<div class="card note">
	<div class="meta"><span class="pill ok">Resolved</span><span>${esc(formatIsoDay(i.date))}${i.duration ? ` · ${esc(i.duration)}` : ''}</span></div>
	<h3>${esc(i.title)}</h3><p>${esc(i.body)}</p>
</div>`
		)
		.join('');

	return `<section class="hero ${o.state}">
	<span class="hero-icon">${svg(heroIcon, 26)}</span>
	<div><h1>${esc(o.title)}</h1><p>${esc(o.sub)}</p></div>
</section>
${live}
${groups}
<div class="legend">
	<span><i class="t up"></i>No downtime</span><span><i class="t partial"></i>Some downtime</span><span><i class="t down"></i>Major downtime</span><span><i class="t none"></i>Not monitored yet</span>
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
<body data-title="${esc(brand.title)}">
<div class="wrap">
<header>
	<a class="brand" href="/" aria-label="${esc(brand.title)}">${brand.headerHtml}</a>
	<nav><a href="#incidents">Past incidents</a><a href="${esc(rssUrl)}">RSS feed</a></nav>
</header>
<main>
${renderMain(model)}
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

