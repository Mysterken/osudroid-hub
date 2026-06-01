import type { Play } from '$lib/models/play';
import type { BeatmapScore } from '$lib/models/beatmapScore';

/**
 * Function to calculate raw PP
 * Formula: Total PP = p * 0.95^(n-1)
 */
function calculateRawPP(pp: number | null, index: number): number {
	if (!pp) return 0;
	return pp * Math.pow(0.95, index - 1);
}

/**
 * Extracts play details from a string.
 * Matches values for date, score, mods, combo, and accuracy.
 */
function convertStringIntoPlayDetails(text: string) {
	const dateMatch = text.match(/\d{4}-\d{2}-\d{2} ([\d:])+/);
	const scoreMatch = text.match(/(?<=score: )([\d,]+)/);
	const longModsMatch = text.match(/(?<=mod: )([\w., ]+)/);
	const comboMatch = text.match(/(?<=combo: )(\d+)/);
	const accuracyMatch = text.match(/(?<=accuracy: )([\d.]+)/);

	// Extract values, ensuring defaults in case of missing data
	const date = dateMatch ? dateMatch[0] : null;
	const score = scoreMatch ? parseInt(scoreMatch[0].replace(/,/g, ''), 10) : 0;
	const combo = comboMatch ? parseInt(comboMatch[0], 10) : 0;
	const accuracy = accuracyMatch ? parseFloat(accuracyMatch[0]) : 0.0;

	let mods: string[] = ['NM']; // Default to "NM" if no mods are found
	if (longModsMatch) {
		mods = longModsMatch[0]
			.split(', ')
			.filter(Boolean) // Remove empty values
			.map(convertLongModNameToAlias);
	}

	return {
		date,
		score,
		mods,
		combo,
		accuracy
	};
}

const modMapping: Record<string, string> = {
	Precise: 'PR',
	NoFail: 'NF',
	Easy: 'EZ',
	Hidden: 'HD',
	HardRock: 'HR',
	DoubleTime: 'DT',
	HalfTime: 'HT',
	NightCore: 'NC',
	Flashlight: 'FL',
	Relax: 'RX',
	Autopilot: 'AP',
	SpunOut: 'SO',
	Perfect: 'PF',
	SuddenDeath: 'SD'
};

/**
 * Converts long mod names to their alias.
 * Example: "NoFail" → "NF"
 */
function convertLongModNameToAlias(mod: string): string {
	if (mod === 'None') return 'NM';
	if (mod.startsWith('x')) return mod;

	return modMapping[mod] || mod;
}

/**
 * Converts mod alias to their long name.
 * Example: "NF" → "NoFail"
 */
function convertAliasToLongModName(alias: string): string {
	if (alias === 'NM') return 'None';
	if (alias === 'HF') return 'HalfTime';
	if (alias.startsWith('x')) return alias;

	const reverseMapping = Object.fromEntries(
		Object.entries(modMapping).map(([key, value]) => [value, key])
	);

	return reverseMapping[alias] || alias;
}

/**
 * Parses a beatmap filename into its metadata components.
 *
 * Extracts artist, title, mapper, and difficulty from a beatmap filename
 * by parsing its standardized format: "Artist - Title (Mapper) [Difficulty]".
 * Handles edge cases like underscores replacing spaces and .osu extensions.
 *
 * @param title - The beatmap filename to parse
 * @returns An object containing parsed metadata
 * @returns {string} songArtist - The artist/creator of the song
 * @returns {string} songTitle - The title of the song
 * @returns {string} mapper - The username of the beatmap creator
 * @returns {string} difficulty - The difficulty name/version of the beatmap
 *
 * @example
 * // Standard format
 * convertTitleToBeatmapMetadata("EGOIST - Ame, Kimi o Tsurete(Speed up ver.) (xAsuna) [Pedri]")
 * // Returns: { songArtist: "EGOIST", songTitle: "Ame, Kimi o Tsurete(Speed up ver.)", mapper: "xAsuna", difficulty: "Pedri" }
 *
 * @example
 * // With .osu extension
 * convertTitleToBeatmapMetadata("Artist - Song (Mapper) [Diff].osu")
 * // Returns: { songArtist: "Artist", songTitle: "Song", mapper: "Mapper", difficulty: "Diff" }
 */
