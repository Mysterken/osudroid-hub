<script lang="ts">
	import type { BeatmapExtended } from '$lib/models/osuApi/beatmap';
	import type { Play } from '$lib/models/play';
	import {
		ExternalLinkIcon,
		PlayIcon,
		SquareIcon,
		TrophyIcon,
		ActivityIcon,
		MapIcon
	} from 'lucide-svelte';
	import { SegmentedControl } from '@skeletonlabs/skeleton-svelte';
	import { convertTitleToBeatmapMetadata, playUtils } from '$lib/utils/playUtils';

	let {
		dialog = $bindable(),
		beatmap,
		play,
		isLoading = false // 🌟 New prop to gracefully suspend rendering!
	}: {
		dialog?: HTMLDialogElement;
		beatmap?: BeatmapExtended | null;
		play?: Play | null;
		isLoading?: boolean;
	} = $props();

	let audioEl = $state<HTMLAudioElement>();
	let isPlaying = $state(false);

	let activeTab = $state<string | null>('play');
	let currentPlayId = $state<string | null>(null);
	let currentBeatmapId = $state<number | null>(null);

	let bpm = $derived(beatmap?.bpm ?? 0);
	let maxCombo = $derived(beatmap?.max_combo ?? 0);

	let formattedPlayDate = $derived(
		play?.PlayedDate ? new Date(play.PlayedDate).toLocaleString() : null
	);
	let formattedAccuracy = $derived(play ? (play.MapAccuracy * 100).toFixed(2) + '%' : null);
	let formattedScore = $derived(play ? play.MapScore.toLocaleString() : null);

	let extendedPlay = $derived(
		play && 'MapPerfect' in play
			? (play as Play & {
					MapGeki: number;
					MapPerfect: number;
					MapKatu: number;
					MapGood: number;
					MapBad: number;
				})
			: null
	);

	let playId = $derived(play ? `${play.Filename}_${play.PlayedDate}` : null);
	let beatmapId = $derived(beatmap?.id ?? null);
	let contentChanged = $derived(playId !== currentPlayId || beatmapId !== currentBeatmapId);

	let fallbackMeta = $derived(play ? convertTitleToBeatmapMetadata(play.Filename) : null);
	let displayTitle = $derived(
		beatmap?.beatmapset?.title || fallbackMeta?.songTitle || 'Unknown Title'
	);
	let displayArtist = $derived(
		beatmap?.beatmapset?.artist || fallbackMeta?.songArtist || 'Unknown Artist'
	);
	let displayVersion = $derived(
		beatmap?.version || fallbackMeta?.difficulty || 'Unknown Difficulty'
	);

	// 🌟 SAFELY check if it's a real map or a fallback map (id === 0)
	let leaderboardLink = $derived(
		beatmap && beatmap.id !== 0
			? `/leaderboard/beatmapsets/${beatmap.beatmapset_id}/${beatmap.id}`
			: play?.Hash
				? `/leaderboard/beatmapsets/0/${play.Hash}`
				: null
	);

	function playPreview() {
		if (!audioEl) return;
		if (isPlaying) {
			audioEl.pause();
			audioEl.currentTime = 0;
		} else {
			audioEl.play();
		}
		isPlaying = !isPlaying;
	}

	function stopPreview() {
		if (audioEl) {
			audioEl.pause();
			audioEl.currentTime = 0;
		}
		isPlaying = false;
	}

	function handleClose() {
		stopPreview();
		document.body.style.overflow = '';
		currentPlayId = null;
		currentBeatmapId = null;
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === dialog) dialog?.close();
	}

	$effect(() => {
		if (dialog?.open) {
			document.body.style.overflow = 'hidden';

			if (contentChanged) {
				currentPlayId = playId;
				currentBeatmapId = beatmapId;
			}

			activeTab = play ? 'play' : 'beatmap';
		}
	});
</script>

