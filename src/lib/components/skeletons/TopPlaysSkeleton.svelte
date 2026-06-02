<script lang="ts">
	import ContentCard from '$lib/components/layouts/ContentCard.svelte';
	import { TrophyIcon } from '@lucide/svelte';
</script>

<ContentCard
	sx="
		flex flex-col gap-1
		phone-sm:gap-3
		phone-lg:gap-4
		tablet-sm:gap-5
		tablet-lg:gap-6"
>
	<!-- Header -->
	<div
		class="
			flex items-center gap-1
			phone-sm:gap-3
			phone-lg:gap-4
			tablet-sm:gap-5
			tablet-lg:gap-6"
	>
		<TrophyIcon class="tablet-sm:size-8" />
		<h1 class="font-bold text-lg">Top Plays</h1>
	</div>

	<!-- Top Plays -->
	<div class="flex flex-col gap-1 phone-sm:gap-1.5">
		<!-- Small Screen -->
		<div class="tablet-sm:hidden flex flex-col gap-1 phone-sm:gap-1.5">
			{#each { length: 5 } as _, index (index)}
				<div class="placeholder animate-pulse w-full h-[100px]">{_}</div>
			{/each}
		</div>

		<!-- Large Screen -->
		<div class="hidden tablet-sm:flex flex-col gap-2">
			{#each { length: 5 } as _, index (index)}
				<div class="placeholder animate-pulse w-full h-[120px]">{_}</div>
			{/each}
		</div>

		<div
			class="placeholder animate-pulse flex justify-center mt-2 mx-auto w-[115px] h-[30px]"
		></div>
	</div>
</ContentCard>
