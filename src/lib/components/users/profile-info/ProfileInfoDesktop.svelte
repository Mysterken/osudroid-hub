<script lang="ts">
	import ContentCard from '$lib/components/layouts/ContentCard.svelte';
	import { getCountryName } from '$lib/utils/countries';
	import { getPlayerAvatarUrl } from '$lib/utils/user';

	let {
		id,
		username,
		country
	}: {
		id: string | number;
		username: string;
		country: string;
	} = $props();

	let isAvatarLoading = $state(true);

	let isBannerLoaded = $state(false);
	let isBannerError = $state(false);

	let countryName = $derived(getCountryName(country));

	let bannerLink = $derived(`https://osudroid.moe/user/banner/${id}.png`);

	function handleAvatarLoad() {
		isAvatarLoading = false;
	}
</script>

<ContentCard sx="user-info relative overflow-hidden flex">
	{#if !isBannerError}
		<div
			class="absolute inset-0 z-0 pointer-events-none transition-opacity duration-500 ease-out {isBannerLoaded
				? 'opacity-100'
				: 'opacity-0'}"
		>
			<img
				src={bannerLink}
				alt="{username} banner"
				class="w-full h-full object-cover opacity-60"
				onload={() => (isBannerLoaded = true)}
				onerror={() => (isBannerError = true)}
			/>
			<div class="absolute inset-0 bg-linear-to-r from-black/80 via-black/40 to-transparent"></div>
		</div>
	{/if}

	<div class="relative z-10 flex gap-4 w-full">
		<div class="user-avatar size-20 rounded-[10px] overflow-hidden shadow-lg relative">
			{#if isAvatarLoading}
				<div
					class="user-avatar size-[80px] rounded-[10px] placeholder animate-pulse absolute inset-0"
				></div>
			{/if}
			<img
				src={getPlayerAvatarUrl(id)}
				onload={handleAvatarLoad}
				alt="User Avatar"
				class="w-full h-full object-cover relative z-10 transition-opacity duration-300 {isAvatarLoading
					? 'opacity-0'
					: 'opacity-100'}"
			/>
		</div>
		<div class="user-info flex flex-col justify-end text-left">
			<h1 class="font-bold text-2xl text-white drop-shadow-md">{username}</h1>
			<p class="text-sm text-gray-300 drop-shadow flex items-center mt-1">
				<span class="rounded-xs fi fi-{country.toLowerCase()} mr-2"></span>{countryName}
			</p>
		</div>
	</div>
</ContentCard>
