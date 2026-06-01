<script lang="ts">
	import ContentCard from '$lib/components/layouts/ContentCard.svelte';
	import { TrophyIcon, SearchIcon, SquareIcon, LoaderCircleIcon } from 'lucide-svelte';
	import { Switch } from '@skeletonlabs/skeleton-svelte';
	import { resolve } from '$app/paths';
	import type { PlayerAnalyticsScanner } from '$lib/stores/analyticsScanner.svelte';

	let {
		scanner
	}: {
		scanner: PlayerAnalyticsScanner;
	} = $props();

	let showUnranked = $state(false);

	// Derived state for filtering and sorting First Places
	let filteredFirstPlaces = $derived(
		scanner.stats.firstPlaces.filter((fp) => showUnranked || fp.pp > 0)
	);
	let sortedFirstPlaces = $derived([...filteredFirstPlaces].sort((a, b) => b.pp - a.pp));

	// Easily track if the scanner is actively doing work
	let isScanning = $derived(
		['scraping_profile', 'scanning_firsts', 'rate_limited'].includes(scanner.status)
	);
</script>

<ContentCard
	sx="
   flex flex-col gap-1
   phone-sm:gap-3
   phone-lg:gap-4
   tablet-sm:gap-5
   tablet-lg:gap-6"
>
	<div
		class="
    flex flex-col phone-sm:flex-row justify-between items-start phone-sm:items-center gap-3
    phone-sm:gap-3
    phone-lg:gap-4
    tablet-sm:gap-5
    tablet-lg:gap-6"
	>
		<div class="flex items-center gap-2 tablet-sm:gap-3">
			<TrophyIcon class="tablet-sm:size-8 text-yellow-400" />
			<h1 class="font-bold text-lg text-white">First Place Ranks</h1>

			{#if scanner.stats.firstPlaces.length > 0}
				<span
					class="text-xs bg-[#2A2A2A] px-2 py-1 rounded text-gray-400 border border-[#3C3C3C] hidden phone-sm:inline-block ml-2"
				>
					{scanner.stats.firstPlaces.length} scores
				</span>
			{/if}
		</div>

		{#if scanner.stats.firstPlaces.length > 0}
			<Switch
				checked={showUnranked}
				onCheckedChange={(e) => (showUnranked = e.checked)}
				name="unranked-toggle"
				class="flex items-center gap-2 cursor-pointer shrink-0"
			>
				<Switch.Label
					class="text-xs text-gray-400 font-medium cursor-pointer hover:text-white transition-colors"
				>
					Include Unranked
				</Switch.Label>
				<Switch.Control><Switch.Thumb /></Switch.Control>
				<Switch.HiddenInput />
			</Switch>
		{/if}
	</div>

	{#if isScanning}
		<div
			class="flex items-center justify-between bg-[#1E1E1E] p-3 rounded-lg border border-[#3C3C3C]"
		>
			<div class="flex items-center gap-3">
				<LoaderCircleIcon size={18} class="text-pink-500 animate-spin" />
				<span class="text-sm text-gray-300 font-medium">
					{#if scanner.hashesTotal > 0}
						Verifying map leaderboards: <span class="text-white font-bold"
							>{scanner.hashesChecked}</span
						>
						/ {scanner.hashesTotal}
					{:else}
						Fetching profile history...
					{/if}
				</span>
			</div>
			<button
				class="btn preset-filled-error-500 py-1.5 px-3 rounded-lg text-xs font-bold transition-transform hover:scale-[1.02] flex items-center gap-1.5"
				onclick={() => scanner.stop()}
			>
				<SquareIcon size={14} class="fill-current shrink-0" />
				<span class="hidden phone-sm:inline">Stop</span>
			</button>
		</div>
	{/if}

	<div class="flex flex-col gap-1 phone-sm:gap-1.5 min-h-[150px] justify-center">
		{#if scanner.stats.firstPlaces.length > 0}
			{#if sortedFirstPlaces.length === 0}
				<div
					class="text-center py-12 text-gray-500 text-sm bg-[#1E1E1E] rounded-lg border border-[#3C3C3C]/50"
				>
					No #1 scores match your current filters.
					{#if !showUnranked}
						<br /><span class="text-xs text-gray-600 mt-1 block"
							>Try toggling "Include Unranked" to see Loved/Graveyard scores.</span
						>
					{/if}
				</div>
			{:else}
				<div class="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
					{#each sortedFirstPlaces as fp (fp.hash)}
						<a
							href={resolve(`/leaderboard/beatmapsets/0/${fp.hash}`)}
							target="_blank"
							rel="noopener noreferrer"
							class="flex justify-between items-center bg-[#1E1E1E] p-3 phone-sm:p-4 rounded-lg border border-[#3C3C3C] hover:border-pink-500 hover:bg-[#252525] transition-all group shrink-0"
						>
							<div class="min-w-0 pr-4">
								<p
									class="text-sm phone-sm:text-base font-bold text-white truncate group-hover:text-pink-400 transition-colors"
								>
									{fp.title || 'Unknown Title'}
									<span class="text-yellow-400 text-xs font-semibold ml-1"
										>[{fp.difficulty || 'Unknown'}]</span
									>
								</p>
								<p class="text-xs text-gray-400 truncate mt-0.5">
									{fp.artist || 'Unknown Artist'} // mapped by {fp.mapper || 'Unknown'}
								</p>
							</div>

							<div class="text-right shrink-0 flex flex-col items-end">
								<p class="text-pink-400 font-bold text-sm phone-sm:text-base">
									{fp.pp > 0 ? `${Math.round(fp.pp)}pp` : 'Unranked'}
								</p>
								<p class="text-xs font-semibold text-gray-300 mt-0.5 flex items-center gap-2">
									<span>{(fp.accuracy * 100).toFixed(2)}%</span>
									{#if fp.mods && fp.mods !== 'NM'}
										<span
											class="bg-[#2A2A2A] text-gray-300 border border-[#3C3C3C] px-1.5 rounded text-[10px] font-bold"
										>
											+{fp.mods}
										</span>
									{/if}
								</p>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		{:else if isScanning}
			<div
				class="text-center py-12 text-gray-500 text-sm bg-[#1E1E1E] rounded-lg border border-[#3C3C3C]/50 flex flex-col items-center justify-center gap-3"
			>
				<SearchIcon size={28} class="text-gray-600 animate-pulse" />
				Searching for #1 scores...
			</div>
		{:else if scanner.mode === 'deep' && scanner.status === 'done'}
			<div
				class="text-center py-12 text-gray-500 text-sm bg-[#1E1E1E] rounded-lg border border-[#3C3C3C]/50"
			>
				No #1 scores found for this player.
			</div>
		{:else}
			<div
				class="text-center py-10 flex flex-col items-center gap-4 bg-[#1E1E1E] rounded-lg border border-[#3C3C3C]/50"
			>
				<TrophyIcon size={36} class="text-gray-600 mb-1" />
				<div class="space-y-1">
					<p class="text-white font-bold text-sm">#1 Leaderboard Verification Required</p>
					<p class="text-gray-400 text-xs max-w-sm mx-auto">
						First place ranks are verified against the global leaderboards. This requires a full
						history scan.
					</p>
				</div>
				<button
					class="btn preset-filled-primary-500 py-2 px-5 rounded-lg text-sm font-bold shadow-md shadow-pink-500/20 transition-transform hover:scale-[1.02] flex items-center"
					onclick={() => scanner.start(true, 'deep')}
				>
					<SearchIcon size={16} class="mr-2 inline" /> Run Deep Scan
				</button>
			</div>
		{/if}
	</div>
</ContentCard>

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 6px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: #1e1e1e;
		border-radius: 4px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: #3c3c3c;
		border-radius: 4px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: #4a4a4a;
	}
</style>
