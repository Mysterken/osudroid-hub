<script lang="ts">
	import ContentCard from '$lib/components/layouts/ContentCard.svelte';
	import { ChartPieIcon } from '@lucide/svelte';

	const stats = [
		{ name: 'Performance Points', width: 'w-12', id: 'pp' },
		{ name: 'Score', width: 'w-28', id: 'score' },
		{ name: 'Hit Accuracy', width: 'w-16', id: 'accuracy' },
		{ name: 'Play Count', width: 'w-12', id: 'playcount' }
	];
</script>

{#snippet userStats()}
	<div class="space-y-1">
		{#each stats as stat (stat.id)}
			<div class="flex justify-between items-center">
				<span class="text-left whitespace-nowrap">{stat.name}</span>
				<div class="placeholder animate-pulse ml-auto {stat.width}"></div>
			</div>
		{/each}
	</div>
{/snippet}

<ContentCard sx="!p-2.5 flex flex-col gap-2.5">
	<div class="flex items-center gap-3.5">
		<ChartPieIcon class="size-8" />
		<h1 class="font-bold text-lg">Statistics</h1>
	</div>
	<div class="user-stats flex flex-col justify-center w-full px-2">
		{@render userStats()}
	</div>
</ContentCard>
