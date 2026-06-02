<script lang="ts">
	import ContentCard from '$lib/components/layouts/ContentCard.svelte';
	import { Disc3Icon } from '@lucide/svelte';
	import RecentPlayCardSmall from '$lib/components/users/recent-plays/RecentPlayCardSmall.svelte';
	import RecentPlayCardLarge from '$lib/components/users/recent-plays/RecentPlayCardLarge.svelte';
	import type { ApiPlay, Play, ScraperPlay } from '$lib/models/play.js';
	import ShowMoreButton from '$lib/components/ui/ShowMoreButton.svelte';
	import type { BeatmapExtended } from '$lib/models/osuApi/beatmap';
	import { SvelteMap } from 'svelte/reactivity';

	let {
		recentPlays,
		itemsToShow = $bindable(5),
		openModal
	}: {
		recentPlays: ApiPlay[] | ScraperPlay[];
		itemsToShow: number;
		openModal: (beatmap: BeatmapExtended | null | undefined, play?: Play | null) => void;
	} = $props();

	let beatmaps = new SvelteMap<string, BeatmapExtended | null>();
</script>

<ContentCard
	sx="
		flex flex-col gap-1
		phone-sm:gap-3
		phone-lg:gap-4
		tablet-sm:gap-5
		tablet-lg:gap-6"
>
	<!-- Header -->
	<div
		class="
			flex items-center gap-1
			phone-sm:gap-3
			phone-lg:gap-4
			tablet-sm:gap-5
			tablet-lg:gap-6"
	>
		<Disc3Icon class="tablet-sm:size-8" />
		<h1 class="font-bold text-lg">Recent Plays</h1>
	</div>

	<!-- Recent Plays -->
	<div class="flex flex-col gap-1 phone-sm:gap-1.5">
		<!-- Small Screen -->
		<div class="tablet-sm:hidden flex flex-col gap-1 phone-sm:gap-1.5">
			{#each recentPlays.slice(0, itemsToShow) as recentPlay, index (index)}
				<RecentPlayCardSmall
					filename={recentPlay.Filename}
					hash={recentPlay.Hash}
					mods={recentPlay.Mods}
					score={recentPlay.MapScore}
					combo={recentPlay.MapCombo}
					rank={recentPlay.MapRank}
					miss={recentPlay.MapMiss}
					accuracy={recentPlay.MapAccuracy}
					date={recentPlay.PlayedDate ?? null}
					play={recentPlay}
					{openModal}
					{beatmaps}
				/>
			{/each}
		</div>

		<!-- Large Screen -->
		<div class="hidden tablet-sm:flex flex-col gap-2">
			{#each recentPlays.slice(0, itemsToShow) as recentPlay, index (index)}
				<RecentPlayCardLarge
					filename={recentPlay.Filename}
					hash={recentPlay.Hash}
					mods={recentPlay.Mods}
					score={recentPlay.MapScore}
					combo={recentPlay.MapCombo}
					rank={recentPlay.MapRank}
					miss={recentPlay.MapMiss}
					accuracy={recentPlay.MapAccuracy}
					date={recentPlay.PlayedDate ?? null}
					play={recentPlay}
					{openModal}
					{beatmaps}
				/>
			{/each}
		</div>

		<ShowMoreButton bind:itemsToShow steps={[5, 25, 50]} totalItems={recentPlays.length} />
	</div>
</ContentCard>
