<script lang="ts">
	import { TrophyIcon, PlayIcon, SquareIcon, ExternalLinkIcon } from '@lucide/svelte';
	import { playUtils } from '$lib/utils/playUtils';
	import { getDifficultyColor } from '$lib/utils/colors';
	import type { BeatmapExtended, Beatmapset } from '$lib/models/osuApi/beatmap';

	let {
		beatmap,
		beatmapset,
		availableBeatmaps,
		numericBeatmapId,
		onDifficultyChange
	}: {
		beatmap: BeatmapExtended;
		beatmapset: Beatmapset;
		availableBeatmaps: BeatmapExtended[];
		numericBeatmapId: number | null;
		onDifficultyChange: (id: number) => void;
	} = $props();

	let hoveredBeatmap = $state<BeatmapExtended | null>(null);
	let displayBeatmap = $derived(hoveredBeatmap || beatmap);

	// Audio State encapsulated perfectly inside this component!
	let audioEl = $state<HTMLAudioElement>();
	let isPlaying = $state(false);

	function playPreview(): void {
		if (!audioEl) return;
		if (isPlaying) {
			audioEl.pause();
			audioEl.currentTime = 0;
		} else {
			audioEl.play();
		}
		isPlaying = !isPlaying;
	}

	export function stopPreview(): void {
		if (audioEl) {
			audioEl.pause();
			audioEl.currentTime = 0;
		}
		isPlaying = false;
	}

	function getStatusLabel(status: number): string {
		const statusMap: Record<number, string> = {
			'-2': 'Graveyard',
			'-1': 'WIP',
			'0': 'Pending',
			'1': 'Ranked',
			'2': 'Approved',
			'3': 'Qualified',
			'4': 'Loved'
		};
		return statusMap[status] || 'Unknown';
	}

	function getStatusColor(status: number): string {
		const colorMap: Record<number, string> = {
			'-2': 'text-gray-500',
			'-1': 'text-gray-400',
			'0': 'text-yellow-500',
			'1': 'text-green-500',
			'2': 'text-blue-500',
			'3': 'text-cyan-500',
			'4': 'text-pink-500'
		};
		return colorMap[status] || 'text-gray-400';
	}
</script>

{#if beatmapset.preview_url}
	<audio bind:this={audioEl} src={beatmapset.preview_url} onended={() => (isPlaying = false)}
	></audio>
{/if}

<div class="relative rounded-xl overflow-hidden bg-[#1E1E1E] border border-gray-800 flex flex-col">
	{#if beatmapset.covers?.cover}
		<div class="absolute inset-0 z-0">
			<img
				src={beatmapset.covers.cover}
				alt="Beatmap background"
				class="w-full h-full object-cover opacity-60 blur-sm"
			/>
			<div
				class="absolute inset-0 bg-gradient-to-t from-[#1E1E1E] via-[#1E1E1E]/80 to-transparent"
			></div>
		</div>
	{/if}

	{#if availableBeatmaps.length > 0}
		<div
			class="relative z-10 w-full bg-black/40 border-b border-[#3C3C3C]/50 px-6 py-3 flex flex-col gap-2"
		>
			<div class="flex items-center gap-2 h-6">
				<span class="text-sm font-bold text-white drop-shadow-md"
					>{displayBeatmap?.version ?? ''}</span
				>
				<span class="text-yellow-400 font-bold text-sm drop-shadow-md"
					>★ {displayBeatmap?.difficulty_rating?.toFixed(2) ?? '0.00'}</span
				>
			</div>

			<div class="flex gap-1.5 overflow-x-auto no-scrollbar pl-1 py-1 items-center">
				{#each availableBeatmaps as diff (diff.id)}
					<button
						type="button"
						onmouseenter={() => (hoveredBeatmap = diff)}
						onmouseleave={() => (hoveredBeatmap = null)}
						onclick={() => onDifficultyChange(diff.id)}
						aria-label={diff.version}
						class="size-[22px] shrink-0 rounded-full border-[2.5px] transition-all duration-200 {diff.id ===
						numericBeatmapId
							? 'border-white scale-110'
							: 'border-transparent opacity-60 hover:opacity-100 hover:scale-110'}"
						style="background-color: {getDifficultyColor(diff.difficulty_rating)};"
					></button>
				{/each}
			</div>
		</div>
	{/if}

	<div class="relative z-10 p-6 tablet-sm:p-8">
		<div class="flex flex-col tablet-sm:flex-row gap-4 items-start">
			{#if beatmapset.covers?.cover}
				<img
					src={beatmapset.covers.cover}
					alt="Beatmap cover"
					class="w-full tablet-sm:w-48 h-32 tablet-sm:h-32 object-cover rounded-lg shadow-lg shrink-0"
				/>
			{:else}
				<div
					class="w-full tablet-sm:w-48 h-32 rounded-lg bg-[#2A2A2A] flex items-center justify-center shrink-0"
				>
					<TrophyIcon size={48} class="text-gray-500" />
				</div>
			{/if}

			<div class="flex-1 min-w-0 space-y-3">
				<div>
					<h1 class="text-3xl tablet-sm:text-4xl font-extrabold text-white leading-tight">
						{beatmapset.title ?? 'Unknown Title'}
					</h1>
					<p class="text-gray-300 text-lg mt-1">{beatmapset.artist ?? ''}</p>
					<p class="text-gray-400 text-sm mt-1">
						mapped by <span class="text-white font-medium">{beatmapset.creator ?? 'Unknown'}</span>
					</p>
				</div>

				<div class="flex flex-wrap items-center gap-4 text-sm mt-2">
					<span class="text-gray-300"
						>Length: <span class="text-white font-medium"
							>{playUtils.formatLength(beatmap.total_length)}</span
						></span
					>
					<span class="text-gray-300"
						>BPM: <span class="text-white font-medium">{beatmap.bpm ?? 'N/A'}</span></span
					>
					<span class="text-gray-300"
						>CS: <span class="text-white font-medium">{beatmap.cs}</span></span
					>
					<span class="text-gray-300"
						>HP: <span class="text-white font-medium">{beatmap.drain}</span></span
					>
					<span class="text-gray-300"
						>OD: <span class="text-white font-medium">{beatmap.accuracy}</span></span
					>
					<span class="text-gray-300"
						>AR: <span class="text-white font-medium">{beatmap.ar}</span></span
					>

					{#if beatmap.ranked !== undefined}
						<div class="h-4 w-px bg-gray-600"></div>
						<span
							class="px-2 py-1 rounded text-xs font-bold {getStatusColor(
								beatmap.ranked
							)} bg-black/40 border border-current"
						>
							{getStatusLabel(beatmap.ranked)}
						</span>
					{/if}
				</div>

				<div class="flex flex-wrap items-center gap-3 mt-2">
					{#if beatmapset.preview_url}
						<button
							type="button"
							onclick={playPreview}
							class="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors"
						>
							{#if isPlaying}
								<SquareIcon size={16} /> Stop Preview
							{:else}
								<PlayIcon size={16} /> Play Preview
							{/if}
						</button>
					{/if}
					{#if beatmap.url}
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
						<a href={beatmap.url} target="_blank" rel="noopener noreferrer">
							<button
								type="button"
								class="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-sm font-semibold transition-colors"
							>
								View on osu! <ExternalLinkIcon size={16} />
							</button>
						</a>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
