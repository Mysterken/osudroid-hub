<script lang="ts">
	import type { ApiPlayer, MergedPlayer, ScraperPlayer } from '$lib/models/player';
	import ContentLayout from '$lib/components/layouts/ContentLayout.svelte';
	import SearchBar from '$lib/components/ui/SearchBar.svelte';
	import ProfileInfoMobile from '$lib/components/users/profile-info/ProfileInfoMobile.svelte';
	import ProfileInfoDesktop from '$lib/components/users/profile-info/ProfileInfoDesktop.svelte';
	import TopPlays from '$lib/components/users/top-plays/TopPlays.svelte';
	import RecentPlays from '$lib/components/users/recent-plays/RecentPlays.svelte';
	import RankingPanel from '$lib/components/users/side-stats/RankingPanel.svelte';
	import StatisticsPanel from '$lib/components/users/side-stats/StatisticsPanel.svelte';
	import UserInfoPanel from '$lib/components/users/side-stats/UserInfoPanel.svelte';
	import type { BeatmapExtended } from '$lib/models/osuApi/beatmap';
	import type { Play, ScraperPlay } from '$lib/models/play';
	import UserIsLoading from '$lib/components/skeletons/UserIsLoading.svelte';
	import UserNotFound from '$lib/components/users/not-found/UserNotFound.svelte';
	import Footer from '$lib/components/layouts/Footer.svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import BeatmapModal from '$lib/components/ui/BeatmapModal.svelte';
	import type { PageProps } from './$types';
	import { getUserField } from '$lib/utils/user';
	import { playUtils } from '$lib/utils/playUtils';
	import AnalyticsDashboard from '$lib/components/users/analytics/AnalyticsDashboard.svelte';
	import { page } from '$app/state';
	import { untrack } from 'svelte';
	import { PlayerAnalyticsScanner } from '$lib/stores/analyticsScanner.svelte';

	let { data }: PageProps = $props();

	let user = $derived<ApiPlayer | ScraperPlayer | MergedPlayer | null>(data?.user);

	let userId = $derived(page.params.uid);
	let globalRank = $derived(getUserField(data?.user, 'GlobalRank', 0)) as number;
	let countryRank = $derived(getUserField(data?.user, 'CountryRank', 0)) as number;
	let scoreRank = $derived(getUserField(data?.user, 'ScoreRank', 0)) as number;
	let ppRank = $derived(getUserField(data?.user, 'PPRank', 0)) as number;
	let registered = $derived(getUserField(data?.user, 'Registered', '')) as string;
	let lastLogin = $derived(getUserField(data?.user, 'LastLogin', '')) as string;

	let simulatedPP = $state(0);

	let beatmaps = new SvelteMap<string, BeatmapExtended | null>();

	let isLoading = $derived(!data?.user);
	let topPlaysToShow = $state(5);
	let recentPlaysToShow = $state(5);
	let isFetchingMore = false;

	let selectedBeatmap: BeatmapExtended | null | undefined = $state();
	let selectedPlay: Play | null = $state(null);
	let dialog: HTMLDialogElement | undefined = $state();

	let scanner = $state(new PlayerAnalyticsScanner(untrack(() => data?.user?.UserId ?? 0)));

	async function fetchUser(
		userId: string
	): Promise<ApiPlayer | ScraperPlayer | MergedPlayer | null> {
		try {
			// Check if we have cached data from search
			const cachedData =
				typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(`user_${userId}`) : null;

			if (cachedData) {
				sessionStorage.removeItem(`user_${userId}`);
				return JSON.parse(cachedData) as ApiPlayer | ScraperPlayer | MergedPlayer;
			}

			const response = await fetch(`/api/users/${userId}`);
			if (!response.ok) return null;
			return (await response.json()) as ApiPlayer | ScraperPlayer | MergedPlayer;
		} catch (error) {
			console.error('Error fetching user:', error);
			return null;
		}
	}

	async function fetchBeatmapsBatch(topPlays: Play[]) {
		try {
			const lookups = topPlays.map((play) => ({
				filename: play.Filename,
				hash: (play as ScraperPlay)?.Hash
			}));

			const response = await fetch('/api/beatmaps', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ lookups })
			});

			if (!response.ok) return;
			const data = await response.json();

			for (const item of data) {
				beatmaps.set(item.key, item.beatmap ?? null);
			}
		} catch (error) {
			console.error('Error fetching beatmaps batch:', error);
		}
	}

	async function fetchBeatmapsInRange(topPlays: Play[], start: number, end: number) {
		if (isFetchingMore || beatmaps.size >= topPlays.length) return;

		if (start >= 25) isFetchingMore = true;

		const slice = topPlays.slice(start, end);
		await fetchBeatmapsBatch(slice);

		if (start >= 25) isFetchingMore = false;
	}

	function openModal(beatmap: BeatmapExtended | null | undefined, play?: Play | null) {
		selectedBeatmap = beatmap;
		selectedPlay = play ?? null;
		dialog?.showModal();
	}

	function getDescription() {
		if (!user) return '';

		const rank = globalRank
			? `#${globalRank} Global`
			: countryRank
				? `#${countryRank} Country`
				: '';

		const accuracy = `${(user.OverallAccuracy * (user.Source === 'scraper' ? 1 : 100)).toFixed(2)}%`;

		let description = `${rank} • ${accuracy} • ${Math.round(user.OverallPP)} PP`;

		if (user.Top50Plays?.length) {
			const topPlaysInfo = user.Top50Plays.slice(0, 3)
				.map((play, index) => {
					const { songTitle, difficulty } = playUtils.convertTitleToBeatmapMetadata(play.Filename);
					const ppValue = play.MapPP ? Math.round(play.MapPP) : 'N/A';
					const mods = play.Mods.join('') || 'NM';

					return `${index + 1}. ${songTitle} [${difficulty}] +${mods} • ${ppValue}pp`;
				})
				.join('\n');

			description += `\n\n${topPlaysInfo}`;
		}

		return description;
	}

	$effect(() => {
		async function loadUser() {
			if (userId && user?.UserId?.toString() === userId) return;

			isLoading = true;

			const loadedUser = await fetchUser(userId ?? '').catch(() => null);

			if (loadedUser?.Source === 'merged') {
				({
					GlobalRank: globalRank,
					CountryRank: countryRank,
					Registered: registered,
					LastLogin: lastLogin,
					ScoreRank: scoreRank,
					PPRank: ppRank
				} = loadedUser);
			} else if (loadedUser?.Source === 'api') {
				({
					GlobalRank: globalRank,
					CountryRank: countryRank,
					Registered: registered,
					LastLogin: lastLogin
				} = loadedUser);
			} else if (loadedUser?.Source === 'scraper') {
				({ ScoreRank: scoreRank, PPRank: ppRank } = loadedUser);
			}

			user = loadedUser;

			if (user?.Top50Plays) {
				simulatedPP = playUtils.getSimulatedPerformancePoints(user.Top50Plays);

				beatmaps.clear();
				await fetchBeatmapsInRange(user.Top50Plays, 0, 5);
				fetchBeatmapsInRange(user.Top50Plays, 5, 25).then((r) => void r);
			}

			isLoading = false;
		}

		loadUser();
	});

	$effect(() => {
		if (topPlaysToShow === 25 && user?.Top50Plays) {
			fetchBeatmapsInRange(user.Top50Plays, 25, 50);
		}
	});

	$effect(() => {
		// Update scanner instance when user ID changes
		if (user?.UserId && scanner.uid !== user.UserId) {
			scanner.stop();
			scanner = new PlayerAnalyticsScanner(user.UserId);
		}
		return () => scanner.stop();
	});
