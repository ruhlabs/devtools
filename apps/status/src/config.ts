/** Where the monitors live: Uptime Kuma's public status-page API. */
export const KUMA_URL = (process.env.KUMA_URL ?? 'https://status.oreotm.xyz').replace(/\/$/, '');
/** The Kuma status page whose groups and monitors this page shows. */
export const KUMA_SLUG = process.env.KUMA_SLUG ?? 'ruh';
/** How often the Kuma monitors check, in minutes: each failed check counts as this much downtime. */
export const CHECK_MINUTES = Number(process.env.CHECK_MINUTES ?? 1);

/** How often to read Kuma. Its monitors check every minute. */
export const POLL_MS = Number(process.env.POLL_MS ?? 60_000);

/**
 * The address shown under each service, by Kuma monitor id. Kuma's public API doesn't
 * share monitor URLs, so they're listed here. Monitors not listed show no address.
 */
export const HOSTS: Record<number, string> = {
	3: 'set25.mv',
	11: 'hq.set25.mv',
	2: 'study.oreotm.xyz',
	5: 'api.oreotm.xyz'
};
