<script lang="ts">
	import SearchBar from '$lib/components/ui/SearchBar.svelte';
	import ContentLayout from '$lib/components/layouts/ContentLayout.svelte';
	import Footer from '$lib/components/layouts/Footer.svelte';
	import LeaderboardFilters from '$lib/components/leaderboard/LeaderboardFilters.svelte';
	import LeaderboardTable from '$lib/components/leaderboard/LeaderboardTable.svelte';
	import LeaderboardRow from '$lib/components/leaderboard/LeaderboardRow.svelte';
	import LeaderboardCard from '$lib/components/leaderboard/LeaderboardCard.svelte';
	import { TrophyIcon } from '@lucide/svelte';
	import type { LeaderboardPlayer } from '$lib/services/leaderboardService';
	import type { FilterDef } from '$lib/components/leaderboard/LeaderboardFilters.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { getLeaderboardCountries } from '$lib/utils/countries';
	import { computeRank } from '$lib/utils/leaderboard';

	const PLAYERS_PER_PAGE = 50;

	const countries = getLeaderboardCountries();

	let rankingType = $state<'pp' | 'score'>(
		(page.url.searchParams.get('type') as 'pp' | 'score') || 'pp'
	);
	let selectedCountry = $state<string>(page.url.searchParams.get('country') || 'all');
	let currentPage = $state(parseInt(page.url.searchParams.get('page') || '1', 10));

	let isLoading = $state(true);
	let players = $state<LeaderboardPlayer[]>([]);
	let totalPages = $state(10);
	let totalCount = $state(0);

	let fetchController: AbortController | null = null;

	const filters = $derived<FilterDef[]>([
		{
			id: 'ranking-type',
			label: 'Ranking Type',
			value: rankingType,
			options: [
				{ value: 'pp', label: 'PP Ranking' },
				{ value: 'score', label: 'Score Ranking' }
			],
			onChange: (v) => handleFilterChange(v as 'pp' | 'score', selectedCountry)
		},
		{
			id: 'country-filter',
			label: 'Country Filter',
			value: selectedCountry,
			options: countries.map((c) => ({ value: c.code, label: c.name })),
			onChange: (v) => handleFilterChange(rankingType, v)
		}
	]);

	const columns = $derived([
		{ key: 'rank', label: 'Rank', align: 'left' as const, width: 'w-20' },
		{ key: 'player', label: 'Player', align: 'left' as const },
		{
			key: 'primary',
			label: rankingType === 'score' ? 'Score' : 'Performance',
			align: 'right' as const
		},
		{ key: 'accuracy', label: 'Accuracy', align: 'right' as const },
		{ key: 'playcount', label: 'Playcount', align: 'right' as const }
	]);

	async function fetchLeaderboard() {
		// Cancel any pending request
		if (fetchController) fetchController.abort();
		fetchController = new AbortController();
		const signal = fetchController.signal;
		isLoading = true;

		try {
			const response = await fetch(
				`/api/leaderboard?type=${rankingType}&country=${selectedCountry}&page=${currentPage}&limit=${PLAYERS_PER_PAGE}`,
				{ signal }
			);
			if (!response.ok) return;
			const data = await response.json();
			if (!signal.aborted) {
				players = data.players;
				totalPages = data.totalPages;
				totalCount = totalPages * PLAYERS_PER_PAGE;
			}
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') return;
			console.error('Failed to fetch leaderboard:', error);
		} finally {
			if (!signal.aborted) isLoading = false;
		}
	}

	function updateUrl() {
		const params = new URL(page.url).searchParams;
		params.delete('type');
		params.delete('country');
		params.delete('page');
		if (rankingType !== 'pp') params.set('type', rankingType);
		if (selectedCountry !== 'all') params.set('country', selectedCountry);
		if (currentPage !== 1) params.set('page', currentPage.toString());
		const qs = params.toString();
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(qs ? `?${qs}` : resolve('/leaderboard'), {
			keepFocus: true,
			noScroll: true,
			replaceState: false
		});
	}

	function handleFilterChange(type: 'pp' | 'score', country: string) {
		rankingType = type;
		selectedCountry = country;
		currentPage = 1;
		updateUrl();
		fetchLeaderboard();
	}

	function handlePageChange(p: number) {
		currentPage = p;
		updateUrl();
		fetchLeaderboard();
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	// Sync state with URL changes (browser back/forward) and fetch data
	$effect(() => {
		const urlType = (page.url.searchParams.get('type') as 'pp' | 'score') || 'pp';
		const urlCountry = page.url.searchParams.get('country') || 'all';
		const urlPage = parseInt(page.url.searchParams.get('page') || '1', 10);

		// Check if URL differs from current state
		const stateChanged =
			rankingType !== urlType || selectedCountry !== urlCountry || currentPage !== urlPage;

		// Update state to match URL
		if (stateChanged) {
			rankingType = urlType;
			selectedCountry = urlCountry;
			currentPage = urlPage;
		}

		// Always fetch with current state (whether from URL change or initial load)
		fetchLeaderboard();
	});
</script>

<svelte:head>
	<title>Leaderboard - osu!droid</title>
	<meta property="og:title" content="Leaderboard - osu!droid" />
	<meta
		property="og:description"
		content="View the top osu!droid players ranked by performance points, score, and more."
	/>
</svelte:head>

<SearchBar />

<ContentLayout>
	<div class="flex flex-col gap-6 py-6">
		<div class="flex items-center gap-4">
			<div class="flex items-center justify-center size-16 rounded-2xl">
				<TrophyIcon size={32} class="text-white" />
			</div>
			<div>
				<h1 class="text-3xl tablet-sm:text-4xl font-extrabold text-white">Leaderboard</h1>
				<p class="text-gray-400 mt-1">Top players in the osu!droid community</p>
			</div>
		</div>

		<LeaderboardFilters {filters} />

		<LeaderboardTable
			rows={players}
			{columns}
			{isLoading}
			{currentPage}
			{totalPages}
			pageSize={PLAYERS_PER_PAGE}
			{totalCount}
			emptyMessage="No players found"
			loadingMessage="Loading leaderboard..."
			onPageChange={handlePageChange}
			getRowKey={(player) => player.userId}
		>
			{#snippet row(player, i)}
				<LeaderboardRow
					userId={player.userId}
					username={player.username}
					country={player.country}
					rank={computeRank(currentPage, PLAYERS_PER_PAGE, i)}
					primaryValue={rankingType === 'score' ? (player.score ?? 0) : (player.pp ?? 0)}
					primaryLabel={rankingType === 'score' ? 'score' : 'pp'}
					accuracy={player.accuracy}
					playcount={player.playcount}
				/>
			{/snippet}
			{#snippet card(player, i)}
				<LeaderboardCard
					userId={player.userId}
					username={player.username}
					country={player.country}
					rank={computeRank(currentPage, PLAYERS_PER_PAGE, i)}
					primaryValue={rankingType === 'score' ? (player.score ?? 0) : (player.pp ?? 0)}
					primaryLabel={rankingType === 'score' ? 'score' : 'pp'}
					accuracy={player.accuracy}
					playcount={player.playcount}
				/>
			{/snippet}
		</LeaderboardTable>
	</div>
</ContentLayout>

<Footer />
