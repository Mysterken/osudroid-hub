<script lang="ts">
	import {
		ActivityIcon,
		ChartNoAxesColumn,
		ChevronDownIcon,
		MedalIcon,
		SearchIcon,
		SquareIcon,
		TargetIcon,
		ZapIcon
	} from '@lucide/svelte';
	import { PlayerAnalyticsScanner } from '$lib/stores/analyticsScanner.svelte';
	import { Collapsible } from '@skeletonlabs/skeleton-svelte';
	import { formatRelativeTime } from '$lib/utils/time';
	import { tooltip } from '$lib/actions/tooltip';
	import TimelineChart from '$lib/components/users/analytics/TimelineChart.svelte';
	import type { Play } from '$lib/models/play';
	import { getColorFromRank } from '$lib/utils/colors';

	let {
		scanner,
		totalPlayCount = 0,
		top50Plays = []
	}: {
		scanner: PlayerAnalyticsScanner;
		totalPlayCount?: number;
		top50Plays?: Play[];
	} = $props();

	let open = $state(false);

	// Global Request & ETA
	let estimatedPages = $derived(Math.max(1, Math.ceil(totalPlayCount / 100)));

	let reqLeft = $derived.by(() => {
		if (scanner.status === 'idle' || scanner.status === 'done' || scanner.status === 'failed')
			return 0;

		let left = 0;
		if (
			scanner.status === 'scraping_profile' ||
			(scanner.status === 'rate_limited' && scanner.hashesTotal === 0)
		) {
			left += Math.max(0, estimatedPages - scanner.pagesFetched);
		}
		if (scanner.hashesTotal > 0) {
			left += Math.max(0, scanner.hashesTotal - scanner.hashesChecked);
		}

		return left;
	});

	let progressDetail = $derived.by(() => {
		if (reqLeft <= 0) return '';

		// Realistic active fetching time (Burst speed: ~50ms per request)
		const requestTime = reqLeft * 0.05;

		// Rate Limit Bottleneck (20 requests / minute)
		const futurePenalties = Math.floor((reqLeft - 1) / 20);
		const penaltyTime = Math.max(0, futurePenalties) * 60;

		// Total ETA calculation
		const totalSecondsLeft = requestTime + penaltyTime + (scanner.rateLimitCountdown || 0);

		const m = Math.floor(totalSecondsLeft / 60);
		const s = Math.floor(totalSecondsLeft % 60);

		return `${reqLeft} reqs left (~${m}m ${s}s)`;
	});

	let progressPercent = $derived.by(() => {
		if (scanner.status === 'done') return 100;
		if (scanner.status === 'idle') return 0;

		const completedReqs = scanner.pagesFetched + scanner.hashesChecked;
		const totalReqs = estimatedPages + scanner.hashesTotal;

		return Math.min(99, Math.round((completedReqs / Math.max(1, totalReqs)) * 100));
	});

	let progressText = $derived.by(() => {
		if (scanner.status === 'rate_limited')
			return `Rate limit reached. Resuming in ${scanner.rateLimitCountdown}s...`;
		if (scanner.status === 'scraping_profile')
			return `${scanner.mode === 'quick' ? 'Quick' : 'Deep'} scan: scraping profile history (Page ${scanner.pagesFetched} / ${estimatedPages})...`;
		if (scanner.status === 'scanning_firsts')
			return `Verifying #1 scores (${scanner.hashesChecked} / ${scanner.hashesTotal})...`;
		if (scanner.status === 'failed') return `Scan Failed: ${scanner.error}`;
		return scanner.status === 'done'
			? `${scanner.mode === 'quick' ? 'Quick' : 'Deep'} scan complete`
			: 'Ready to Scan';
	});

	// Derived Top Stats
	let topMods = $derived(
		Object.entries(scanner.stats.mods)
			.sort(([, a], [, b]) => b.count - a.count)
			.slice(0, 5)
	);

	let topMappers = $derived(
		Object.entries(scanner.stats.mappers)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 5)
	);

	let topArtists = $derived(
		Object.entries(scanner.stats.artists)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 5)
	);

	let rankedFirstsCount = $derived(
		scanner.stats.firstPlaces.filter((fp) => Number(fp.MapPP) > 0).length
	);
	let unrankedFirstsCount = $derived(
		scanner.stats.firstPlaces.filter((fp) => Number(fp.MapPP) <= 0).length
	);

	let hits300 = $derived(scanner.stats.hits.perfect + scanner.stats.hits.geki);
	let hits100 = $derived(scanner.stats.hits.good + scanner.stats.hits.katu);
	let hits50 = $derived(scanner.stats.hits.bad);
	let hitsMiss = $derived(scanner.stats.hits.miss);
	let totalHits = $derived(hits300 + hits100 + hits50 + hitsMiss);
