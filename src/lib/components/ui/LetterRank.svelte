<script lang="ts">
	import { getColorFromRank } from '$lib/utils/colors';

	let { sx, rank }: { sx: string; rank: string } = $props();
	let letterRank = $derived(rank?.toUpperCase());

	function getRankColor(rank: string): { color: string; displayLetter: string } {
		const rankMap: Record<string, { color: string; displayLetter: string }> = {
			XH: { color: getColorFromRank('XH'), displayLetter: 'SS' },
			SH: { color: getColorFromRank('SH'), displayLetter: 'S' },
			X: { color: getColorFromRank('X'), displayLetter: 'SS' },
			SS: { color: getColorFromRank('SS'), displayLetter: 'SS' },
			S: { color: getColorFromRank('S'), displayLetter: 'S' },
			A: { color: getColorFromRank('A'), displayLetter: 'A' },
			B: { color: getColorFromRank('B'), displayLetter: 'B' },
			C: { color: getColorFromRank('C'), displayLetter: 'C' },
			D: { color: getColorFromRank('D'), displayLetter: 'D' }
		};
		return rankMap[rank] || { color: '#FFFFFF', displayLetter: rank };
	}

	const { color, displayLetter } = $derived(getRankColor(letterRank));
</script>

<div class={sx} style="color: {color};">
	{displayLetter}
</div>
