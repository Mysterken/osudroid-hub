<script lang="ts">
	import ContentCard from '$lib/components/layouts/ContentCard.svelte';
	import { TrophyIcon, SearchIcon, SquareIcon, LoaderCircleIcon } from 'lucide-svelte';
	import { Switch } from '@skeletonlabs/skeleton-svelte';
	import LetterRank from '$lib/components/ui/LetterRank.svelte';
	import { tooltip } from '$lib/actions/tooltip';
	import type { PlayerAnalyticsScanner } from '$lib/stores/analyticsScanner.svelte';
	import type { BeatmapExtended } from '$lib/models/osuApi/beatmap';
	import { SvelteMap } from 'svelte/reactivity';
	import type { ApiPlay } from '$lib/models/play';
	import { playUtils } from '$lib/utils/playUtils';

	let {
		scanner,
		openModal,
		beatmaps = new SvelteMap<string, BeatmapExtended | null>()
	}: {
		scanner: PlayerAnalyticsScanner;
		openModal: (beatmap: BeatmapExtended | null | undefined, play?: ApiPlay | null) => void;
		beatmaps?: Map<string, BeatmapExtended | null>;
	} = $props();

	let showUnranked = $state(false);
	let sortBy = $state<'date-asc' | 'date-desc' | 'pp'>('date-desc');

	// Derived state for filtering and sorting First Places
	let filteredFirstPlaces = $derived(
		scanner.stats.firstPlaces.filter((fp) => showUnranked || (fp.MapPP && fp.MapPP > 0))
	);

	let sortedFirstPlaces = $derived(
		[...filteredFirstPlaces].sort((a, b) => {
			if (sortBy === 'pp') return (b.MapPP || 0) - (a.MapPP || 0);

			// Fallback to 0 if PlayedDate is missing to prevent sorting crashes
			const dateA = a.PlayedDate ? new Date(a.PlayedDate).getTime() : 0;
			const dateB = b.PlayedDate ? new Date(b.PlayedDate).getTime() : 0;

			if (sortBy === 'date-desc') return dateB - dateA;
			return dateA - dateB;
		})
	);

	let isScanning = $derived(
		['scraping_profile', 'scanning_firsts', 'rate_limited'].includes(scanner.status)
	);

	async function loadBeatmapModal(fp: ApiPlay) {
		const cacheKey = fp.Hash ?? fp.Filename;

		if (beatmaps && beatmaps.has(cacheKey)) {
			const cachedBeatmap = beatmaps.get(cacheKey) ?? null;
			openModal(cachedBeatmap, fp);
			return;
		}

		openModal(null, fp);

		try {
			const response = await fetch('/api/beatmaps', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ lookups: [{ hash: fp.Hash, filename: fp.Filename }] })
			});

			if (response.ok) {
				const data = await response.json();

				const fetchedBeatmap: BeatmapExtended | null = data.length > 0 ? data[0].beatmap : null;
				beatmaps?.set(cacheKey, fetchedBeatmap);
				openModal(fetchedBeatmap, fp);
			}
		} catch (err) {
			console.error('Failed to load beatmap modal', err);
		}
	}
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
		class="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 tablet-sm:gap-4 w-full"
	>
		<div class="flex items-center gap-2 tablet-sm:gap-3 shrink-0">
			<TrophyIcon class="tablet-sm:size-8 text-yellow-400" />
			<h1 class="font-bold text-lg text-white whitespace-nowrap">First Place Ranks</h1>

			{#if scanner.stats.firstPlaces.length > 0}
				<span
					class="text-xs bg-[#2A2A2A] px-2 py-1 rounded text-gray-400 border border-[#3C3C3C] hidden phone-sm:inline-block ml-2"
				>
					{sortedFirstPlaces.length} scores
				</span>
			{/if}
		</div>

		{#if scanner.stats.firstPlaces.length > 0}
			<div
				class="flex flex-col tablet-sm:flex-row w-full xl:w-auto justify-between xl:justify-end items-stretch tablet-sm:items-center gap-3 shrink-0"
			>
				<select
					bind:value={sortBy}
					class="select bg-[#2A2A2A] text-xs text-gray-300 border border-[#3C3C3C] rounded px-3 py-1.5 outline-none hover:border-gray-400 transition-colors cursor-pointer w-full tablet-sm:w-44 pr-8 shrink-0"
				>
					<option value="date-desc">Date (Latest)</option>
					<option value="date-asc">Date (Earliest)</option>
					<option value="pp">PP (Highest)</option>
				</select>

				<Switch
					checked={showUnranked}
					onCheckedChange={(e) => (showUnranked = e.checked)}
					name="unranked-toggle"
					class="flex items-center justify-between tablet-sm:justify-start gap-2 cursor-pointer shrink-0 py-1"
				>
					<Switch.Label
						class="text-xs text-gray-400 font-medium cursor-pointer hover:text-white transition-colors whitespace-nowrap"
					>
						Include Unranked
					</Switch.Label>
					<Switch.Control><Switch.Thumb /></Switch.Control>
					<Switch.HiddenInput />
				</Switch>
			</div>
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
				<div class="flex flex-col gap-1 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
					{#each sortedFirstPlaces as fp (fp.Hash || fp.Filename)}
						{@const meta = playUtils.convertTitleToBeatmapMetadata(fp.Filename)}
						<div
							class="flex items-center bg-[#1E1E1E] p-2 phone-sm:px-4 rounded-lg border border-[#3C3C3C] hover:border-pink-500 hover:bg-[#252525] transition-all group shrink-0 cursor-pointer gap-3 phone-sm:gap-4 overflow-hidden"
							onclick={() => loadBeatmapModal(fp)}
							onkeydown={(e) => e.key === 'Enter' && loadBeatmapModal(fp)}
							role="button"
							tabindex="0"
						>
							<LetterRank
								rank={fp.MapRank || 'S'}
								sx="flex size-[32px] min-w-[32px] text-sm phone-sm:size-[40px] phone-sm:min-w-[40px] text-white font-bold phone-sm:text-lg bg-[#2A2A2A] border-[#3C3C3C] border-[1px] rounded-[5px] items-center justify-center shadow-sm"
							/>

							<div class="min-w-0 grow text-left overflow-hidden">
								<div class="text-scroll-container">
									<p
										class="text-scroll-content text-sm phone-sm:text-base font-bold text-white group-hover:text-pink-400 transition-colors"
									>
										{meta.songTitle}
										<span class="text-yellow-400 text-xs font-semibold ml-1"
											>[{meta.difficulty}]</span
										>
									</p>
								</div>
								<div class="text-scroll-container mt-0.5">
									<p class="text-scroll-content text-xs text-gray-400">
										{meta.songArtist}
									</p>
								</div>
							</div>

							<div class="text-right shrink-0 flex flex-col items-end min-w-max pl-2 gap-1">
								<p class="text-pink-400 font-bold text-sm phone-sm:text-base leading-none">
									{fp.MapPP && fp.MapPP > 0 ? `${Math.round(fp.MapPP)}pp` : 'Unranked'}
								</p>

								{#if fp.Mods && fp.Mods.length > 0 && fp.Mods[0] !== 'NM'}
									<span
										class="bg-[#2A2A2A] text-gray-300 border border-[#3C3C3C] px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider"
									>
										+{fp.Mods.map((m) => (typeof m === 'string' ? m : m.acronym)).join('')}
									</span>
								{/if}

								<div
									class="flex items-center justify-end gap-1.5 text-xs font-semibold text-gray-300"
								>
									<span>{(fp.MapAccuracy * 100).toFixed(2)}%</span>

									<span
										class="text-gray-500 text-[10px] font-normal border-l border-[#3C3C3C] pl-1.5"
										use:tooltip={{
											text: fp.PlayedDate ? new Date(fp.PlayedDate).toLocaleString() : ''
										}}
									>
										{fp.PlayedDate ? new Date(fp.PlayedDate).toLocaleDateString() : 'Unknown Date'}
									</span>
								</div>
							</div>
						</div>
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

	/* Marquee effect */
	.text-scroll-container {
		container-type: inline-size;
		overflow: hidden;
		width: 100%;
	}

	.text-scroll-content {
		display: inline-block;
		white-space: nowrap;
		width: max-content;
		animation: auto-scroll 6s linear infinite alternate;
	}

	@keyframes auto-scroll {
		0%,
		15% {
			transform: translateX(0);
		}
		85%,
		100% {
			transform: translateX(min(0px, calc(100cqw - 100%)));
		}
	}
</style>
