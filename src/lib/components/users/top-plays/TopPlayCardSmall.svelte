<script lang="ts">
	import { ChevronDownIcon } from '@lucide/svelte';
	import { tooltip } from '$lib/actions/tooltip';
	import { playUtils } from '$lib/utils/playUtils';
	import ModIcon from '$lib/components/ui/ModIcon.svelte';
	import LetterRank from '$lib/components/ui/LetterRank.svelte';
	import type { BeatmapExtended } from '$lib/models/osuApi/beatmap';
	import type { Play } from '$lib/models/play';

	let {
		index,
		filename,
		mods,
		score,
		combo,
		rank,
		miss,
		accuracy,
		pp,
		beatmap,
		play,
		openModal
	}: {
		index: number;
		filename: string;
		mods: (string | { acronym: string })[];
		score: number;
		combo: number;
		rank: string;
		miss: number;
		accuracy: number;
		pp: number | null;
		beatmap?: BeatmapExtended | null;
		play?: Play | null;
		openModal: (beatmap: BeatmapExtended | null | undefined, play?: Play | null) => void;
	} = $props();

	let isOpen = $state(false);

	function toggleDetails() {
		isOpen = !isOpen;
	}

	let formattedScore = $derived(score.toLocaleString());
	let formattedCombo = $derived(combo.toLocaleString());
	let calculatedAccuracy = $derived((accuracy * 100).toFixed(2));
	let formattedPP = $derived(pp ? Math.round(pp) : 0);
	let rawPP = $derived(Math.round(playUtils.calculateRawPP(pp, index + 1)));

	let { songArtist, songTitle, difficulty } = $derived(
		playUtils.convertTitleToBeatmapMetadata(filename)
	);

	let backgroundImg = $derived(
		beatmap?.beatmapset?.covers?.cover
			? `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${beatmap.beatmapset.covers.cover})`
			: 'url(/backgrounds/black_cube_pattern.webp)'
	);
</script>

{#snippet showoff()}
	<div
		class="
		flex counter
		bg-[#E5E5E5]
		size-6 min-w-6
		rounded-tl-[4px] rounded-br-[5px]
		text-black font-bold
		items-center justify-center"
	>
		<span>{index + 1}</span>
	</div>

	<div class="flex grow items-center" style="text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);">
		<div
			class="flex grow items-center"
			role="button"
			tabindex="0"
			onclick={() => openModal(beatmap, play)}
			onkeydown={(e) => e.key === 'Enter' && openModal(beatmap, play)}
		>
			{#if !isOpen}
				<LetterRank sx="text-2xl font-bold size-10" {rank} />
			{/if}

			<div class="text-left pl-2.5">
				<h2>{songTitle}</h2>
				<p class="leading-3.5 text-xs italic">{songArtist}</p>
				<p class="leading-3.5 text-[#E69F00] text-xs italic">{difficulty}</p>
			</div>
		</div>

		<button
			onclick={toggleDetails}
			class="transition-transform duration-300 ml-auto"
			aria-label="Toggle Details"
			style="transform: rotate({isOpen ? '180deg' : '0deg'})"
		>
			<ChevronDownIcon size={35} />
		</button>
	</div>
{/snippet}

{#snippet details()}
	<div class="flex items-center gap-1.5 font-bold">
		{#if isOpen}
			<LetterRank
				sx="
				flex
				w-14
				h-5
				text-white
				bg-[#2A2A2A]
				border-[#3C3C3C] border-[1px] rounded-[5px]
				items-center justify-center"
				{rank}
			/>
		{:else}
			<div class="mods flex gap-px">
				{#each mods as mod, i (i)}
					<ModIcon length={mods.length} {mod} />
				{/each}
			</div>
		{/if}
		<p>{calculatedAccuracy}%</p>
		<p class="ml-auto" use:tooltip={{ text: pp?.toFixed(2) + 'pp' }}>
			{formattedPP}<span class="text-[#505050]">pp</span>
		</p>
	</div>
	{#if isOpen}
		<div class="flex text-xs italic text-left gap-1.5">
			<div class="mods flex gap-px">
				{#each mods as mod, i (i)}
					<ModIcon {mod} />
				{/each}
			</div>
			<p>{formattedScore} / {formattedCombo}x / {miss} miss</p>
			<p
				class="ml-auto"
				use:tooltip={{ text: playUtils.calculateRawPP(pp, index + 1).toFixed(2) + 'pp' }}
			>
				({rawPP}<span class="text-[#505050]">pp</span>)
			</p>
		</div>
	{/if}
{/snippet}

<div
	class="
	top-play card
	border-color
 	border border-[#E5E5E5]
 	rounded-[5px]
 	w-full
 	transition-transform transform hover:scale-[1.01] hover:opacity-95 duration-200"
>
	<div
		class="showoff flex pr-5 min-h-17.5 rounded-t-[5px]"
		style="background-image: {backgroundImg}; background-size: cover; background-position: center;"
	>
		{@render showoff()}
	</div>

	<div
		class={`details
			flex flex-col
			text-black
			bg-[#E5E5E5]
			rounded-b-[4px]
			px-2.5
			py-auto
			justify-center
			${isOpen ? 'min-h-12.5' : 'min-h-7.5'}`}
	>
		{@render details()}
	</div>
</div>
