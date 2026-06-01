/**
 * Calculates the exact osu! difficulty color based on a Star Rating.
 */
export function getDifficultyColor(starRating: number): string {
	if (starRating < 0.1) return '#AAAAAA';
	if (starRating >= 9.0) return '#000000';

	const domain = [0.1, 1.25, 2.0, 2.5, 3.3, 4.2, 4.9, 5.8, 6.7, 7.7, 9.0];

	const range = [
		[66, 144, 251], // 0.10★ - #4290FB
		[79, 192, 255], // 1.25★ - #4FC0FF
		[79, 255, 213], // 2.00★ - #4FFFD5
		[124, 255, 79], // 2.50★ - #7CFF4F
		[246, 240, 92], // 3.30★ - #F6F05C
		[255, 128, 104], // 4.20★ - #FF8068
		[255, 78, 111], // 4.90★ - #FF4E6F
		[198, 69, 184], // 5.80★ - #C645B8
		[101, 99, 222], // 6.70★ - #6563DE
		[24, 21, 142], // 7.70★ - #18158E
		[0, 0, 0] // 9.00★ - #000000
	];

	let i = 0;
	while (starRating > domain[i + 1]) {
		i++;
	}

	// Calculate interpolation factor (0.0 to 1.0)
	const t = (starRating - domain[i]) / (domain[i + 1] - domain[i]);

	// Apply Gamma 2.2 correction before blending
	const gamma = 2.2;
	const invGamma = 1 / gamma;

	const rA = Math.pow(range[i][0] / 255, gamma);
	const gA = Math.pow(range[i][1] / 255, gamma);
	const bA = Math.pow(range[i][2] / 255, gamma);

	const rB = Math.pow(range[i + 1][0] / 255, gamma);
	const gB = Math.pow(range[i + 1][1] / 255, gamma);
	const bB = Math.pow(range[i + 1][2] / 255, gamma);

	// Blend in the linear light space
	const rC = rA + t * (rB - rA);
	const gC = gA + t * (gB - gA);
	const bC = bA + t * (bB - bA);

	// Convert back to standard sRGB space
	const r = Math.round(Math.pow(rC, invGamma) * 255);
	const g = Math.round(Math.pow(gC, invGamma) * 255);
	const b = Math.round(Math.pow(bC, invGamma) * 255);

	return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase()}`;
}

/**
 * Maps an osu! rank grade to its specific thematic color hex code.
 */
export function getColorFromRank(rank: string): string {
	const normalizedRank = rank.toUpperCase().trim();

	const colorMap: Record<string, string> = {
		XH: '#FFFFFF',
		SH: '#FFFFFF',
		X: '#FFFF00',
		SS: '#FFFF00',
		S: '#FFFF00',
		A: '#008000',
		B: '#0000FF',
		C: '#800080',
		D: '#800020'
	};

	return colorMap[normalizedRank] || '#FFFFFF';
}
