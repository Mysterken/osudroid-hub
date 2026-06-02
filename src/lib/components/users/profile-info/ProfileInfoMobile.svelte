<script lang="ts">
	import defaultAvatarImg from '$lib/assets/default/avatar.webp';
	import { tooltip } from '$lib/actions/tooltip';
	import ContentCard from '$lib/components/layouts/ContentCard.svelte';
	import { timeAgo } from '$lib/utils/time';
	import { getCountryName } from '$lib/utils/countries';

	let {
		source,
		avatarLink,
		username,
		country,
		globalRanking,
		countryRanking,
		scoreRanking,
		ppRanking,
		performancePoints,
		simulatedPerformancePoints = performancePoints,
		score,
		accuracy,
		playcount,
		registered,
		lastLogin
	}: {
		source: 'api' | 'scraper' | 'merged';
		avatarLink: string;
		username: string;
		country: string;
		globalRanking?: number;
		countryRanking?: number;
		scoreRanking?: number;
		ppRanking?: number;
		performancePoints: number;
		simulatedPerformancePoints?: number;
		score: number;
		accuracy: number;
		playcount: number;
		registered: string | null;
		lastLogin: string | null;
	} = $props();

	let displayedPerformancePoints = $derived(
		performancePoints === 0 && simulatedPerformancePoints !== 0
			? simulatedPerformancePoints
			: performancePoints
	);
	let isSimulated = $derived(performancePoints === 0 && simulatedPerformancePoints !== 0);
	let formattedPerformancePoints = $derived(Math.round(displayedPerformancePoints));
	let calculatedAccuracy = $derived(
		source === 'api' || source === 'merged' ? (accuracy * 100).toFixed(2) : accuracy
	);
	let formattedScore = $derived(score.toLocaleString());
	let formattedPlaycount = $derived(playcount.toLocaleString());
	let formattedRegistered = $derived(
		registered ? new Date(registered).toLocaleDateString() : 'N/A'
	);
	let formattedLastLogin = $derived(lastLogin ? timeAgo(lastLogin) : 'N/A');
	let countryName = $derived(getCountryName(country));

	function defaultAvatar(event: Event) {
		(event.target as HTMLInputElement).src = defaultAvatarImg;
	}

	const stats = $derived([
		{
			name: 'Performance Points',
			value: formattedPerformancePoints,
			id: 'pp',
			info: isSimulated ? 'simulated PP' : performancePoints,
			isSimulated
		},
		{ name: 'Score', value: formattedScore, id: 'score' },
		{ name: 'Hit Accuracy', value: `${calculatedAccuracy}%`, id: 'accuracy' },
		{ name: 'Play Count', value: formattedPlaycount, id: 'playcount' }
	]);
</script>

{#snippet userIdentity()}
	<div class="user-identity flex gap-3.5">
		<div class="user-avatar size-20 rounded-[10px] overflow-hidden">
			<img src={avatarLink} onerror={defaultAvatar} alt="User Avatar" />
		</div>
		<div class="user-info flex flex-col justify-end text-left">
			<h1 class="font-bold text-lg">{username}</h1>
			<p class="text-sm text-gray-400">
				<span class="rounded-xs fi fi-{country.toLowerCase()} mr-2"></span>{countryName}
			</p>
		</div>
	</div>
{/snippet}

{#snippet userRanking(title = '', value = 0)}
	<div class="global-ranking">
		<h3 class="text-sm text-gray-400">{title}</h3>
		<h1 class="font-bold text-lg">{isNaN(Number(value)) ? 'N/A' : `#${value ?? 0}`}</h1>
	</div>
{/snippet}

{#snippet userRankings()}
	<div class="user-rankings flex gap-7 px-2 text-left">
		{#if source === 'api' || source === 'merged'}
			{@render userRanking('Global Ranking', globalRanking)}
			{@render userRanking('Country Ranking', countryRanking)}
		{:else if source === 'scraper'}
			{@render userRanking('Score Ranking', scoreRanking)}
			{@render userRanking('PP Ranking', ppRanking)}
		{:else}
			{@render userRanking('No ranking data available')}
		{/if}
	</div>
{/snippet}

{#snippet userStats()}
	<table class="w-full text-sm max-w-100">
		<tbody>
			{#each stats as stat (stat.id)}
				<tr>
					<td class="py-0.5 tablet-sm:py-1 text-left">{stat.name}</td>
					<td
						class="py-0.5 tablet-sm:py-1 text-right font-bold"
						class:opacity-70={stat.isSimulated}
						use:tooltip={{ text: String(stat.info ?? '') }}
					>
						{stat.value}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/snippet}

{#snippet userDates()}
	<div class="registered-date">
		<h3 class="text-sm text-gray-400">Registered</h3>
		<h1 class="font-bold text-xs" use:tooltip={{ text: registered }}>{formattedRegistered}</h1>
	</div>
	<div class="last-login">
		<h3 class="text-sm text-gray-400">Last Login</h3>
		<h1 class="font-bold text-xs" use:tooltip={{ text: lastLogin }}>{formattedLastLogin}</h1>
	</div>
{/snippet}

<ContentCard>
	<div
		class="
		user-info
		flex flex-col gap-2.5
		tablet-sm:grid tablet-sm:grid-cols-[2fr_1fr_3fr] tablet-sm:gap-8"
	>
		<div class="flex flex-col gap-2.5">
			{@render userIdentity()}
			{@render userRankings()}
		</div>

		<!-- Separators -->
		<div class="hidden tablet-sm:flex justify-center items-center">
			<span class="vr"></span>
		</div>

		<div class="tablet-sm:hidden justify-center items-center">
			<hr class="hr w-full tablet-sm:invisible" />
		</div>

		<div class="user-stats flex flex-col justify-center w-full px-2">
			{@render userStats()}
		</div>
		{#if source === 'api' || source === 'merged'}
			<div class="tablet-sm:hidden justify-center items-center">
				<hr class="hr w-full tablet-sm:invisible" />
			</div>

			<div class="user-dates tablet-sm:hidden flex gap-7 px-2 text-left">
				{@render userDates()}
			</div>
		{/if}
	</div>
	{#if source === 'api' || source === 'merged'}
		<div class="user-dates hidden tablet-sm:flex gap-7 px-2 pt-2 text-left">
			{@render userDates()}
		</div>
	{/if}
</ContentCard>
