import { createHash } from 'node:crypto';

/** Static files, kept in the bundle so the image is one file. */

export const CSS = `
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 var(--font-body)}
a{color:var(--brand);text-decoration-color:color-mix(in srgb,var(--brand) 35%,transparent);text-underline-offset:3px}
a:hover{color:var(--link-hover)}
a:focus-visible{outline:2px solid var(--brand);outline-offset:3px;border-radius:4px}
h1,h2,h3{font-family:var(--font-display);margin:0}
p{margin:0}
.wrap{max-width:880px;margin:0 auto;padding:48px 24px 64px;display:flex;flex-direction:column;gap:32px}
main{display:flex;flex-direction:column;gap:32px}
header{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:14px;text-decoration:none}
.mark{font:800 32px/1 var(--font-display);letter-spacing:-.03em;color:var(--brand)}
.mark span{color:var(--accent)}
.logo{display:block;width:40px;height:40px}
.word{font:700 22px/1 var(--font-display);letter-spacing:-.02em;color:var(--brand)}
.brand .bar{width:1px;height:22px;background:var(--line)}
.what{font:500 18px var(--font-display);color:var(--muted)}
nav{display:flex;gap:20px;font-size:14px;font-weight:500}
.hero{border-radius:20px;padding:32px;display:flex;gap:20px;align-items:center;border:1px solid}
.hero h1{font-weight:600;font-size:32px;letter-spacing:-.02em;line-height:1.15}
.hero p{opacity:.85;margin-top:4px}
.hero-icon{flex:none;width:52px;height:52px;border-radius:999px;display:flex;align-items:center;justify-content:center}
.hero.ok{background:var(--brand);border-color:var(--brand);color:var(--on-brand)}
.hero.ok .hero-icon{background:var(--on-brand);color:var(--brand)}
.hero.down{background:var(--down-hero);border-color:var(--down-hero-line);color:var(--down-hero-text)}
.hero.down .hero-icon{background:var(--down);color:#fff}
.hero.trouble{background:var(--warn-hero);border-color:var(--warn-hero-line);color:var(--warn-hero-text)}
.hero.trouble .hero-icon{background:var(--partial);color:#fff}
.hero.unknown{background:var(--card);border-color:var(--line);color:var(--ink)}
.hero.unknown .hero-icon{background:var(--none);color:var(--text-2)}
.card{border-radius:16px;background:var(--card);border:1px solid var(--line)}
.list{overflow:hidden}
.note{padding:24px;display:flex;flex-direction:column;gap:8px}
.note h2{font-weight:600;font-size:20px;color:var(--brand)}
.note h3{font-weight:600;font-size:18px;color:var(--brand)}
.note p{color:var(--text-2)}
.meta{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:13px;color:var(--muted)}
.pill{font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;border-radius:999px;padding:3px 10px;background:var(--neutral);color:var(--text-2)}
.pill.ok{background:var(--up-bg);color:var(--up-text)}
.pill.warn{background:var(--warn-bg);color:var(--warn-text)}
.group{display:flex;flex-direction:column;gap:12px}
.label{font:600 15px var(--font-display);letter-spacing:.04em;text-transform:uppercase;color:var(--muted)}
.row{padding:20px 24px;display:flex;flex-direction:column;gap:12px}
.row+.row{border-top:1px solid var(--line-soft)}
.head{display:flex;align-items:center;gap:12px}
.dot{flex:none;width:28px;height:28px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:var(--up-bg);color:var(--up-text)}
.dot.down{background:var(--down-bg);color:var(--down)}
.dot.trouble,.dot.maintenance{background:var(--warn-bg);color:var(--warn-text)}
.dot.unknown{background:var(--neutral);color:var(--text-2)}
.name{flex:1 1 auto;min-width:0;display:flex;flex-direction:column}
.name b{font-weight:600;font-size:16px;color:var(--ink)}
.name span{font-size:13px;color:var(--muted);overflow-wrap:anywhere}
.name em{font-style:normal;font-weight:500;color:var(--up-text)}
.name em.down{color:var(--down)}
.name em.trouble,.name em.maintenance{color:var(--warn-text)}
.name em.unknown{color:var(--muted)}
.num{font-variant-numeric:tabular-nums}
.head .num{text-align:right;display:flex;flex-direction:column}
.head .num b{font-weight:600;color:var(--ink)}
.head .num span{font-size:12px;color:var(--muted)}
.head .upt{min-width:72px}
.bars{display:flex;gap:2px;height:32px}
.t{display:block;flex:1 1 0;min-width:0;border-radius:2px;background:var(--none);transition:opacity .12s}
.t.up{background:var(--up)}
.t.partial{background:var(--partial)}
.t.down{background:var(--down)}
.bars:hover .t{opacity:.45}
.bars .t:hover{opacity:1}
.cap{display:flex;justify-content:space-between;gap:12px;font-size:12px;color:var(--muted);min-height:18px}
.cap.on{color:var(--ink);font-weight:500}
.narrow{display:none}
.legend{display:flex;flex-wrap:wrap;gap:8px 20px;font-size:13px;color:var(--muted)}
.legend span{display:flex;align-items:center;gap:8px}
.legend .t{flex:none;width:10px;height:10px}
.muted{font-size:14px;color:var(--muted)}
footer{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding-top:24px;border-top:1px solid var(--line);font-size:13px;color:var(--muted)}
.sig{display:flex;align-items:center;gap:10px;color:var(--brand)}
.sig b{font:700 13px var(--font-display)}
.thaana{font-family:"Noto Sans Thaana",sans-serif;font-weight:500}
@media (max-width:640px){
	.wrap{padding:28px 16px 48px}
	.hero{padding:24px}
	.hero h1{font-size:26px}
	.row{padding:16px}
	.t.o,.head .ping,.wide{display:none}
	.narrow{display:inline}
}
@media (prefers-reduced-motion:reduce){.t{transition:none}}
.stop{display:none}
.host::after{content:" · "}

/* ---- frond style: services drawn as palm fronds, a pair of leaflets per day ---- */
.s-frond .wrap{max-width:1000px;gap:56px}
.s-frond main{gap:56px}
.s-frond .hero{position:relative;overflow:hidden;isolation:isolate;border:0;border-radius:28px;padding:48px;min-height:380px;align-items:flex-end;color:var(--on-brand);background:var(--brand)}
.s-frond .hero.trouble{background:#7A4310}
.s-frond .hero.down{background:#7F1D1D}
.s-frond .hero.unknown{background:#3B4A44}
.s-frond .hero::before{content:"";position:absolute;inset:0;z-index:-1;background:url(/hero.webp?v=1) right top/cover no-repeat;mix-blend-mode:multiply}
.s-frond .hero-icon{display:none}
.s-frond .hero h1{font-weight:700;font-size:clamp(40px,8.2vw,84px);letter-spacing:-.035em;line-height:.98;max-width:9em;text-wrap:balance}
.s-frond .hero p{margin-top:18px;font-size:17px;opacity:.9}
.s-frond .stop{display:inline;color:var(--on-brand)}
.s-frond .hero.ok .stop{color:var(--accent)}
.s-frond .label{font:500 17px var(--font-display);letter-spacing:0;text-transform:none}
.s-frond .group{gap:8px}
.s-frond .card{background:none;border:0;border-radius:0}
.s-frond .list{overflow:visible}
.s-frond .row{padding:28px 0 24px;gap:6px}
.s-frond .row+.row{border-top:1px solid var(--line)}
.s-frond .dot{display:none}
.s-frond .name b{font:600 26px/1.15 var(--font-display);letter-spacing:-.02em;color:var(--brand)}
.s-frond .name>span{font-size:14px;display:flex;flex-wrap:wrap;gap:0 12px;margin-top:2px}
.s-frond .host::after{content:none}
.s-frond .head{align-items:flex-start;gap:28px}
.s-frond .head .num b{font:600 20px/1.3 var(--font-display)}
.s-frond .head .num span{font-size:13px}
.s-frond .bars{display:block;height:auto;margin:6px 0 0 -6px}
.s-frond .frond svg{display:block;width:100%;height:auto;overflow:visible}
.s-frond .frond .narrow{display:none}
.s-frond .rib{fill:none;stroke:var(--brand);stroke-width:1.6;stroke-linecap:round;opacity:.55}
.s-frond .frond .t{display:inline;background:none;transition:opacity .12s}
.s-frond .frond line{stroke:var(--none);stroke-width:3.4;stroke-linecap:round}
.s-frond .frond rect{fill:transparent;pointer-events:all}
.s-frond .frond .up line{stroke:var(--brand)}
.s-frond .frond .partial line{stroke:var(--partial)}
.s-frond .frond .down line{stroke:var(--down)}
.s-frond .frond:hover .t{opacity:.35}
.s-frond .frond .t:hover{opacity:1}
.s-frond .cap{font-size:13px}
.s-frond .legend .t{width:4px;height:16px;border-radius:2px;transform:rotate(25deg);margin:0 3px}
.s-frond .legend .t.up{background:var(--brand)}
.s-frond .legend .t.down{height:9px}
.s-frond .legend .t.none{height:5px}
.s-frond .note{padding:24px 0}
@keyframes unfurl{from{clip-path:inset(-20% 100% -20% 0)}to{clip-path:inset(-20% -5% -20% 0)}}
.s-frond.first .frond svg{animation:unfurl 1.1s cubic-bezier(.2,.7,.2,1) both}
.s-frond.first .row:nth-child(2) .frond svg{animation-delay:.12s}
.s-frond.first .row:nth-child(3) .frond svg{animation-delay:.24s}
.s-frond.first .group+.group .frond svg{animation-delay:.36s}
@media (max-width:640px){
	.s-frond .wrap,.s-frond main{gap:40px}
	.s-frond .hero{padding:28px 24px;min-height:300px;border-radius:22px}
	.s-frond .hero::before{opacity:.7}
	.s-frond .hero h1{font-size:44px}
	.s-frond .name b{font-size:22px}
	.s-frond .frond .wide{display:none}
	.s-frond .frond .narrow{display:block}
}
@media (prefers-reduced-motion:reduce){.s-frond.first .frond svg{animation:none}}
`;