</script>

<svelte:head>
	{#if isLoading}
		<title>Loading... - osu!droid</title>
	{:else if user?.Username}
		<title>{user.Username} - osu!droid Profile</title>
		<meta property="og:title" content="{user.Username} - osu!droid Profile" />
		<meta property="profile:username" content={user.Username} />
		<meta property="og:description" content={getDescription()} />
		<meta property="og:image" content="https://osudroid.moe/user/avatar/{user.UserId}.png" />
	{:else}
		<title>User Not Found - osu!droid</title>
		<meta property="og:title" content="User Not Found - osu!droid" />
		<meta property="og:description" content="User not found on osu!droid." />
	{/if}
</svelte:head>

<SearchBar />

<ContentLayout>
	{#if isLoading}
		<UserIsLoading />
	{:else if user}
		<BeatmapModal bind:dialog beatmap={selectedBeatmap} play={selectedPlay} />
		<!-- Desktop Layout -->
		<div class="hidden desktop-sm:grid grid-cols-[1fr_3fr] gap-8">
			<!-- Sidebar -->
			<div class="flex flex-col gap-4 w-75 sticky top-28 self-start">
				<RankingPanel
					source={user.Source}
					globalRanking={globalRank}
					countryRanking={countryRank}
					scoreRanking={scoreRank}
					ppRanking={ppRank}
				/>
				<StatisticsPanel
					source={user.Source}
					performancePoints={user.OverallPP}
					simulatedPerformancePoints={simulatedPP}
					score={user.OverallScore}
					accuracy={user.OverallAccuracy}
					playcount={user.OverallPlaycount}
				/>
				{#if user.Source === 'api' || user.Source === 'merged'}
					<UserInfoPanel {registered} {lastLogin} />
				{/if}
			</div>

			<!-- Main Content -->
			<div class="flex flex-col gap-8">
				<ProfileInfoDesktop
					avatarLink="https://osudroid.moe/user/avatar/{user.UserId}.png"
					username={user.Username}
					country={user.Region}
				/>
				<AnalyticsDashboard {scanner} totalPlayCount={user.OverallPlaycount} />
				<TopPlays
					topPlays={user.Top50Plays}
					bind:itemsToShow={topPlaysToShow}
					{beatmaps}
					{openModal}
				/>
				<RecentPlays
					recentPlays={user.Last50Scores}
					bind:itemsToShow={recentPlaysToShow}
					{openModal}
				/>
			</div>
		</div>

		<!-- Mobile/Tablet Layout -->
		<div
			class="
				desktop-sm:hidden
				flex flex-col
				phone-sm:gap-2.5 phone-sm:py-2.5
				phone-lg:gap-3.5 phone-lg:py-3.5
				tablet-sm:gap-5 tablet-sm:p-5
				tablet-lg:gap-6 tablet-lg:p-6"
		>
			<ProfileInfoMobile
				source={user.Source}
				username={user.Username}
				country={user.Region}
				avatarLink="https://osudroid.moe/user/avatar/{user.UserId}.png"
				globalRanking={globalRank}
				countryRanking={countryRank}
				scoreRanking={scoreRank}
				ppRanking={ppRank}
				performancePoints={user.OverallPP}
				simulatedPerformancePoints={simulatedPP}
				score={user.OverallScore}
				accuracy={user.OverallAccuracy}
				playcount={user.OverallPlaycount}
				{registered}
				{lastLogin}
			/>
			<AnalyticsDashboard {scanner} totalPlayCount={user.OverallPlaycount} />
			<TopPlays
				topPlays={user.Top50Plays}
				bind:itemsToShow={topPlaysToShow}
				{beatmaps}
				{openModal}
			/>
			<RecentPlays
				recentPlays={user.Last50Scores}
				bind:itemsToShow={recentPlaysToShow}
				{openModal}
			/>
		</div>
	{:else}
		<UserNotFound />
	{/if}
</ContentLayout>

<Footer />
