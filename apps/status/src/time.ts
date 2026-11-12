/** Days and times are Maldives time (UTC+5, no daylight saving). */
export const DAY_MS = 86_400_000;
export const MVT_OFFSET_MS = 5 * 3_600_000;
const ZONE = 'Indian/Maldives';

/** Whole days since 1970-01-01 in Maldives time: the key a day's checks are grouped by. */
export const dayKey = (ms: number): number => Math.floor((ms + MVT_OFFSET_MS) / DAY_MS);

/** "12 Nov 2026" for a day key */
export const formatDay = (key: number): string =>
	new Date(key * DAY_MS).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** "18:41" in Maldives time */
export const formatClock = (ms: number): string =>
	new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: ZONE });

/** "12 Nov 2026" from "2026-11-12" */
export const formatIsoDay = (iso: string): string => formatDay(Math.floor(Date.parse(`${iso}T00:00:00Z`) / DAY_MS));
