import { pickBrand } from './brands.js';

/** Where the monitors live: Uptime Kuma's public status-page API. */
export const KUMA_URL = (process.env.KUMA_URL ?? 'https://status.oreotm.xyz').replace(/\/$/, '');
/** Which brand this instance shows (look, Kuma page, addresses, incidents). */
export const BRAND = pickBrand();
/** The Kuma status page whose groups and monitors this page shows. */
export const KUMA_SLUG = process.env.KUMA_SLUG ?? BRAND.kumaSlug;
/** How often the Kuma monitors check, in minutes: each failed check counts as this much downtime. */
export const CHECK_MINUTES = Number(process.env.CHECK_MINUTES ?? 1);

/** How often to read Kuma. Its monitors check every minute. */
export const POLL_MS = Number(process.env.POLL_MS ?? 60_000);

