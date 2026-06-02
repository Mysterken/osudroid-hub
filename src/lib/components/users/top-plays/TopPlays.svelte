<script lang="ts">
	import ContentCard from '$lib/components/layouts/ContentCard.svelte';
	import { TrophyIcon } from '@lucide/svelte';
	import TopPlayCardSmall from '$lib/components/users/top-plays/TopPlayCardSmall.svelte';
	import TopPlayCardLarge from '$lib/components/users/top-plays/TopPlayCardLarge.svelte';
	import type { MergedPlay, Play } from '$lib/models/play';
	import ShowMoreButton from '$lib/components/ui/ShowMoreButton.svelte';
	import type { BeatmapExtended } from '$lib/models/osuApi/beatmap';

	let {
		topPlays,
		beatmaps,
		itemsToShow = $bindable(5),
		openModal
	}: {
		topPlays: Play[] | MergedPlay[];
		beatmaps: Map<string, BeatmapExtended | null>;
		itemsToShow: number;
		openModal: (beatmap: BeatmapExtended | null | undefined, play?: Play | null) => void;
	} = $props();
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
		<TrophyIcon class="tablet-sm:size-8" />
		<h1 class="font-bold text-lg">Top Plays</h1>
	</div>

	<!-- Top Plays -->
	<div class="flex flex-col gap-1 phone-sm:gap-1.5">
		<!-- Small Screen -->
		<div class="tablet-sm:hidden flex flex-col gap-1 phone-sm:gap-1.5">
			{#each topPlays.slice(0, itemsToShow) as topPlay, index (index)}
				<TopPlayCardSmall
					{index}
					filename={topPlay.Filename}
					mods={topPlay.Mods}
					score={topPlay.MapScore}
					combo={topPlay.MapCombo}
					rank={topPlay.MapRank}
					miss={topPlay.MapMiss}
					accuracy={topPlay.MapAccuracy}
					pp={topPlay.MapPP}
					play={topPlay}
					beatmap={beatmaps.get(topPlay.Hash ?? topPlay.Filename) ?? undefined}
					{openModal}
				/>
			{/each}
		</div>

		<!-- Large Screen -->
		<div class="hidden tablet-sm:flex flex-col gap-2">
			{#each topPlays.slice(0, itemsToShow) as topPlay, index (index)}
				<TopPlayCardLarge
					{index}
					filename={topPlay.Filename}
					mods={topPlay.Mods}
					score={topPlay.MapScore}
					combo={topPlay.MapCombo}
					rank={topPlay.MapRank}
					miss={topPlay.MapMiss}
					accuracy={topPlay.MapAccuracy}
					pp={topPlay.MapPP}
					play={topPlay}
					beatmap={beatmaps.get(topPlay.Hash ?? topPlay.Filename) ?? undefined}
					{openModal}
				/>
			{/each}
		</div>

		<ShowMoreButton steps={[5, 25, 50]} totalItems={topPlays.length} bind:itemsToShow />
	</div>
</ContentCard>
