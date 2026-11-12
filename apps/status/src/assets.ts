/** Static files, kept in the bundle so the image is one file. */

export const CSS = `
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:#F6F1E6;color:#1F2A26;font:15px/1.5 Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
a{color:#0B4D3B;text-decoration-color:rgba(11,77,59,.35);text-underline-offset:3px}
a:hover{color:#2E7E6B}
a:focus-visible{outline:2px solid #2E7E6B;outline-offset:3px;border-radius:4px}
h1,h2,h3{font-family:Outfit,Inter,sans-serif;margin:0}
p{margin:0}
.wrap{max-width:880px;margin:0 auto;padding:48px 24px 64px;display:flex;flex-direction:column;gap:32px}
main{display:flex;flex-direction:column;gap:32px}
header{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:14px;text-decoration:none}
.mark{font:800 32px/1 Outfit,sans-serif;letter-spacing:-.03em;color:#0B4D3B}
.mark span{color:#D39A3A}
.brand .bar{width:1px;height:22px;background:rgba(11,77,59,.2)}
.what{font:500 18px Outfit,sans-serif;color:#5B6B64}
nav{display:flex;gap:20px;font-size:14px;font-weight:500}
.hero{border-radius:20px;padding:32px;display:flex;gap:20px;align-items:center;border:1px solid}
.hero h1{font-weight:600;font-size:32px;letter-spacing:-.02em;line-height:1.15}
.hero p{opacity:.85;margin-top:4px}
.hero-icon{flex:none;width:52px;height:52px;border-radius:999px;display:flex;align-items:center;justify-content:center}
.hero.ok{background:#0B4D3B;border-color:#0B4D3B;color:#F6F1E6}
.hero.ok .hero-icon{background:#F6F1E6;color:#0B4D3B}
.hero.down{background:#FBECEC;border-color:#F0CACA;color:#7F1D1D}
.hero.down .hero-icon{background:#991B1B;color:#fff}
.hero.trouble{background:#FCF0E6;border-color:#F2D2B8;color:#7C2D12}
.hero.trouble .hero-icon{background:#C2410C;color:#fff}
.hero.unknown{background:#FFFDF8;border-color:rgba(11,77,59,.12);color:#14231D}
.hero.unknown .hero-icon{background:#E6E0D2;color:#3B4A44}
.card{border-radius:16px;background:#FFFDF8;border:1px solid rgba(11,77,59,.12)}
.list{overflow:hidden}
.note{padding:24px;display:flex;flex-direction:column;gap:8px}
.note h2{font-weight:600;font-size:20px;color:#0B4D3B}
.note h3{font-weight:600;font-size:18px;color:#0B4D3B}
.note p{color:#3B4A44}
.meta{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:13px;color:#5B6B64}
.pill{font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;border-radius:999px;padding:3px 10px;background:#ECE6D8;color:#3B4A44}
.pill.ok{background:#E3EFE9;color:#0B4D3B}
.pill.warn{background:#FCEBDD;color:#9A3412}
.group{display:flex;flex-direction:column;gap:12px}
.label{font:600 15px Outfit,sans-serif;letter-spacing:.04em;text-transform:uppercase;color:#5B6B64}
.row{padding:20px 24px;display:flex;flex-direction:column;gap:12px}
.row+.row{border-top:1px solid rgba(11,77,59,.1)}
.head{display:flex;align-items:center;gap:12px}
.dot{flex:none;width:28px;height:28px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:#E3EFE9;color:#0B4D3B}
.dot.down{background:#F7E1E1;color:#991B1B}
.dot.trouble,.dot.maintenance{background:#FCEBDD;color:#9A3412}
.dot.unknown{background:#ECE6D8;color:#3B4A44}
.name{flex:1 1 auto;min-width:0;display:flex;flex-direction:column}
.name b{font-weight:600;font-size:16px;color:#14231D}
.name span{font-size:13px;color:#5B6B64;overflow-wrap:anywhere}
.name em{font-style:normal;font-weight:500;color:#1F6B59}
.name em.down{color:#991B1B}
.name em.trouble,.name em.maintenance{color:#9A3412}
.name em.unknown{color:#5B6B64}
.num{font-variant-numeric:tabular-nums}
.head .num{text-align:right;display:flex;flex-direction:column}
.head .num b{font-weight:600;color:#14231D}
.head .num span{font-size:12px;color:#5B6B64}
.head .upt{min-width:72px}
.bars{display:flex;gap:2px;height:32px}
.t{display:block;flex:1 1 0;min-width:0;border-radius:2px;background:#E6E0D2;transition:opacity .12s}
.t.up{background:#2E7E6B}
.t.partial{background:#C2410C}
.t.down{background:#991B1B}
.bars:hover .t{opacity:.45}
.bars .t:hover{opacity:1}
.cap{display:flex;justify-content:space-between;gap:12px;font-size:12px;color:#5B6B64;min-height:18px}
.cap.on{color:#14231D;font-weight:500}
.narrow{display:none}
.legend{display:flex;flex-wrap:wrap;gap:8px 20px;font-size:13px;color:#5B6B64}
.legend span{display:flex;align-items:center;gap:8px}
.legend .t{flex:none;width:10px;height:10px}
.muted{font-size:14px;color:#5B6B64}
footer{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding-top:24px;border-top:1px solid rgba(11,77,59,.12);font-size:13px;color:#5B6B64}
.sig{display:flex;align-items:center;gap:10px;color:#0B4D3B}
.sig b{font:700 13px Outfit,sans-serif}
.sig [lang=dv]{font-family:"Noto Sans Thaana",sans-serif;font-weight:500}
@media (max-width:640px){
	.wrap{padding:28px 16px 48px}
	.hero{padding:24px}
	.hero h1{font-size:26px}
	.row{padding:16px}
	.t.o,.head .ping,.wide{display:none}
	.narrow{display:inline}
}
@media (prefers-reduced-motion:reduce){.t{transition:none}}
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
	setInterval(async () => {
		if (document.visibilityState !== 'visible') return;
		try {
			const response = await fetch('/?fragment=1', { cache: 'no-store' });
			if (!response.ok) return;
			const main = document.querySelector('main');
			main.innerHTML = await response.text();
			bind(main);
			const title = main.querySelector('.hero h1');
			if (title) document.title = main.querySelector('.hero.ok') ? 'Ruh Labs status' : title.textContent + ' · Ruh Labs status';
		} catch {}
	}, 60000);
})();
`;

export const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0B4D3B"/><path d="M20 48V24m0 8c0-6 5-9 12-9" fill="none" stroke="#F6F1E6" stroke-width="8" stroke-linecap="round"/><circle cx="44" cy="44" r="5" fill="#D39A3A"/></svg>`;
