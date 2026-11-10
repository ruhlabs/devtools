export interface Atoll {
	/** Code abbreviation used in addresses, e.g. "HA", "Sh", "ADh" */
	code: string;
	/** Code letter(s) in Thaana, e.g. "ހއ" */
	codeThaana: string;
	/** Code name, e.g. "Haa Alifu" */
	codeName: string;
	/** Official name of the administrative division, e.g. "Thiladhunmathi Uthuruburi" */
	officialName: string;
	/** Single Latin letter used in some official systems, e.g. "A" */
	latinLetter: string;
	/** ISO 3166-2 code, e.g. "MV-07" */
	iso: string;
	/** Administrative capital island */
	capital: string;
	/** Other spellings people use for the code name */
	aliases: readonly string[];
}

export interface City {
	name: string;
	/** Code of the atoll the city is in, or null for Malé (its own division) */
	atoll: string | null;
	iso?: string;
}

/**
 * The 20 administrative atolls, from north to south.
 *
 * Source: Wikipedia, "Administrative divisions of the Maldives" (2026) and ISO 3166-2:MV.
 */
export const ATOLLS: readonly Atoll[] = [
	{ code: 'HA', codeThaana: 'ހއ', codeName: 'Haa Alifu', officialName: 'Thiladhunmathi Uthuruburi', latinLetter: 'A', iso: 'MV-07', capital: 'Dhidhdhoo', aliases: ['Haa Alif'] },
	{ code: 'HDh', codeThaana: 'ހދ', codeName: 'Haa Dhaalu', officialName: 'Thiladhunmathi Dhekunuburi', latinLetter: 'B', iso: 'MV-23', capital: 'Kulhudhuffushi', aliases: ['Haa Dhaal'] },
	{ code: 'Sh', codeThaana: 'ށ', codeName: 'Shaviyani', officialName: 'Miladhunmadulu Uthuruburi', latinLetter: 'C', iso: 'MV-24', capital: 'Funadhoo', aliases: [] },
	{ code: 'N', codeThaana: 'ނ', codeName: 'Noonu', officialName: 'Miladhunmadulu Dhekunuburi', latinLetter: 'D', iso: 'MV-25', capital: 'Manadhoo', aliases: [] },
	{ code: 'R', codeThaana: 'ރ', codeName: 'Raa', officialName: 'Maalhosmadulu Uthuruburi', latinLetter: 'E', iso: 'MV-13', capital: 'Ungoofaaru', aliases: [] },
	{ code: 'B', codeThaana: 'ބ', codeName: 'Baa', officialName: 'Maalhosmadulu Dhekunuburi', latinLetter: 'F', iso: 'MV-20', capital: 'Eydhafushi', aliases: [] },
	{ code: 'Lh', codeThaana: 'ޅ', codeName: 'Lhaviyani', officialName: 'Faadhippolhu', latinLetter: 'G', iso: 'MV-03', capital: 'Naifaru', aliases: [] },
	{ code: 'K', codeThaana: 'ކ', codeName: 'Kaafu', officialName: 'Malé Atholhu', latinLetter: 'H', iso: 'MV-26', capital: 'Thulusdhoo', aliases: [] },
	{ code: 'AA', codeThaana: 'އއ', codeName: 'Alifu Alifu', officialName: 'Ari Atholhu Uthuruburi', latinLetter: 'U', iso: 'MV-02', capital: 'Rasdhoo', aliases: ['Alif Alif'] },
	{ code: 'ADh', codeThaana: 'އދ', codeName: 'Alifu Dhaalu', officialName: 'Ari Atholhu Dhekunuburi', latinLetter: 'I', iso: 'MV-00', capital: 'Mahibadhoo', aliases: ['Alif Dhaal', 'Alif Dhaalu'] },
	{ code: 'V', codeThaana: 'ވ', codeName: 'Vaavu', officialName: 'Felidhu Atholhu', latinLetter: 'J', iso: 'MV-04', capital: 'Felidhoo', aliases: [] },
	{ code: 'M', codeThaana: 'މ', codeName: 'Meemu', officialName: 'Mulak Atholhu', latinLetter: 'K', iso: 'MV-12', capital: 'Muli', aliases: [] },
	{ code: 'F', codeThaana: 'ފ', codeName: 'Faafu', officialName: 'Nilandhe Atholhu Uthuruburi', latinLetter: 'L', iso: 'MV-14', capital: 'Nilandhoo', aliases: [] },
	{ code: 'Dh', codeThaana: 'ދ', codeName: 'Dhaalu', officialName: 'Nilandhe Atholhu Dhekunuburi', latinLetter: 'M', iso: 'MV-17', capital: 'Kudahuvadhoo', aliases: [] },
	{ code: 'Th', codeThaana: 'ތ', codeName: 'Thaa', officialName: 'Kolhumadulu', latinLetter: 'N', iso: 'MV-08', capital: 'Veymandoo', aliases: [] },
	{ code: 'L', codeThaana: 'ލ', codeName: 'Laamu', officialName: 'Haddhunmathi', latinLetter: 'O', iso: 'MV-05', capital: 'Fonadhoo', aliases: [] },
	{ code: 'GA', codeThaana: 'ގއ', codeName: 'Gaafu Alifu', officialName: 'Huvadhu Atholhu Uthuruburi', latinLetter: 'P', iso: 'MV-27', capital: 'Villingili', aliases: ['Gaafu Alif', 'Gaaf Alif'] },
	{ code: 'GDh', codeThaana: 'ގދ', codeName: 'Gaafu Dhaalu', officialName: 'Huvadhu Atholhu Dhekunuburi', latinLetter: 'Q', iso: 'MV-28', capital: 'Thinadhoo', aliases: ['Gaaf Dhaal', 'Gaafu Dhaal'] },
	{ code: 'Gn', codeThaana: 'ޏ', codeName: 'Gnaviyani', officialName: 'Fuvahmulah City', latinLetter: 'R', iso: 'MV-29', capital: 'Fuvahmulah', aliases: [] },
	{ code: 'S', codeThaana: 'ސ', codeName: 'Seenu', officialName: 'Addu City', latinLetter: 'S', iso: 'MV-01', capital: 'Hithadhoo', aliases: ['Addu'] }
];

/** The five cities, each run by a city council. */
export const CITIES: readonly City[] = [
	{ name: 'Malé', atoll: null, iso: 'MV-MLE' },
	{ name: 'Addu', atoll: 'S' },
	{ name: 'Fuvahmulah', atoll: 'Gn' },
	{ name: 'Kulhudhuffushi', atoll: 'HDh' },
	{ name: 'Thinadhoo', atoll: 'GDh' }
];
