/**
 * The private analytics dashboard served at /stats. Self-contained: no
 * external scripts or fonts. It asks for the STATS_TOKEN once, keeps it in
 * localStorage, and reads /stats/data.
 */
export const statsPage = /* html */ `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>API stats · Ruh Labs</title>
<style>
	.viz-root {
		color-scheme: light;
		--page: #f9f9f7;
		--surface-1: #fcfcfb;
		--text-primary: #0b0b0b;
		--text-secondary: #52514e;
		--muted: #898781;
		--grid: #e1e0d9;
		--axis: #c3c2b7;
		--border: rgba(11, 11, 11, 0.1);
		--series-1: #2a78d6;
		--series-1-soft: #cde2fb;
		--critical: #d03b3b;
		--good-text: #006300;
	}
	@media (prefers-color-scheme: dark) {
		.viz-root {
			color-scheme: dark;
			--page: #0d0d0d;
			--surface-1: #1a1a19;
			--text-primary: #f0efec;
			--text-secondary: #c3c2b7;
			--muted: #898781;
			--grid: #2c2c2a;
			--axis: #383835;
			--border: rgba(255, 255, 255, 0.1);
			--series-1: #3987e5;
			--series-1-soft: #184f95;
			--critical: #d03b3b;
			--good-text: #0ca30c;
		}
	}
	* { box-sizing: border-box; }
	body { margin: 0; }
	.viz-root {
		min-height: 100vh;
		background: var(--page);
		color: var(--text-primary);
		font: 14px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif;
		padding: 32px 24px 64px;
	}
	main { max-width: 1080px; margin: 0 auto; display: grid; gap: 20px; }
	header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
	h1 { font-size: 20px; margin: 0; font-weight: 650; }
	h1 small { color: var(--muted); font-weight: 400; font-size: 14px; margin-left: 8px; }
	h2 { font-size: 14px; margin: 0 0 12px; font-weight: 600; }
	.card { background: var(--surface-1); border: 1px solid var(--border); border-radius: 12px; padding: 18px 20px; }
	.segmented { display: inline-flex; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; background: var(--surface-1); }
	.segmented button {
		border: 0; background: none; color: var(--text-secondary); font: inherit; padding: 6px 12px; cursor: pointer;
	}
	.segmented button[aria-pressed="true"] { background: var(--text-primary); color: var(--surface-1); }
	.tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
	.tile .label { color: var(--text-secondary); font-size: 13px; }
	.tile .value { font-size: 28px; font-weight: 650; font-variant-numeric: tabular-nums; margin-top: 4px; }
	.tile .sub { color: var(--muted); font-size: 12px; margin-top: 2px; }
	.chart { position: relative; }
	.chart svg { display: block; width: 100%; height: 220px; overflow: visible; }
	.chart .tick { fill: var(--muted); font-size: 11px; font-variant-numeric: tabular-nums; }
	.chart .gridline { stroke: var(--grid); stroke-width: 1; }
	.chart .baseline { stroke: var(--axis); stroke-width: 1; }
	.chart .bar { fill: var(--series-1); pointer-events: none; }
	.chart .hit { fill: transparent; }
	.chart .bar.active { opacity: 0.75; }
	.tooltip {
		position: absolute; pointer-events: none; background: var(--surface-1); border: 1px solid var(--border);
		border-radius: 8px; padding: 8px 10px; font-size: 12px; box-shadow: 0 4px 16px rgba(0,0,0,.12);
		white-space: nowrap; transform: translate(-50%, calc(-100% - 10px)); display: none;
	}
	.tooltip strong { display: block; font-weight: 600; margin-bottom: 2px; }
	.tooltip span { color: var(--text-secondary); }
	table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
	th { text-align: left; color: var(--muted); font-weight: 500; font-size: 12px; padding: 0 8px 8px; border-bottom: 1px solid var(--grid); }
	td { padding: 9px 8px; border-bottom: 1px solid var(--grid); vertical-align: middle; }
	tr:last-child td { border-bottom: 0; }
	th.num, td.num { text-align: right; }
	.route { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; }
	.method { color: var(--muted); font-size: 11px; margin-right: 6px; }
	.share { display: flex; align-items: center; gap: 8px; min-width: 140px; }
	.share .track { flex: 1; height: 6px; border-radius: 3px; background: var(--grid); overflow: hidden; }
	.share .fill { height: 100%; border-radius: 3px; background: var(--series-1); }
	.share .pct { width: 42px; text-align: right; color: var(--text-secondary); font-size: 12px; }
	.err { color: var(--critical); }
	.muted { color: var(--muted); }
	.grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; }
	.empty { color: var(--muted); padding: 24px 0; text-align: center; }
	form.login { max-width: 360px; margin: 15vh auto 0; display: grid; gap: 10px; }
	form.login input {
		font: inherit; padding: 9px 12px; border-radius: 8px; border: 1px solid var(--border);
		background: var(--surface-1); color: var(--text-primary);
	}
	form.login button, .link-btn {
		font: inherit; padding: 9px 12px; border-radius: 8px; border: 0; background: var(--text-primary);
		color: var(--surface-1); cursor: pointer;
	}
	.link-btn { background: none; color: var(--muted); padding: 0; text-decoration: underline; }
	.error-msg { color: var(--critical); font-size: 13px; min-height: 1em; }
	.footer { color: var(--muted); font-size: 12px; display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
</style>
</head>
<body>
<div class="viz-root" id="root"></div>
<script>
(() => {
	const root = document.getElementById('root');
	const KEY = 'ruh-api-stats-token';
	const store = {
		get() { try { return localStorage.getItem(KEY); } catch { return null; } },
		set(v) { try { localStorage.setItem(KEY, v); } catch {} },
		clear() { try { localStorage.removeItem(KEY); } catch {} }
	};
	let token = store.get();
	let range = '7d';

	const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
	const fmt = (n) => Number(n || 0).toLocaleString('en-US');
	const ms = (n) => (n == null ? '–' : n < 10 ? n.toFixed(1) + ' ms' : Math.round(n) + ' ms');
	const pct = (part, whole) => (whole ? (part / whole) * 100 : 0);
	const pctText = (p) => (p === 0 ? '0%' : p < 0.1 ? '<0.1%' : p < 10 ? p.toFixed(1) + '%' : Math.round(p) + '%');

	function login(message = '') {
		root.innerHTML = \`
			<form class="login">
				<h1>API stats</h1>
				<p class="muted" style="margin:0">Enter the stats token (the <code>STATS_TOKEN</code> set in Dokploy).</p>
				<input type="password" name="token" placeholder="Token" autocomplete="current-password" required autofocus />
				<button type="submit">Open dashboard</button>
				<div class="error-msg">\${esc(message)}</div>
			</form>\`;
		root.querySelector('form').addEventListener('submit', (e) => {
			e.preventDefault();
			token = new FormData(e.target).get('token');
			store.set(token);
			load();
		});
	}

	async function load() {
		if (!token) return login();
		let res;
		try {
			res = await fetch('/stats/data?range=' + range, { headers: { Authorization: 'Bearer ' + token } });
		} catch {
			return renderError('Could not reach the API.');
		}
		if (res.status === 401) {
			store.clear();
			token = null;
			return login('That token is not right.');
		}
		if (!res.ok) return renderError('The API returned ' + res.status + '.');
		render(await res.json());
	}

	function renderError(message) {
		root.innerHTML = '<main><div class="card empty">' + esc(message) + '</div></main>';
	}

	function axisLabel(t, bucket) {
		// Buckets are aligned to Maldives time (UTC+5).
		const d = new Date(t + 5 * 3600e3);
		if (bucket === 'hour') return String(d.getUTCHours()).padStart(2, '0') + ':00';
		return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
	}

	function niceMax(v) {
		if (v <= 4) return 4;
		const p = Math.pow(10, Math.floor(Math.log10(v)));
		const n = v / p;
		return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
	}

	function chart(series, bucket) {
		const W = 1000, H = 220, L = 40, R = 8, T = 8, B = 26;
		const max = niceMax(Math.max(...series.map((s) => s.requests), 0));
		const iw = W - L - R, ih = H - T - B;
		const step = iw / series.length;
		const gap = Math.min(2 + step * 0.25, 12);
		const bw = Math.max(step - gap, 1);
		const y = (v) => T + ih - (v / max) * ih;
		let out = '';
		for (let i = 0; i <= 4; i++) {
			const v = (max / 4) * i, yy = y(v);
			out += '<line class="gridline" x1="' + L + '" x2="' + (W - R) + '" y1="' + yy + '" y2="' + yy + '"/>';
			out += '<text class="tick" x="' + (L - 8) + '" y="' + (yy + 4) + '" text-anchor="end">' + fmt(v) + '</text>';
		}
		const every = Math.ceil(series.length / 8);
		series.forEach((s, i) => {
			const x = L + i * step + gap / 2;
			const h = (s.requests / max) * ih;
			// Bar with rounded top only (4px), anchored to the baseline.
			const r = Math.min(4, bw / 2, h);
			const top = T + ih - h;
			const path = h <= 0 ? '' :
				'M' + x + ',' + (T + ih) + 'V' + (top + r) + 'Q' + x + ',' + top + ' ' + (x + r) + ',' + top +
				'H' + (x + bw - r) + 'Q' + (x + bw) + ',' + top + ' ' + (x + bw) + ',' + (top + r) + 'V' + (T + ih) + 'Z';
			out += '<rect class="hit" data-i="' + i + '" x="' + (L + i * step) + '" y="' + T + '" width="' + step + '" height="' + ih + '"/>';
			if (path) out += '<path class="bar" data-i="' + i + '" d="' + path + '"/>';
			if (i % every === 0) {
				out += '<text class="tick" x="' + (x + bw / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(axisLabel(s.t, bucket)) + '</text>';
			}
		});
		out += '<line class="baseline" x1="' + L + '" x2="' + (W - R) + '" y1="' + (T + ih) + '" y2="' + (T + ih) + '"/>';
		return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="Requests per ' + bucket + '">' + out + '</svg>';
	}

	function render(d) {
		const t = d.totals;
		const busiest = d.routes[0];
		const ranges = ['24h', '7d', '30d', '90d'];
		const routesRows = d.routes.length ? d.routes.map((r) => {
			const share = pct(r.requests, t.requests);
			const errs = r.clientErrors + r.serverErrors;
			return '<tr>' +
				'<td><span class="method">' + esc(r.method) + '</span><span class="route">' + esc(r.route) + '</span></td>' +
				'<td class="num">' + fmt(r.requests) + '</td>' +
				'<td><div class="share"><div class="track"><div class="fill" style="width:' + share + '%"></div></div><span class="pct">' + pctText(share) + '</span></div></td>' +
				'<td class="num">' + fmt(r.visitors) + '</td>' +
				'<td class="num">' + ms(r.p50) + '</td>' +
				'<td class="num">' + ms(r.p95) + '</td>' +
				'<td class="num' + (r.serverErrors ? ' err' : '') + '">' + (errs ? fmt(errs) + (r.serverErrors ? ' (' + fmt(r.serverErrors) + ' 5xx)' : '') : '<span class="muted">0</span>') + '</td>' +
			'</tr>';
		}).join('') : '<tr><td colspan="7" class="empty">No requests in this period yet.</td></tr>';

		const statusRows = d.statuses.map((s) =>
			'<tr><td>' + esc(s.status) + '</td><td class="num">' + fmt(s.requests) + '</td><td class="num muted">' + pctText(pct(s.requests, t.requests)) + '</td></tr>'
		).join('') || '<tr><td colspan="3" class="empty">Nothing yet.</td></tr>';

		const nfRows = d.notFound.map((n) =>
			'<tr><td class="route">' + esc(n.path) + '</td><td class="num">' + fmt(n.requests) + '</td></tr>'
		).join('') || '<tr><td colspan="2" class="empty">None. Everyone found what they were looking for.</td></tr>';

		root.innerHTML = \`
		<main>
			<header>
				<h1>API stats<small>api.oreotm.xyz</small></h1>
				<div class="segmented" role="group" aria-label="Time range">
					\${ranges.map((r) => '<button type="button" data-range="' + r + '" aria-pressed="' + (r === d.range) + '">' + r + '</button>').join('')}
				</div>
			</header>

			<section class="tiles">
				<div class="card tile"><div class="label">Requests</div><div class="value">\${fmt(t.requests)}</div>
					<div class="sub">\${busiest ? 'Busiest: ' + esc(busiest.route) : 'No traffic yet'}</div></div>
				<div class="card tile"><div class="label">Visitors</div><div class="value">\${fmt(t.visitors)}</div>
					<div class="sub">\${pctText(pct(t.browser, t.requests))} of requests from browsers</div></div>
				<div class="card tile"><div class="label">Server errors (5xx)</div><div class="value\${t.serverErrors ? ' err' : ''}">\${pctText(pct(t.serverErrors, t.requests))}</div>
					<div class="sub">\${fmt(t.clientErrors)} client errors (4xx)</div></div>
				<div class="card tile"><div class="label">Response time (p95)</div><div class="value">\${ms(t.p95)}</div>
					<div class="sub">Median \${ms(t.p50)}</div></div>
			</section>

			<section class="card">
				<h2>Requests per \${d.bucket}</h2>
				<div class="chart">\${chart(d.series, d.bucket)}<div class="tooltip"></div></div>
			</section>

			<section class="card">
				<h2>Routes</h2>
				<div style="overflow-x:auto">
				<table>
					<thead><tr><th>Route</th><th class="num">Requests</th><th>Share</th><th class="num">Visitors</th><th class="num">p50</th><th class="num">p95</th><th class="num">Errors</th></tr></thead>
					<tbody>\${routesRows}</tbody>
				</table>
				</div>
			</section>

			<div class="grid-2">
				<section class="card">
					<h2>Status codes</h2>
					<table><thead><tr><th>Status</th><th class="num">Requests</th><th class="num">Share</th></tr></thead><tbody>\${statusRows}</tbody></table>
				</section>
				<section class="card">
					<h2>Paths that didn't exist</h2>
					<table><thead><tr><th>Path</th><th class="num">Requests</th></tr></thead><tbody>\${nfRows}</tbody></table>
				</section>
			</div>

			<div class="footer">
				<span>Health checks aren't counted. Visitors are counted per day from a hashed IP and browser; IPs aren't stored. Data is kept for 90 days.</span>
				<button class="link-btn" type="button" id="logout">Sign out</button>
			</div>
		</main>\`;

		root.querySelectorAll('[data-range]').forEach((b) => b.addEventListener('click', () => { range = b.dataset.range; load(); }));
		root.querySelector('#logout').addEventListener('click', () => { store.clear(); token = null; login(); });

		// Tooltip on hover: the hit target spans the full column, wider than the bar.
		const wrap = root.querySelector('.chart');
		const tip = wrap.querySelector('.tooltip');
		const svg = wrap.querySelector('svg');
		wrap.querySelectorAll('.hit').forEach((hit) => {
			const i = Number(hit.dataset.i);
			const s = d.series[i];
			const bar = wrap.querySelector('.bar[data-i="' + i + '"]');
			hit.addEventListener('mouseenter', () => {
				bar?.classList.add('active');
				const label = d.bucket === 'hour' ? axisLabel(s.t, 'hour') + ', ' + axisLabel(s.t, 'day') : axisLabel(s.t, 'day');
				tip.innerHTML = '<strong>' + fmt(s.requests) + ' requests</strong><span>' + esc(label) + ' · ' + fmt(s.visitors) + ' visitors' + (s.errors ? ' · ' + fmt(s.errors) + ' errors' : '') + '</span>';
				const box = hit.getBoundingClientRect(), outer = wrap.getBoundingClientRect();
				const svgBox = svg.getBoundingClientRect();
				const barTop = bar ? bar.getBoundingClientRect().top : svgBox.bottom - 26;
				tip.style.left = Math.min(Math.max(box.left + box.width / 2 - outer.left, 80), outer.width - 80) + 'px';
				tip.style.top = (barTop - outer.top) + 'px';
				tip.style.display = 'block';
			});
			hit.addEventListener('mouseleave', () => { bar?.classList.remove('active'); tip.style.display = 'none'; });
		});
	}

	load();
})();
</script>
</body>
</html>`;
