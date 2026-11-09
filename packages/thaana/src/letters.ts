/** Thaana consonants (and alifu) mapped to their Malé Latin spelling. */
export const CONSONANTS: Readonly<Record<string, string>> = {
	'ހ': 'h', // ހ haa
	'ށ': 'sh', // ށ shaviyani
	'ނ': 'n', // ނ noonu
	'ރ': 'r', // ރ raa
	'ބ': 'b', // ބ baa
	'ޅ': 'lh', // ޅ lhaviyani
	'ކ': 'k', // ކ kaafu
	'ވ': 'v', // ވ vaavu
	'މ': 'm', // މ meemu
	'ފ': 'f', // ފ faafu
	'ދ': 'dh', // ދ dhaalu
	'ތ': 'th', // ތ thaa
	'ލ': 'l', // ލ laamu
	'ގ': 'g', // ގ gaafu
	'ޏ': 'gn', // ޏ gnaviyani
	'ސ': 's', // ސ seenu
	'ޑ': 'd', // ޑ daviyani
	'ޒ': 'z', // ޒ zaviyani
	'ޓ': 't', // ޓ taviyani
	'ޔ': 'y', // ޔ yaa
	'ޕ': 'p', // ޕ paviyani
	'ޖ': 'j', // ޖ javiyani
	'ޗ': 'ch', // ޗ chaviyani
	// Letters used for Arabic loanwords
	'ޘ': 'th', // ޘ ttaa
	'ޙ': 'h', // ޙ hhaa
	'ޚ': 'kh', // ޚ khaa
	'ޛ': 'dh', // ޛ thaalu
	'ޜ': 'z', // ޜ zaa
	'ޝ': 'sh', // ޝ sheenu
	'ޞ': 's', // ޞ saadhu
	'ޟ': 'dh', // ޟ daadhu
	'ޠ': 't', // ޠ to
	'ޡ': 'z', // ޡ zo
	'ޢ': "'", // ޢ ainu
	'ޣ': 'gh', // ޣ ghainu
	'ޤ': 'q', // ޤ qaafu
	'ޥ': 'w', // ޥ waavu
	'ޱ': 'n' // ޱ naa
};

export const ALIFU = 'އ'; // އ
export const SUKUN = 'ް'; // ް

/** Thaana vowel signs (fili) mapped to their Malé Latin spelling. */
export const FILI: Readonly<Record<string, string>> = {
	'ަ': 'a', // ަ abafili
	'ާ': 'aa', // ާ aabaafili
	'ި': 'i', // ި ibifili
	'ީ': 'ee', // ީ eebeefili
	'ު': 'u', // ު ubufili
	'ޫ': 'oo', // ޫ ooboofili
	'ެ': 'e', // ެ ebefili
	'ޭ': 'ey', // ޭ eybeyfili
	'ޮ': 'o', // ޮ obofili
	'ޯ': 'oa' // ޯ oaboafili
};

/** Arabic-script punctuation used in Dhivehi text. */
export const PUNCTUATION: Readonly<Record<string, string>> = {
	'،': ',', // ،
	'؛': ';', // ؛
	'؟': '?' // ؟
};

/**
 * Latin → Thaana lookups used by `toThaana`. Only the core Dhivehi letters are
 * included; Arabic-loanword letters can't be told apart from Latin spelling.
 */
export const LATIN_CONSONANTS: Readonly<Record<string, string>> = {
	sh: 'ށ',
	lh: 'ޅ',
	dh: 'ދ',
	th: 'ތ',
	gn: 'ޏ',
	ch: 'ޗ',
	kh: 'ޚ',
	gh: 'ޣ',
	h: 'ހ',
	n: 'ނ',
	r: 'ރ',
	b: 'ބ',
	k: 'ކ',
	v: 'ވ',
	m: 'މ',
	f: 'ފ',
	l: 'ލ',
	g: 'ގ',
	s: 'ސ',
	d: 'ޑ',
	z: 'ޒ',
	t: 'ޓ',
	y: 'ޔ',
	p: 'ޕ',
	j: 'ޖ',
	q: 'ޤ',
	w: 'ޥ'
};

export const LATIN_VOWELS: Readonly<Record<string, string>> = {
	aa: 'ާ',
	ee: 'ީ',
	oo: 'ޫ',
	ey: 'ޭ',
	oa: 'ޯ',
	a: 'ަ',
	i: 'ި',
	u: 'ު',
	e: 'ެ',
	o: 'ޮ'
};
