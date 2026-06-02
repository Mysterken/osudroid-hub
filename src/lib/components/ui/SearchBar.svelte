<script lang="ts">
	import { LoaderCircle, Search, TrophyIcon } from 'lucide-svelte';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { toaster } from '$lib/utils/toaster';

	let searchQuery = $state('');
	let searchMode = $state<'user' | 'beatmap'>('user');
	let hidden = $state(false);
	let lastScrollY = $state(0);
	let isSearching = $state(false);

	const SET_MAP_REGEX = /beatmapsets\/(\d+)(?:#(?:osu|taiko|catch|mania)\/(\d+))?/;
	const MAP_REGEX = /\/(?:b|beatmaps)\/(\d+)/;
	const OLD_MAP_REGEX = /[?&]b=(\d+)/;
	const NUMBER_REGEX = /^\d+$/;
	const HASH_REGEX = /^[a-fA-F0-9]{32}$/i;

	// Smart parser to handle various osu! link formats + checksum hash
	function parseBeatmapInput(input: string) {
		let mapId: string | null = null;
		let setId: string | null = null;
		let hash: string | null = null;

		const trimmed = input.trim();

		if (SET_MAP_REGEX.test(trimmed)) {
			const match = trimmed.match(SET_MAP_REGEX);
			setId = match![1];
			mapId = match![2] || null;
		} else if (MAP_REGEX.test(trimmed)) {
			mapId = trimmed.match(MAP_REGEX)![1];
		} else if (OLD_MAP_REGEX.test(trimmed)) {
			mapId = trimmed.match(OLD_MAP_REGEX)![1];
		} else if (NUMBER_REGEX.test(trimmed)) {
			// If just a number is pasted, assume it's a specific Beatmap ID (most common)
			mapId = trimmed;
		} else if (HASH_REGEX.test(trimmed)) {
			hash = trimmed.toLowerCase();
		}

		return { mapId, setId, hash };
	}

	async function resolveBeatmapUrl(input: string) {
		const { mapId, setId, hash } = parseBeatmapInput(input);

		if (!mapId && !setId && !hash) {
			throw new Error('Please enter a valid Beatmap ID, beatmap hash, or osu! link.');
		}

		// Route 1: Hash Resolution
		if (hash) {
			return resolveFromHash(hash);
		}

		// Route 2: Missing Set ID (Fetch parent set)
		if (mapId && !setId) {
			return { setId: await fetchSetIdFromMapId(mapId), mapId };
		}

		// Route 3: Missing Map ID (Default to first difficulty)
		if (setId && !mapId) {
			return { setId, mapId: await fetchFirstMapIdFromSet(setId) };
		}

		// Route 4: We already have both IDs perfectly parsed
		return { setId, mapId };
	}

	async function resolveFromHash(hash: string) {
		try {
			const res = await fetch(`/api/beatmaps/${hash}`);
			if (res.ok) {
				const data = await res.json();
				return {
					setId: String(data.beatmapset_id ?? 0),
					mapId: String(data.id ?? hash)
				};
			}
		} catch (err) {
			console.warn('API unreachable, falling back to local hash routing.', err);
		}

		// Client-Side Safety Net
		return { setId: '0', mapId: hash };
	}

	async function fetchSetIdFromMapId(mapId: string): Promise<string> {
		const res = await fetch(`/api/beatmaps/${mapId}`);
		if (!res.ok) throw new Error('Beatmap not found on the server.');

		const data = await res.json();
		return String(data.beatmapset_id);
	}

	async function fetchFirstMapIdFromSet(setId: string): Promise<string> {
		const res = await fetch(`/api/beatmapset/${setId}`);
		if (!res.ok) throw new Error('Beatmapset not found on the server.');

		const data = await res.json();
		if (data.beatmaps && data.beatmaps.length > 0) {
			return String(data.beatmaps[0].id);
		}

		throw new Error('This beatmapset contains no maps.');
	}

	async function handleSearch(event: KeyboardEvent) {
		if (event.key === 'Enter' && searchQuery.trim() !== '' && !isSearching) {
			isSearching = true;
			try {
				const query = searchQuery.trim();

				if (searchMode === 'user') {
					const username = encodeURIComponent(query);
					const response = await fetch(`/api/users/search/${username}`);

					if (!response.ok) {
						await goto(resolve('/users/not-found'));
						return;
					}

					const userData = await response.json();
					sessionStorage.setItem(`user_${userData.UserId}`, JSON.stringify(userData));
					await goto(resolve(`/users/${userData.UserId}`));
				} else if (searchMode === 'beatmap') {
					// Handle the robust beatmap resolution
					const { setId, mapId } = await resolveBeatmapUrl(query);
					await goto(resolve(`/leaderboard/beatmapsets/${setId}/${mapId}`));
				}
			} catch (error) {
				console.error('Search error:', error);
				toaster.error({
					title: 'Search Error',
					description: error instanceof Error ? error.message : 'An error occurred while searching'
				});
			} finally {
				isSearching = false;
			}
		}
	}

	function handleScroll() {
		const currentScrollY = window.scrollY;
		hidden = currentScrollY > lastScrollY && currentScrollY > 80;
		lastScrollY = currentScrollY;
	}
</script>

<svelte:window onscroll={handleScroll} />

<nav
	class="
  bg-[#2A2A2A]
  sticky top-0 z-50
  transition-transform duration-300 ease-in-out
  {hidden ? '-translate-y-full' : 'translate-y-0'}
  desktop-sm:translate-y-0
  flex flex-col justify-center
  p-2 phone-sm:p-2.5 tablet-sm:p-3.5 desktop-sm:px-6 desktop-sm:py-4
  phone-sm:h16 tablet-sm:h-20 h-16"
>
	<div class="max-w-300 mx-auto w-full flex items-center gap-2 tablet-sm:gap-4">
		<a
			href={resolve('/')}
			class="flex items-center justify-center size-10 tablet-sm:size-12 shrink-0 p-1.5"
			aria-label="Home"
		>
			<img src="/favicon.png" alt="osu!droid hub logo" class="w-full h-full object-contain" />
		</a>

		<div
			class="flex items-center h-10 tablet-sm:h-12 grow max-w-3xl bg-[#565656] rounded-[10px] overflow-hidden"
		>
			<div class="flex items-center justify-center px-3 text-gray-300">
				{#if isSearching}
					<LoaderCircle size={16} class="animate-spin" />
				{:else}
					<Search size={16} />
				{/if}
			</div>

			<input
				class="flex-1 bg-transparent text-white outline-none placeholder-gray-400 text-sm h-full w-full min-w-0"
				type="search"
				aria-label="Search Input"
				placeholder={searchMode === 'user'
					? 'Search username...'
					: 'Paste beatmap ID, hash, or link...'}
				bind:value={searchQuery}
				onkeydown={handleSearch}
				disabled={isSearching}
			/>

			<div class="relative flex items-center bg-[#3C3C3C] h-full shrink-0">
				<select
					bind:value={searchMode}
					aria-label="Search Mode"
					class="appearance-none bg-transparent text-gray-200 font-semibold text-xs tablet-sm:text-sm outline-none border-none pl-3 pr-6 py-2 cursor-pointer focus:text-white h-full w-26 tablet-sm:w-32"
				>
					<option value="user" class="bg-[#2A2A2A]">Player</option>
					<option value="beatmap" class="bg-[#2A2A2A]">Beatmap</option>
				</select>
			</div>
		</div>

		<a
			href={resolve('/leaderboard')}
			class="flex items-center justify-center tablet-sm:px-4 size-10 tablet-sm:size-auto tablet-sm:py-2 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-[10px] transition-colors whitespace-nowrap shrink-0"
			aria-label="Leaderboard"
		>
			<TrophyIcon size={20} class="tablet-sm:hidden" />
			<span class="hidden tablet-sm:inline">Leaderboard</span>
		</a>
	</div>
</nav>
