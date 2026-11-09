import { ALIFU, CONSONANTS, FILI, LATIN_CONSONANTS, LATIN_VOWELS, PUNCTUATION, SUKUN } from './letters.js';

export { CONSONANTS, FILI, ALIFU, SUKUN } from './letters.js';

const THAANA_CHAR = /[ހ-ޱ]/;
const THAANA_OR_NEUTRAL = /^[ހ-ޱ،؛؟\s\d.,!?;:'"()\-–—]*$/;

/** True if the text contains at least one Thaana character. */
export function hasThaana(text: string): boolean {
	return THAANA_CHAR.test(text);
}

/**
 * True if the text is written in Thaana: it has at least one Thaana character
 * and nothing else apart from spaces, digits and punctuation.
 */
export function isThaana(text: string): boolean {
	return hasThaana(text) && THAANA_OR_NEUTRAL.test(text);
}

/**
 * Transliterate Thaana to Latin using simplified Malé Latin spelling.
 *
 * - ދިވެހި → dhivehi
 * - ރާއްޖެ → raajje (alifu + sukun doubles the next consonant)
 * - ތިނެއް → thineh (alifu + sukun at the end of a word becomes "h")
 *
 * Non-Thaana text is left as it is, so mixed text is safe to pass in.
 */
export function toLatin(text: string): string {
	const chars = [...text.normalize('NFC')];
	let out = '';

	for (let i = 0; i < chars.length; i++) {
		const c = chars[i]!;
		const next = chars[i + 1];

		if (c in PUNCTUATION) {
			out += PUNCTUATION[c];
			continue;
		}

		if (c === ALIFU) {
			if (next && next in FILI) {
				out += FILI[next];
				i++;
			} else if (next === SUKUN) {
				const after = chars[i + 2];
				const doubled = after ? CONSONANTS[after] : undefined;
				out += doubled ? doubled[0] : 'h';
				i++;
			}
			continue;
		}

		const consonant = CONSONANTS[c];
		if (consonant !== undefined) {
			out += consonant;
			if (next && next in FILI) {
				out += FILI[next];
				i++;
			} else if (next === SUKUN) {
				i++;
			}
			continue;
		}

		if (c in FILI) {
			out += FILI[c];
			continue;
		}

		if (c === SUKUN) continue;

		out += c;
	}

	return out;
}

type Token = { kind: 'vowel' | 'consonant'; latin: string; thaana: string } | { kind: 'other'; latin: string };

const VOWEL_KEYS = Object.keys(LATIN_VOWELS).sort((a, b) => b.length - a.length);
const CONSONANT_KEYS = Object.keys(LATIN_CONSONANTS).sort((a, b) => b.length - a.length);

function tokenize(word: string): Token[] {
	const tokens: Token[] = [];
	let i = 0;
	while (i < word.length) {
		const vowel = VOWEL_KEYS.find((v) => word.startsWith(v, i));
		if (vowel) {
			tokens.push({ kind: 'vowel', latin: vowel, thaana: LATIN_VOWELS[vowel]! });
			i += vowel.length;
			continue;
		}
		const consonant = CONSONANT_KEYS.find((k) => word.startsWith(k, i));
		if (consonant) {
			tokens.push({ kind: 'consonant', latin: consonant, thaana: LATIN_CONSONANTS[consonant]! });
			i += consonant.length;
			continue;
		}
		tokens.push({ kind: 'other', latin: word[i]! });
		i++;
	}
	return tokens;
}

function wordToThaana(word: string): string {
	const tokens = tokenize(word.toLowerCase());
	let out = '';

	for (let k = 0; k < tokens.length; k++) {
		const token = tokens[k]!;
		const prev = tokens[k - 1];
		const next = tokens[k + 1];

		if (token.kind === 'other') {
			out += token.latin;
			continue;
		}

		if (token.kind === 'vowel') {
			// A vowel that doesn't follow a consonant sits on alifu.
			out += prev?.kind === 'consonant' ? token.thaana : ALIFU + token.thaana;
			continue;
		}

		// Doubled consonant after a vowel (raajje) is written with alifu + sukun.
		if (prev?.kind === 'vowel' && next?.kind === 'consonant' && next.latin === token.latin) {
			out += ALIFU + SUKUN;
			continue;
		}

		// Word-final "h" after a vowel (thineh) is alifu + sukun.
		if (token.latin === 'h' && prev?.kind === 'vowel' && next === undefined) {
			out += ALIFU + SUKUN;
			continue;
		}

		out += token.thaana;
		if (next?.kind !== 'vowel') out += SUKUN;
	}

	return out;
}

/**
 * Best-effort transliteration from Malé Latin spelling to Thaana.
 *
 * Latin spelling is ambiguous (for example "s" could be ސ or ޞ), so this always
 * picks the common Dhivehi letter. Good for search, suggestions and input
 * helpers; check the output before showing it as official text.
 *
 * - dhivehi → ދިވެހި
 * - raajje → ރާއްޖެ
 * - aharen → އަހަރެން
 */
export function toThaana(text: string): string {
	return text.replace(/[A-Za-z]+/g, (word) => wordToThaana(word));
}