export function convertTitleToBeatmapMetadata(title: string): {
	songArtist: string;
	songTitle: string;
	mapper: string;
	difficulty: string;
} {
	// Remove .osu file extension and trim whitespace
	let current = title.replace(/\.osu$/, '').trim();
	let songArtist = '';
	let mapper = '';
	let difficulty = '';

	// Extract difficulty from the rightmost bracket pair: [Difficulty]
	const diffMatch = current.match(/\[([^\]]*)][\s_]*$/);
	if (diffMatch?.index !== undefined) {
		difficulty = diffMatch[1];
		// Remove the difficulty part from current string
		current = current.substring(0, diffMatch.index).replace(/[\s_]+$/, '');
	}

	// Extract mapper from the rightmost parentheses: (Mapper)
	const mapperMatch = current.match(/\(([^)]*)\)[\s_]*$/);
	if (mapperMatch?.index !== undefined) {
		mapper = mapperMatch[1];
		// Remove the mapper part from current string
		current = current.substring(0, mapperMatch.index).replace(/[\s_]+$/, '');
	}

	// Extract artist and title by splitting on the separator: " - " or "_-_"
	const separatorMatch = current.match(/([\s_]+-[\s_]+)/);
	let songTitle: string;
	if (separatorMatch?.index !== undefined) {
		// Split on the separator found
		songArtist = current.substring(0, separatorMatch.index).trim();
		songTitle = current.substring(separatorMatch.index + separatorMatch[0].length).trim();

		// replace underscores with spaces in all fields (e.g., "Artist_-_Title")
		if (separatorMatch[0] === '_-_') {
			songArtist = songArtist.replace(/_/g, ' ');
			songTitle = songTitle.replace(/_/g, ' ');
			mapper = mapper.replace(/_/g, ' ');
			difficulty = difficulty.replace(/_/g, ' ');
		}
	} else {
		// No separator found; treat entire remaining string as title
		songTitle = current;
	}

	return { songArtist, songTitle, mapper, difficulty };
}

function formatLength(length?: number): string {
	if (!length) return '0:00';

	const minutes = Math.floor(length / 60);
	const seconds = length % 60;
	return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

/**
 * Calculates the official osu! total PP from an array of unique PP values.
 * Applies the weight formula and adds Bonus PP.
 * @param uniquePPs An array containing the highest PP value per beatmap.
 * @param totalScoreCount Optional: The player's total ranked score count. Defaults to the array length.
 */
function calculateTotalPP(uniquePPs: number[], totalScoreCount?: number): number {
	if (!uniquePPs || uniquePPs.length === 0) return 0;

	// Sort Strictly Descending
	const sortedPP = [...uniquePPs].sort((a, b) => b - a);

	// Calculate Weighted Sum (p * 0.95^(n-1))
	const weightedPP = sortedPP.reduce((total, pp, index) => {
		return total + calculateRawPP(pp, index + 1);
	}, 0);

	// Calculate Bonus PP
	const N = totalScoreCount || sortedPP.length;
	const clampedN = Math.min(N, 1000);
	const bonusPP = 416.6667 * (1 - Math.pow(0.9994, clampedN));

	return weightedPP + bonusPP;
}

/**
 * Calculates the simulated performance points (PP) of a set of plays.
 * Matches the official osu! mathematical algorithm.
 * @param plays The array of Play models.
 * @param totalScoreCount Optional: The player's total ranked score count.
 */
function getSimulatedPerformancePoints(plays: Play[], totalScoreCount?: number): number {
	if (!plays || plays.length === 0) return 0;

	const uniquePlaysMap = new Map<string, number>();

	for (const play of plays) {
		if (!play.Hash || play.MapPP == null) continue;

		const mapId = play.Hash;
		const currentBest = uniquePlaysMap.get(mapId) || 0;

		if (play.MapPP > currentBest) {
			uniquePlaysMap.set(mapId, play.MapPP);
		}
	}

	return calculateTotalPP(Array.from(uniquePlaysMap.values()), totalScoreCount);
}

/**
 * Parses a mod array into a clean array of strings.
 * Example: [{ acronym: 'HD' }, { acronym: 'DT', settings: { rateMultiplier: 1.5 } }]
 * Returns: ['HD', 'DT', 'x1.5']
 */
export function parseModsArray(mods: BeatmapScore['mods']): string[] {
	if (!mods || !Array.isArray(mods) || mods.length === 0) return ['NM'];

	const parsedMods: string[] = [];
	const multiplierMods: string[] = [];

	for (const mod of mods) {
		parsedMods.push(mod.acronym);

		// Safely handle custom speed multipliers
		if (mod.settings && typeof mod.settings.rateMultiplier === 'number') {
			multiplierMods.push(`x${mod.settings.rateMultiplier}`);
		}
	}

	return [...parsedMods, ...multiplierMods];
}

export const playUtils = {
	calculateRawPP,
	calculateTotalPP,
	convertStringIntoPlayDetails,
	convertLongModNameToAlias,
	convertAliasToLongModName,
	convertTitleToBeatmapMetadata,
	formatLength,
	getSimulatedPerformancePoints,
	parseModsArray
};
