import type { PastIncident } from './incidents.js';

/**
 * One status page app, several brands. Pick one with BRAND (default "ruh"). A brand sets the
 * look, the Kuma status page it mirrors, the addresses shown under services and past incidents.
 */
export interface Brand {
	id: string;
	/** Page title when all is well, and the suffix otherwise */
	title: string;
	description: string;
	/** Kuma status page slug */
	kumaSlug: string;
	/** Address shown under each service, by Kuma monitor id (Kuma's public API doesn't share URLs) */
	hosts: Record<number, string>;
	/** Newest first; only the last 90 days are shown */
	incidents: PastIncident[];
	/** HTML for the left of the header (trusted, written here) */
	headerHtml: string;
	/** HTML for the right of the footer (trusted, written here) */
	footerHtml: string;
	favicon: { href: string; type: string };
	/** Extra image origins for the Content-Security-Policy */
	imgOrigins: string[];
	fontsHref: string;
	/** CSS custom properties; see assets.ts for what each is used for */
	vars: Record<string, string>;
}

const ruh: Brand = {
	id: 'ruh',
	title: 'Ruh Labs status',
	description: 'Live status of Ruh Labs services: SET25, Study IAL and the Ruh Labs API.',
	kumaSlug: 'ruh',
	hosts: { 3: 'set25.mv', 11: 'hq.set25.mv', 2: 'study.oreotm.xyz', 5: 'api.oreotm.xyz' },
	incidents: [],
	headerHtml: '<span class="mark">ruh<span>.</span></span><span class="bar"></span><span class="what">Status</span>',
	footerHtml: '<span class="sig"><b>Ruh Labs</b><span lang="dv" dir="rtl" class="thaana">ރުއް ލެބްސް</span></span>',
	favicon: { href: '/favicon.svg', type: 'image/svg+xml' },
	imgOrigins: [],
	fontsHref:
		'https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Inter:wght@400;500;600&family=Noto+Sans+Thaana:wght@500&display=swap',
	vars: {
		'font-display': 'Outfit, Inter, sans-serif',
		'font-body': 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
		bg: '#F6F1E6',
		card: '#FFFDF8',
		line: 'rgba(11,77,59,.12)',
		'line-soft': 'rgba(11,77,59,.1)',
		ink: '#14231D',
		text: '#1F2A26',
		'text-2': '#3B4A44',
		muted: '#5B6B64',
		brand: '#0B4D3B',
		'on-brand': '#F6F1E6',
		'link-hover': '#2E7E6B',
		accent: '#D39A3A',
		up: '#2E7E6B',
		'up-text': '#1F6B59',
		'up-bg': '#E3EFE9',
		partial: '#C2410C',
		'warn-text': '#9A3412',
		'warn-bg': '#FCEBDD',
		'warn-hero': '#FCF0E6',
		'warn-hero-line': '#F2D2B8',
		'warn-hero-text': '#7C2D12',
		down: '#991B1B',
		'down-bg': '#F7E1E1',
		'down-hero': '#FBECEC',
		'down-hero-line': '#F0CACA',
		'down-hero-text': '#7F1D1D',
		none: '#E6E0D2',
		neutral: '#ECE6D8'
	}
};

const aircorps: Brand = {
	id: 'aircorps',
	title: 'Air Corps status',
	description: 'Live status of the Air Corps web apps: Hangar, FAMS, AAMS, PCMS, ATDS and Admin.',
	kumaSlug: 'aircorps',
	hosts: {
		4: 'aircorps.app',
		6: 'fams.aircorps.app',
		7: 'aams.aircorps.app',
		8: 'pcms.aircorps.app',
		9: 'atds.aircorps.app',
		10: 'admin.aircorps.app'
	},
	incidents: [],
	headerHtml:
		'<img class="logo" src="https://aircorps.app/icon.png" width="40" height="40" alt=""><span class="word">Air Corps</span><span class="bar"></span><span class="what">Status</span>',
	footerHtml: '<span class="sig"><b>Air Corps</b></span>',
	favicon: { href: 'https://aircorps.app/icon.png', type: 'image/png' },
	imgOrigins: ['https://aircorps.app'],
	fontsHref: 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap',
	vars: {
		'font-display': 'Geist, ui-sans-serif, system-ui, sans-serif',
		'font-body': 'Geist, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
		bg: '#f5f7fa',
		card: '#ffffff',
		line: '#dfe5ec',
		'line-soft': '#e8edf2',
		ink: '#0f172a',
		text: '#0f172a',
		'text-2': '#334155',
		muted: '#64748b',
		brand: '#0a3463',
		'on-brand': '#ffffff',
		'link-hover': '#082b52',
		accent: '#f7c00d',
		up: '#059669',
		'up-text': '#047857',
		'up-bg': '#ecfdf5',
		partial: '#d97706',
		'warn-text': '#b45309',
		'warn-bg': '#fffbeb',
		'warn-hero': '#fffbeb',
		'warn-hero-line': '#fde68a',
		'warn-hero-text': '#78350f',
		down: '#991b1b',
		'down-bg': '#fef2f2',
		'down-hero': '#fef2f2',
		'down-hero-line': '#fecaca',
		'down-hero-text': '#7f1d1d',
		none: '#e2e8f0',
		neutral: '#f1f5f9'
	}
};

export const BRANDS: Record<string, Brand> = { ruh, aircorps };

export function pickBrand(id = process.env.BRAND ?? 'ruh'): Brand {
	const brand = BRANDS[id];
	if (!brand) throw new Error(`Unknown BRAND "${id}". Known: ${Object.keys(BRANDS).join(', ')}`);
	return brand;
}

export const brandCss = (brand: Brand): string =>
	`:root{${Object.entries(brand.vars)
		.map(([k, v]) => `--${k}:${v}`)
		.join(';')}}`;
