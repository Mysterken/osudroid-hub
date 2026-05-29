<script lang="ts">
	import leaderboardRoundedIcon from '$lib/assets/icons/leaderboard-rounded.svg';
	import ContentCard from '$lib/components/layouts/ContentCard.svelte';

	let {
		source,
		globalRanking,
		countryRanking,
		scoreRanking,
		ppRanking
	}: {
		source: 'api' | 'scraper' | 'merged';
		globalRanking?: number;
		countryRanking?: number;
		scoreRanking?: number;
		ppRanking?: number;
	} = $props();
</script>

{#snippet userRanking(title = '', value = 0)}
	<tr>
		<td class="pb-1 text-left">{title}</td>
		<td class="pb-1 text-right font-bold">{isNaN(Number(value)) ? 'N/A' : `#${value ?? 0}`}</td>
	</tr>
{/snippet}

<ContentCard sx="!p-2.5 flex flex-col gap-2.5">
	<div class="flex items-center gap-3.5">
		<img class="size-8 filter invert" src={leaderboardRoundedIcon} alt="leaderboard icon" />
		<h1 class="font-bold text-lg">Ranking</h1>
	</div>

	<div class="user-ranking flex flex-col justify-center w-full px-2">
		<table class="w-full text-sm max-w-100">
			<tbody>
				{#if source === 'api' || source === 'merged'}
					{@render userRanking('Global Ranking', globalRanking)}
					{@render userRanking('Country Ranking', countryRanking)}
				{:else if source === 'scraper'}
					{@render userRanking('Score Ranking', scoreRanking)}
					{@render userRanking('PP Ranking', ppRanking)}
				{:else}
					{@render userRanking('No ranking data available')}
				{/if}
			</tbody>
		</table>
	</div>
</ContentCard>
