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
		extraDetails?: Snippet;
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
		extraDetails
	}: Props = $props();

	let isAvatarLoading = $state(true);

	const rankColor = $derived(getRankColor(rank));
	const RankIcon = $derived(getRankIcon(rank));

	function handleAvatarLoad() {
		isAvatarLoading = false;
	}
</script>

<a
	href={resolve(`/users/${userId}`)}
	class="block border-b border-gray-800 p-4 hover:bg-[#333333] transition-colors"
>
	<div class="flex items-center gap-3">
		<div class="flex items-center gap-1 w-12">
			{#if RankIcon}
				<RankIcon size={16} class={rankColor} />
			{/if}
			<span class="text-sm font-semibold {rankColor}">#{rank}</span>
		</div>

		<div class="relative size-12">
			{#if isAvatarLoading}
				<div class="absolute inset-0 rounded-full bg-gray-700 animate-pulse"></div>
			{/if}
			<img
				src={getPlayerAvatarUrl(userId)}
				alt={username}
				class="size-12 rounded-full bg-gray-700 {isAvatarLoading
					? 'opacity-0'
					: 'opacity-100'} transition-opacity duration-300"
				onload={handleAvatarLoad}
			/>
		</div>

		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-2 mb-1">
				{#if country}
					<span class="rounded-xs fi fi-{country.toLowerCase()} text-sm text-gray-400"></span>
				{/if}
				<span class="text-white font-medium truncate">{username}</span>
			</div>
			<div class="flex items-center gap-3 text-xs text-gray-400">
				<span>{formatNumber(primaryValue)} {primaryLabel}</span>
				<span>{accuracy.toFixed(2)}%</span>
				<span>{formatNumber(playcount)} plays</span>
			</div>
			{#if extraDetails}
				{@render extraDetails()}
			{/if}
		</div>
	</div>
</a>