</script>

{#snippet scanControls()}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="flex items-center w-full xl:w-auto justify-end"
		onclick={(e) => e.stopPropagation()}
		onpointerdown={(e) => e.stopPropagation()}
	>
		{#if scanner.status === 'scraping_profile' || scanner.status === 'scanning_firsts' || scanner.status === 'rate_limited'}
			<button
				type="button"
				onclick={() => {
					scanner.stop();
				}}
				class="btn preset-filled-error-500 flex-1 xl:flex-none py-2 px-4 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02] shadow-sm flex items-center justify-center gap-2 whitespace-nowrap"
			>
				<SquareIcon size={16} class="fill-current shrink-0" /> Stop Scanner
			</button>
		{:else}
			<div class="flex flex-row w-full xl:w-auto gap-3">
				<button
					type="button"
					onclick={() => {
						open = true;
						scanner.start(true, 'quick', top50Plays);
					}}
					class="btn preset-tonal-secondary flex-1 xl:flex-none py-2 px-3 rounded-lg text-sm font-medium transition-all hover:preset-filled-secondary-500 flex items-center justify-center gap-1.5 whitespace-nowrap"
					title="Scan recent plays quickly"
				>
					<ZapIcon size={16} class="text-yellow-400 shrink-0" /> Quick Scan
				</button>

				<button
					type="button"
					onclick={() => {
						open = true;
						scanner.start(true, 'deep', top50Plays);
					}}
					class="btn preset-filled-primary-500 flex-1 xl:flex-none py-2 px-3 rounded-lg text-sm font-bold shadow-md shadow-pink-500/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-1.5 whitespace-nowrap"
					title="Thoroughly scan entire history"
				>
					<SearchIcon size={16} class="shrink-0" /> Deep Scan
				</button>
			</div>
		{/if}
	</div>
{/snippet}

{#snippet progressBar()}
	{#if scanner.status !== 'idle'}
		<div class="mb-6">
			<div
				class="flex justify-between items-end text-xs mb-1.5 font-medium {scanner.status ===
				'failed'
					? 'text-red-400'
					: 'text-gray-400'}"
			>
				<span>
					<span
						class={scanner.status === 'rate_limited'
							? 'text-yellow-400 animate-pulse'
							: scanner.status.includes('ing')
								? 'animate-pulse text-pink-400'
								: ''}
					>
						{progressText}
					</span>
					{#if progressDetail}
						<span class="text-gray-500 ml-2 block tablet-sm:inline">{progressDetail}</span>
					{/if}
				</span>
				<span class="text-lg font-bold">{progressPercent}%</span>
			</div>
			<progress
				class="progress h-1.5 w-full bg-gray-800 {scanner.status === 'rate_limited'
					? 'preset-filled-warning-500'
					: scanner.status === 'failed'
						? 'preset-filled-error-500'
						: 'preset-filled-primary-500'}"
				value={progressPercent}
				max="100"
			></progress>
		</div>
	{/if}
{/snippet}

{#snippet simpleList(items: [string, number][])}
	<ul class="space-y-1">
		{#each items as [name, count] (name)}
			<li class="flex items-center justify-between text-xs gap-2 overflow-hidden">
				<div class="text-scroll-container min-w-0 grow">
					<span class="text-scroll-content text-white" title={name}>{name}</span>
				</div>
				<span class="text-gray-500 font-mono shrink-0 pl-1">{count}x</span>
			</li>
		{/each}
	</ul>
{/snippet}

<Collapsible
	class="w-full bg-[#1E1E1E] border border-[#3C3C3C] rounded-xl text-white overflow-hidden"
	{open}
	onOpenChange={(details) => (open = details.open)}
>
	<div
		class="flex flex-col xl:flex-row justify-between items-start xl:items-center w-full hover:bg-[#252525] transition-colors"
	>
		<Collapsible.Trigger
			class="p-6 flex-1 flex w-full items-start xl:items-center gap-4 cursor-pointer text-left focus:outline-none"
		>
			<div class="flex items-center gap-3">
				<Collapsible.Indicator>
					<ChevronDownIcon
						size={20}
						class="text-gray-400 transition-transform duration-200"
						style="transform: rotate({open ? '180deg' : '0deg'})"
					/>
				</Collapsible.Indicator>
				<div>
					<h2 class="text-xl font-bold flex items-center gap-2">
						<ChartNoAxesColumn class="text-pink-500" /> Deep Analytics
					</h2>
					<p class="text-xs text-gray-400 mt-1">
						Processed {scanner.stats.playCount.toLocaleString()} plays • Scanned {scanner.hashesChecked.toLocaleString()}
						leaderboards
						{#if scanner.lastUpdated}
							<span class="ml-2 hidden phone-sm:inline"
								>• Last updated {formatRelativeTime(scanner.lastUpdated)}</span
							>
						{/if}
					</p>
				</div>
			</div>
		</Collapsible.Trigger>

		<div class="p-6 pt-0 xl:pt-6 xl:pl-0 flex items-center w-full xl:w-auto justify-end shrink-0">
			{@render scanControls()}
		</div>
	</div>

	<Collapsible.Content class="w-full p-6 pt-0 border-t border-[#3C3C3C]">
		<div class="pt-6">
			{@render progressBar()}

			{#if scanner.stats.playCount > 0}
				<div class="grid grid-cols-1 tablet-sm:grid-cols-3 gap-4">
					<div class="bg-[#2A2A2A] rounded-lg p-4 border border-[#3C3C3C]">
						<h3 class="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
							<MedalIcon size={16} class="text-yellow-400" /> Highlights
						</h3>
						<div class="space-y-3">
							<div class="grid grid-cols-[1fr_auto] items-center gap-x-4">
								<div class="flex flex-col justify-end">
									<span class="text-xs text-gray-400 leading-tight">Total #1 Scores</span>
									<span class="text-[10px] text-gray-500 mt-1 leading-tight"
										><span class="text-gray-300 font-semibold">{rankedFirstsCount}</span> Ranked
										<span class="mx-0.5 opacity-50">•</span>
										<span class="text-gray-300 font-semibold">{unrankedFirstsCount}</span> Unranked</span
									>
								</div>
								<span class="text-lg font-bold text-yellow-400"
									>{scanner.stats.firstPlaces.length}</span
								>
							</div>

							<div class="grid grid-cols-[1fr_auto] items-center gap-x-4">
								<span class="text-xs text-gray-400">Highest Score</span>
								<span class="text-lg font-bold text-white"
									>{scanner.stats.highestScore
										? scanner.stats.highestScore.score.toLocaleString()
										: '—'}</span
								>
							</div>

							<div class="grid grid-cols-[1fr_auto] items-center gap-x-4">
								<span class="text-xs text-gray-400">Highest Combo</span>
								<span class="text-lg font-bold text-green-400"
									>{scanner.stats.maxCombo.toLocaleString()}x</span
								>
							</div>

							<div class="grid grid-cols-[1fr_auto] items-center gap-x-4">
								<span class="text-xs text-gray-400">Total Hits</span>
								<span class="text-lg font-bold text-white">{totalHits.toLocaleString()}</span>
							</div>
						</div>
					</div>

					<div class="bg-[#2A2A2A] rounded-lg p-4 border border-[#3C3C3C]">
						<h3 class="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
							<TargetIcon size={16} class="text-blue-400" /> Grade Spread
						</h3>
						<div class="grid grid-cols-4 gap-2 text-center">
							{#each ['XH', 'SH', 'X', 'S', 'A', 'B', 'C', 'D'] as grade (grade)}
								<div class="bg-[#1E1E1E] rounded p-1.5 border border-[#3C3C3C]">
									<div class="text-[10px] font-bold" style="color: {getColorFromRank(grade)}">
										{grade}
									</div>
									<div class="text-xs font-semibold text-gray-300 mt-0.5">
										{scanner.stats.grades[grade] > 999
											? (scanner.stats.grades[grade] / 1000).toFixed(1) + 'k'
											: scanner.stats.grades[grade]}
									</div>
								</div>
							{/each}
						</div>
					</div>

					<div class="bg-[#2A2A2A] rounded-lg p-4 border border-[#3C3C3C]">
						<h3 class="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
							<ActivityIcon size={16} class="text-green-400" /> Accuracy Breakdown
						</h3>
						{#if totalHits > 0}
							<div class="space-y-2">
								<div class="w-full h-3 flex rounded-full overflow-hidden mb-2">
									<div style="width: {(hits300 / totalHits) * 100}%" class="bg-blue-400"></div>
									<div style="width: {(hits100 / totalHits) * 100}%" class="bg-green-400"></div>
									<div style="width: {(hits50 / totalHits) * 100}%" class="bg-yellow-500"></div>
									<div style="width: {(hitsMiss / totalHits) * 100}%" class="bg-red-500"></div>
								</div>
								<div class="flex justify-between text-[11px] font-medium">
									<span class="text-blue-400 cursor-help" use:tooltip={{ text: `${hits300}` }}
										>300: {((hits300 / totalHits) * 100).toFixed(1)}%</span
									>
									<span class="text-green-400 cursor-help" use:tooltip={{ text: `${hits100}` }}
										>100: {((hits100 / totalHits) * 100).toFixed(1)}%</span
									>
									<span class="text-yellow-500 cursor-help" use:tooltip={{ text: `${hits50}` }}
										>50: {((hits50 / totalHits) * 100).toFixed(1)}%</span
									>
									<span class="text-red-400 cursor-help" use:tooltip={{ text: `${hitsMiss}` }}
										>Miss: {((hitsMiss / totalHits) * 100).toFixed(1)}%</span
									>
								</div>
							</div>
						{/if}
					</div>

					<div class="bg-[#2A2A2A] rounded-lg p-4 border border-[#3C3C3C] tablet-sm:col-span-3">
						<TimelineChart stats={scanner.stats} />
					</div>

					<div class="bg-[#2A2A2A] rounded-lg p-4 border border-[#3C3C3C] tablet-sm:col-span-1">
						<h3 class="text-sm font-semibold text-gray-300 mb-3">Top Mod Combinations</h3>
						<ul class="space-y-2">
							{#each topMods as [modName, stats] (modName)}
								<li class="flex justify-between items-center text-xs">
									<span class="font-bold bg-[#1E1E1E] px-2 py-0.5 rounded border border-[#3C3C3C]"
										>{modName}</span
									>
									<div class="text-right">
										<span class="text-gray-400">{stats.count} plays</span>
										<span class="text-pink-400 font-semibold ml-2"
											>{stats.avgPp > 0 ? `${Math.round(stats.avgPp)} pp avg` : 'Unranked'}</span
										>
									</div>
								</li>
							{/each}
						</ul>
					</div>

					<div
						class="bg-[#2A2A2A] rounded-lg p-4 border border-[#3C3C3C] tablet-sm:col-span-2 desktop-sm:col-span-2 grid grid-cols-2 gap-4"
					>
						<div class="min-w-0">
							<h3 class="text-sm font-semibold text-gray-300 mb-2">Favorite Artists</h3>
							{@render simpleList(topArtists)}
						</div>
						<div class="min-w-0">
							<h3 class="text-sm font-semibold text-gray-300 mb-2">Favorite Mappers</h3>
							{@render simpleList(topMappers)}
						</div>
					</div>
				</div>
			{:else if scanner.status === 'idle'}
				<div class="text-center py-8 text-gray-500 text-sm">
					Click "Deep Scan" or "Quick Scan" to analyze this player's history locally.
				</div>
			{/if}
		</div>
	</Collapsible.Content>
</Collapsible>
