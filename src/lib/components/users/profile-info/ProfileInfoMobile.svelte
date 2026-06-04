<script lang="ts">
	import { tooltip } from '$lib/actions/tooltip';
	import ContentCard from '$lib/components/layouts/ContentCard.svelte';
	import { timeAgo } from '$lib/utils/time';
	import { getCountryName } from '$lib/utils/countries';
	import { getPlayerAvatarUrl } from '$lib/utils/user';

	let {
		id,
		source,
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
		id: string | number;
		source: 'api' | 'scraper' | 'merged';
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

	let isAvatarLoading = $state(true);

	let isBannerLoaded = $state(false);
	let isBannerError = $state(false);

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

	let bannerLink = $derived(`https://osudroid.moe/user/banner/${id}.png`);

	function handleAvatarLoad() {
		isAvatarLoading = false;
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
		<div class="user-avatar size-20 rounded-[10px] overflow-hidden shadow-lg relative shrink-0">
			{#if isAvatarLoading}
				<div class="absolute inset-0 placeholder animate-pulse"></div>
			{/if}
			<img
				src={getPlayerAvatarUrl(id)}
				onload={handleAvatarLoad}
				alt="User Avatar"
				class="w-full h-full object-cover relative z-10 transition-opacity duration-300 {isAvatarLoading
					? 'opacity-0'
					: 'opacity-100'}"
			/>
		</div>
		<div class="user-info flex flex-col justify-end text-left">
			<h1 class="font-bold text-xl text-white drop-shadow-md">{username}</h1>
			<p class="text-sm text-gray-300 drop-shadow-sm flex items-center mt-1">
				<span class="rounded-xs fi fi-{country.toLowerCase()} mr-2 shadow-sm"></span>{countryName}
			</p>
		</div>
	</div>
{/snippet}

{#snippet userRanking(title = '', value = 0)}
	<div class="global-ranking">
		<h3 class="text-sm text-gray-300 drop-shadow-sm">{title}</h3>
		<h1 class="font-bold text-lg text-white drop-shadow-md">
			{isNaN(Number(value)) ? 'N/A' : `#${value ?? 0}`}
		</h1>
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
					<td class="py-0.5 tablet-sm:py-1 text-left text-gray-300 drop-shadow-sm">{stat.name}</td>
					<td
						class="py-0.5 tablet-sm:py-1 text-right font-bold text-white drop-shadow-md"
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
		<h3 class="text-sm text-gray-300 drop-shadow-sm">Registered</h3>
		<h1 class="font-bold text-xs text-white drop-shadow-md" use:tooltip={{ text: registered }}>
			{formattedRegistered}
		</h1>
	</div>
	<div class="last-login">
		<h3 class="text-sm text-gray-300 drop-shadow-sm">Last Login</h3>
		<h1 class="font-bold text-xs text-white drop-shadow-md" use:tooltip={{ text: lastLogin }}>
			{formattedLastLogin}
		</h1>
	</div>
{/snippet}

<ContentCard sx="relative overflow-hidden">
	{#if !isBannerError}
		<div
			class="absolute top-0 inset-x-0 h-[45%] tablet-sm:inset-0 tablet-sm:h-full z-0 pointer-events-none transition-opacity duration-500 ease-out {isBannerLoaded
				? 'opacity-100'
				: 'opacity-0'}"
		>
			<img
				src={bannerLink}
				alt="{username} banner"
				class="w-full h-full object-cover object-center tablet-sm:object-left opacity-60 mask-[linear-gradient(to_bottom,black_50%,transparent_100%)] tablet-sm:mask-none"
				onload={() => (isBannerLoaded = true)}
				onerror={() => (isBannerError = true)}
			/>

			<div
				class="absolute inset-0 bg-linear-to-b from-black/80 to-transparent tablet-sm:bg-linear-to-r tablet-sm:from-black/90 tablet-sm:via-black/50 tablet-sm:to-black/90"
			></div>
		</div>
	{/if}

	<div
		class="
   relative z-10
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
			<span class="vr bg-gray-600/50"></span>
		</div>

		<div class="tablet-sm:hidden justify-center items-center">
			<hr class="hr w-full border-gray-600/50 tablet-sm:invisible" />
		</div>

		<div class="user-stats flex flex-col justify-center w-full px-2">
			{@render userStats()}
		</div>

		{#if source === 'api' || source === 'merged'}
			<div class="tablet-sm:hidden justify-center items-center">
				<hr class="hr w-full border-gray-600/50 tablet-sm:invisible" />
			</div>

			<div class="user-dates tablet-sm:hidden flex gap-7 px-2 text-left">
				{@render userDates()}
			</div>
		{/if}
	</div>

	{#if source === 'api' || source === 'merged'}
		<div class="user-dates relative z-10 hidden tablet-sm:flex gap-7 px-2 pt-2 text-left">
			{@render userDates()}
		</div>
	{/if}
</ContentCard>