{#if beatmap?.beatmapset?.preview_url}
	<audio
		bind:this={audioEl}
		src={beatmap.beatmapset.preview_url}
		onended={() => (isPlaying = false)}
	></audio>
{/if}

{#snippet metadata()}
	<h1 class="text-base font-bold leading-tight truncate" title={displayTitle}>
		{displayTitle}
	</h1>
	<h2 class="text-sm text-gray-400 truncate">{displayArtist}</h2>
	<h2 class="text-sm text-gray-300 mt-1">{displayVersion}</h2>

	{#if beatmap !== undefined}
		{#if beatmap && beatmap.id !== 0}
			<div class="flex gap-4 mt-2 text-xs">
				<p>
					Stars: <span class="text-white font-semibold">{beatmap.difficulty_rating.toFixed(2)}</span
					>
				</p>
				<p>
					Length: <span class="text-white font-semibold"
						>{playUtils.formatLength(beatmap.total_length)}</span
					>
				</p>
			</div>
		{:else}
			<div
				class="mt-2 text-[10px] text-yellow-500 font-semibold border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 rounded inline-block"
			>
				Unranked / Modified Map
			</div>
		{/if}
	{/if}
{/snippet}

{#snippet dataTable(
	title = '',
	stats = [{ id: 'id', label: 'label', value: 0 as string | number }]
)}
	<h3 class="font-semibold mb-1.5 text-left text-gray-200">{title}</h3>
	<table class="w-full text-left text-xs text-gray-400">
		<tbody>
			{#each stats as stat (stat.id)}
				<tr class="border-b border-[#3C3C3C] last:border-0">
					<td class="py-1 pr-2">{stat.label}</td>
					<td class="py-1 text-white font-bold">{stat.value}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/snippet}

<dialog
	bind:this={dialog}
	onclose={handleClose}
	onclick={handleBackdropClick}
	class="modal rounded-xl shadow-2xl max-w-md w-[95%] backdrop:bg-black/70
  top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
  "
>
	<div class="modal-content bg-[#1E1E1E] text-white p-5 tablet-sm:p-6 border border-[#3C3C3C]">
		{#if isLoading || (beatmap === undefined && play === undefined)}
			<div class="flex flex-col items-center justify-center py-10 gap-3">
				<p class="text-sm text-gray-400 font-medium animate-pulse">Loading map details...</p>
			</div>
		{:else}
			{#key `${playId}_${beatmapId}`}
				{#if beatmap || play}
					<div class="flex text-left">
						<div class="shrink-0">
							{#if beatmap?.beatmapset?.covers?.list}
								<img
									src={beatmap.beatmapset.covers.list}
									alt="Beatmap Cover"
									class="w-[100px] h-[100px] rounded-[5px] object-cover"
									loading="lazy"
								/>
							{:else}
								<div
									class="w-[100px] h-[100px] rounded-[5px] bg-[#2A2A2A] border border-[#3C3C3C] flex items-center justify-center"
								>
									<MapIcon size={32} class="text-gray-500" />
								</div>
							{/if}
							<button
								type="button"
								class="bg-[#3C4345] transition-colors text-sm w-[100px] mt-2 p-1.5 flex justify-center rounded-md disabled:opacity-50"
								onclick={playPreview}
								disabled={!beatmap?.beatmapset?.preview_url}
							>
								{#if isPlaying}
									<SquareIcon size={16} class="text-white" />
								{:else}
									<PlayIcon size={16} class="text-white" />
								{/if}
							</button>
						</div>
						<div class="ml-4 overflow-hidden flex flex-col justify-center">
							{@render metadata()}
						</div>
					</div>
				{/if}

				{#if play}
					<div class="mt-5 mb-4">
						<SegmentedControl
							value={activeTab}
							onValueChange={(details) => (activeTab = details.value)}
						>
							<SegmentedControl.Control class="bg-[#252525] p-1 rounded-lg">
								<SegmentedControl.Indicator class="bg-[#3C4345] shadow-sm" />
								<SegmentedControl.Item
									value="play"
									class="flex-1 data-selected:text-white text-gray-400 hover:text-gray-200"
								>
									<SegmentedControl.ItemText
										class="flex items-center justify-center gap-2 py-1.5 text-xs font-semibold"
									>
										<ActivityIcon size={14} /> Play Stats
									</SegmentedControl.ItemText>
									<SegmentedControl.ItemHiddenInput />
								</SegmentedControl.Item>
								{#if beatmap}
									<SegmentedControl.Item
										value="beatmap"
										class="flex-1 data-selected:text-white text-gray-400 hover:text-gray-200"
									>
										<SegmentedControl.ItemText
											class="flex items-center justify-center gap-2 py-1.5 text-xs font-semibold"
										>
											<MapIcon size={14} /> Map Info
										</SegmentedControl.ItemText>
										<SegmentedControl.ItemHiddenInput />
									</SegmentedControl.Item>
								{/if}
							</SegmentedControl.Control>
						</SegmentedControl>
					</div>
				{:else if beatmap}
					<div class="mt-5 mb-2"><hr class="border-[#3C3C3C]" /></div>
				{/if}

				<div class="w-full text-sm grid grid-cols-2 gap-4 px-1 min-h-[150px]">
					{#if activeTab === 'beatmap' && beatmap}
						<div>
							{@render dataTable('Difficulty', [
								{ id: 'cs', label: 'CS', value: beatmap.cs },
								{ id: 'hp', label: 'HP', value: beatmap.drain },
								{ id: 'od', label: 'OD', value: beatmap.accuracy },
								{ id: 'ar', label: 'AR', value: beatmap.ar }
							])}
						</div>
						<div>
							{@render dataTable('Statistics', [
								{ id: 'bpm', label: 'BPM', value: bpm },
								{ id: 'circles', label: 'Circles', value: beatmap.count_circles },
								{ id: 'sliders', label: 'Sliders', value: beatmap.count_sliders },
								{ id: 'max_combo', label: 'Max Combo', value: maxCombo }
							])}
						</div>
					{:else if activeTab === 'play' && play}
						<div>
							{@render dataTable('Score', [
								{ id: 'rank', label: 'Rank', value: play.MapRank },
								{ id: 'score', label: 'Score', value: formattedScore ?? '—' },
								{ id: 'accuracy', label: 'Accuracy', value: formattedAccuracy ?? '—' },
								{ id: 'combo', label: 'Combo', value: `${play.MapCombo}x` },
								{
									id: 'pp',
									label: 'PP',
									value: play.MapPP != null ? `${Math.round(play.MapPP)}pp` : '—'
								}
							])}
							{#if formattedPlayDate}
								<p class="text-[10px] text-gray-500 mt-2 leading-tight">
									Played on {formattedPlayDate}
								</p>
							{/if}
						</div>
						<div>
							{@render dataTable('Hits', [
								...(extendedPlay
									? [
											{ id: 'perfect', label: 'Perfect', value: extendedPlay.MapPerfect },
											{ id: 'geki', label: 'Geki', value: extendedPlay.MapGeki },
											{ id: 'katu', label: 'Katu', value: extendedPlay.MapKatu },
											{ id: 'good', label: 'Good', value: extendedPlay.MapGood },
											{ id: 'bad', label: 'Bad', value: extendedPlay.MapBad }
										]
									: []),
								{ id: 'miss', label: 'Miss', value: play.MapMiss }
							])}
						</div>
					{:else if !play && beatmap}
						<div>
							{@render dataTable('Difficulty', [
								{ id: 'cs', label: 'CS', value: beatmap.cs },
								{ id: 'hp', label: 'HP', value: beatmap.drain },
								{ id: 'od', label: 'OD', value: beatmap.accuracy },
								{ id: 'ar', label: 'AR', value: beatmap.ar }
							])}
						</div>
						<div>
							{@render dataTable('Statistics', [
								{ id: 'bpm', label: 'BPM', value: bpm },
								{ id: 'circles', label: 'Circles', value: beatmap.count_circles },
								{ id: 'sliders', label: 'Sliders', value: beatmap.count_sliders },
								{ id: 'max_combo', label: 'Max Combo', value: maxCombo }
							])}
						</div>
					{/if}
				</div>

				<div class="flex flex-col gap-2 mt-6">
					{#if leaderboardLink}
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
						<a href={leaderboardLink}>
							<button
								type="button"
								class="btn preset-filled-primary-500 text-white py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors w-full"
							>
								View Map Leaderboard
								<TrophyIcon size={16} />
							</button>
						</a>
					{/if}

					{#if beatmap?.url}
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
						<a href={beatmap.url} target="_blank" rel="noopener noreferrer">
							<button
								type="button"
								class="preset-filled-primary-500 bg-pink-600 hover:bg-pink-700 text-white py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors w-full"
							>
								View on osu!
								<ExternalLinkIcon size={16} />
							</button>
						</a>
					{/if}
				</div>
			{/key}
		{/if}
	</div>
</dialog>
