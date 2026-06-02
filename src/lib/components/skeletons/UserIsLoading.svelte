<script>
	import StatisticsPanelSkeleton from '$lib/components/skeletons/StatisticsPanelSkeleton.svelte';
	import TopPlaysSkeleton from '$lib/components/skeletons/TopPlaysSkeleton.svelte';
	import RecentPlaysSkeleton from '$lib/components/skeletons/RecentPlaysSkeleton.svelte';
	import RankingPanelSkeleton from '$lib/components/skeletons/RankingPanelSkeleton.svelte';
	import UserInfoPanelSkeleton from '$lib/components/skeletons/UserInfoPanelSkeleton.svelte';
	import ProfileInfoDesktopSkeleton from '$lib/components/skeletons/ProfileInfoDesktopSkeleton.svelte';
	import ProfileInfoMobileSkeleton from '$lib/components/skeletons/ProfileInfoMobileSkeleton.svelte';
	import AnalyticsDashboardSkeleton from '$lib/components/skeletons/AnalyticsDashboardSkeleton.svelte';
	import FirstPlacesSkeleton from '$lib/components/skeletons/FirstPlacesSkeleton.svelte';
</script>

<div class="hidden desktop-sm:grid grid-cols-[1fr_3fr] gap-8">
	<!-- Sidebar -->
	<div class="flex flex-col gap-4 w-[300px] sticky top-28 self-start">
		<RankingPanelSkeleton />
		<StatisticsPanelSkeleton />
		<UserInfoPanelSkeleton />

	</div>

	<!-- Main Content -->
	<div class="flex flex-col gap-8">
		<ProfileInfoDesktopSkeleton />
		<AnalyticsDashboardSkeleton />
		<TopPlaysSkeleton />
		<RecentPlaysSkeleton />
		<FirstPlacesSkeleton />
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
	<ProfileInfoMobileSkeleton />
	<AnalyticsDashboardSkeleton />
	<TopPlaysSkeleton />
	<RecentPlaysSkeleton />
	<FirstPlacesSkeleton />
</div>
