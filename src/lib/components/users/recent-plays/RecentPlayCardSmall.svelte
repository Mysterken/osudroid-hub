<script lang="ts">
	import { tooltip } from '$lib/actions/tooltip';
	import { ChevronDownIcon } from '@lucide/svelte';
	import { playUtils } from '$lib/utils/playUtils';
	import LetterRank from '$lib/components/ui/LetterRank.svelte';
	import type { BeatmapExtended } from '$lib/models/osuApi/beatmap';
	import type { Play } from '$lib/models/play';

	let {
		filename,
		hash,
		mods,
		score,
		combo,
		rank,
		miss,
		accuracy,
		date,
		play,
		openModal,
		beatmaps
	}: {
		filename: string;
		hash?: string;
		mods: (string | { acronym: string })[];
		score: number;
		combo: number;
		rank: string;
		miss: number;
		accuracy: number;
		date: string | null;
		play?: Play | null;
		openModal: (beatmap: BeatmapExtended | null | undefined, play?: Play | null) => void;
		beatmaps: Map<string, BeatmapExtended | null>;
	} = $props();

	let isOpen = $state(false);

	function toggleDetails() {
		isOpen = !isOpen;
	}

	let formattedScore = $derived(score.toLocaleString());
	let formattedCombo = $derived(combo.toLocaleString());
	let calculatedAccuracy = $derived((accuracy * 100).toFixed(2));
	let formattedDate = $derived(date ? new Date(date).toLocaleString() : '');

	let { songArtist, songTitle, difficulty } = $derived(
		playUtils.convertTitleToBeatmapMetadata(filename.replaceAll('_', ' '))
	);

	let beatmap: BeatmapExtended | null | undefined = $derived(beatmaps.get(hash ?? filename));

	function loadBeatmapModal() {
		beatmap = beatmaps.get(hash ?? filename);
		openModal(beatmap, play);

		if (beatmap === undefined) {
			getBeatmap(filename, hash).then((data) => {
				beatmap = data;
				openModal(beatmap, play);
			});
		}
	}

	async function getBeatmap(filename?: string, hash?: string) {
		const response = await fetch('/api/beatmaps', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ lookups: [{ filename, hash }] })
		});

		if (!response.ok) return null;

		const data = await response.json();
		const beatmap = data.length > 0 ? data[0].beatmap : null;

		beatmaps.set(data[0]?.key ?? '', beatmap);

		return beatmap;
	}
</script>

<div
	class="
	recent-play
	card
	rounded-[5px]
	bg-[#E5E5E5] hover:bg-[#c9c9c9]
	text-black
	w-full
	transition-transform transform hover:scale-[1.01] hover:opacity-90 duration-200"
>
	<div class="showoff flex px-2.5 py-1 gap-1.5 min-h-10">
		{#if !isOpen}
			<LetterRank
				sx="
				flex
				size-[30px]
				min-w-[30px]
				my-auto
				text-white font-bold text-lg
				bg-[#2A2A2A]
				border-[#3C3C3C] border-[1px] rounded-[5px]
				items-center justify-center"
				{rank}
			/>
		{/if}

		<div
			class="text-left overflow-hidden grow"
			onclick={() => loadBeatmapModal()}
			onkeydown={(e) => e.key === 'Enter' && loadBeatmapModal()}
			role="button"
			tabindex="0"
		>
			<h2 class="text-sm leading-4">{songArtist} - {songTitle}</h2>
			<p class="text-xs text-[#505050] italic leading-3.5">{difficulty}</p>
		</div>

		<button
			aria-label="Toggle Details"
			class="transition-transform duration-300 ml-auto"
			onclick={toggleDetails}
			style="transform: rotate({isOpen ? '180deg' : '0deg'})"
		>
			<ChevronDownIcon color="#505050" size={25} />
		</button>
	</div>

	{#if isOpen}
		<div
			class="
			details
			flex justify-between items-center
			border-t border-[#2A2A2A] border-dashed
			rounded-b-[4px]
			px-2.5
			min-h-10"
		>
			<div class="flex gap-1.5 items-center">
				<LetterRank
					sx="
					flex
					size-[30px]
					text-white font-bold text-lg
					bg-[#2A2A2A]
					border-[#3C3C3C] border-[1px] rounded-[5px]
					items-center justify-center"
					{rank}
				/>

				<p class="text-[#505050] text-xs italic">{mods.length ? `+${mods.join('')}` : 'NM'}</p>
			</div>

			<div class="flex flex-col text-right">
				<p class="text-sm italic">
					{formattedScore} / {formattedCombo}x / {calculatedAccuracy}% / {miss} m
				</p>
				<p class="text-[0.5rem] text-[#505050] italic" use:tooltip={{ text: date }}>
					{formattedDate}
				</p>
			</div>
		</div>
	{/if}
</div>
