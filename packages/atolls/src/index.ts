import { ATOLLS, CITIES, type Atoll, type City } from './data.js';

export { ATOLLS, CITIES, type Atoll, type City };

const normalize = (value: string) =>
	value
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '') // drop accents (Malé → Male)
		.toLowerCase()
		.replace(/\b(atoll|atholhu)\b/g, '')
		.replace(/[^a-z0-9ހ-ޱ]/g, '');

const lookup = new Map<string, Atoll>();
for (const atoll of ATOLLS) {
	for (const key of [atoll.code, atoll.codeThaana, atoll.codeName, atoll.officialName, atoll.iso, ...atoll.aliases]) {
		lookup.set(normalize(key), atoll);
	}
}

/**
 * Find an atoll by any of its names or codes: "HA", "Haa Alifu", "Haa Alif Atoll",
 * "ހއ", "Thiladhunmathi Uthuruburi" or "MV-07". Case and accents don't matter.
 */
export function getAtoll(query: string): Atoll | undefined {
	return lookup.get(normalize(query));
}

/** The city with this name ("Malé", "Addu City"), if it is one of the five cities. */
export function getCity(name: string): City | undefined {
	const key = normalize(name.replace(/\bcity\b/i, ''));
	return CITIES.find((city) => normalize(city.name) === key);
}

export interface ParsedIslandAddress {
	atoll: Atoll;
	island: string;
}

/**
 * Split an island written with its atoll code, the way Maldivians write
 * addresses: "B. Eydhafushi", "HDh Kulhudhuffushi", "GA.Villingili", "ބ. އޭދަފުށި".
 *
 * Returns `undefined` if there's no recognisable atoll code in front.
 */
export function parseIslandAddress(input: string): ParsedIslandAddress | undefined {
	const match = /^\s*([^\s.]+)\s*[.\s]\s*(.+?)\s*$/u.exec(input);
	if (!match) return undefined;
	const [, code, island] = match;
	const atoll = getAtoll(code!);
	return atoll ? { atoll, island: island! } : undefined;
}

/** Format an island with its atoll code: ("B", "Eydhafushi") → "B. Eydhafushi". */
export function formatIslandAddress(atoll: string | Atoll, island: string, options: { thaana?: boolean } = {}): string {
	const found = typeof atoll === 'string' ? getAtoll(atoll) : atoll;
	if (!found) throw new Error(`Unknown atoll: ${atoll}`);
	return `${options.thaana ? found.codeThaana : found.code}. ${island.trim()}`;
}