/** Day labels on hover or tap, and a quiet refresh every minute. */
export const JS = `(() => {
	function bind(root) {
		root.querySelectorAll('.bars').forEach((bars) => {
			const cap = bars.nextElementSibling;
			const idle = cap.innerHTML;
			const show = (event) => {
				const tick = event.target.closest('.t');
				if (!tick) return;
				cap.classList.add('on');
				cap.textContent = tick.dataset.l;
			};
			bars.addEventListener('pointerover', show);
			bars.addEventListener('pointerdown', show);
			bars.addEventListener('pointerleave', () => {
				cap.classList.remove('on');
				cap.innerHTML = idle;
			});
		});
	}
	bind(document);
	setTimeout(() => document.body.classList.remove('first'), 2500);
	setInterval(async () => {
		if (document.visibilityState !== 'visible') return;
		try {
			const response = await fetch('/?fragment=1', { cache: 'no-store' });
			if (!response.ok) return;
			const main = document.querySelector('main');
			main.innerHTML = await response.text();
			bind(main);
			const title = main.querySelector('.hero h1');
			const brand = document.body.dataset.title;
			if (title) document.title = main.querySelector('.hero.ok') ? brand : title.textContent + ' · ' + brand;
		} catch {}
	}, 60000);
})();
`;

export const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0B4D3B"/><path d="M20 48V24m0 8c0-6 5-9 12-9" fill="none" stroke="#F6F1E6" stroke-width="8" stroke-linecap="round"/><circle cx="44" cy="44" r="5" fill="#D39A3A"/></svg>`;

/** Changes whenever the stylesheet or script does. It goes in their URLs so browsers never pair new HTML with old cached files. */
export const ASSET_VERSION = createHash('sha256').update(CSS).update(JS).digest('hex').slice(0, 10);
