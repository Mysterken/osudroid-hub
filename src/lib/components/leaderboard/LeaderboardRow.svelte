<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatNumber, getRankColor, getRankIcon } from '$lib/utils/leaderboard';
	import type { Snippet } from 'svelte';
	import { getPlayerAvatarUrl } from '$lib/utils/user';

	interface Props {
		userId: number;
		username: string;
		country?: string;
		rank: number;
		primaryValue: number;
		primaryLabel: string;
		accuracy: number;
		playcount: number;
		extraCells?: Snippet;
	}

	let {
		userId,
		username,
		country,
		rank,
		primaryValue,
		primaryLabel,
		accuracy,
		playcount,
		extraCells
	}: Props = $props();

	let isAvatarLoading = $state(true);

	const rankColor = $derived(getRankColor(rank));
	const RankIcon = $derived(getRankIcon(rank));

	function handleAvatarLoad() {
		isAvatarLoading = false;
	}
</script>

<tr class="border-b border-gray-800 hover:bg-[#333333] transition-colors">
	<td class="px-6 py-4">
		<div class="flex items-center gap-2">
			{#if RankIcon}
				<RankIcon size={20} class={rankColor} />
			{/if}
			<span class="text-white font-semibold {rankColor}">#{rank}</span>
		</div>
	</td>
	<td class="px-6 py-3">
		<a
			href={resolve(`/users/${userId}`)}
			class="flex items-center gap-3 hover:opacity-80 transition-opacity"
		>
			<div class="relative size-10">
				{#if isAvatarLoading}
					<div class="absolute inset-0 rounded-full bg-gray-700 animate-pulse"></div>
				{/if}
				<img
					src={getPlayerAvatarUrl(userId)}
					alt={username}
					class="size-10 rounded-full bg-gray-700 {isAvatarLoading
						? 'opacity-0'
						: 'opacity-100'} transition-opacity duration-300"
					onload={handleAvatarLoad}
				/>
			</div>
			<div class="flex items-center gap-2">
				{#if country}
					<span class="rounded-xs fi fi-{country.toLowerCase()} text-sm text-gray-400"></span>
				{/if}
				<span class="text-white font-medium">{username}</span>
			</div>
		</a>
	</td>
	<td class="px-6 py-4 text-right">
		<span class="text-white font-semibold">{formatNumber(primaryValue)}</span>
		<span class="text-gray-400 text-sm ml-1">{primaryLabel}</span>
	</td>
	<td class="px-6 py-4 text-right">
		<span class="text-white">{accuracy.toFixed(2)}%</span>
	</td>
	<td class="px-6 py-4 text-right text-gray-400">
		{formatNumber(playcount)}
	</td>
	{#if extraCells}
		{@render extraCells()}
	{/if}
</tr>
