<script lang="ts">
	import ContentCard from '$lib/components/layouts/ContentCard.svelte';
	import { Disc3Icon } from '@lucide/svelte';
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
		<Disc3Icon class="tablet-sm:size-8" />
		<h1 class="font-bold text-lg">Recent Plays</h1>
	</div>

	<!-- Recent Plays -->
	<div class="flex flex-col gap-1 phone-sm:gap-1.5">
		<!-- Small Screen -->
		<div class="tablet-sm:hidden flex flex-col gap-1 phone-sm:gap-1.5">
			{#each { length: 5 } as _, index (index)}
				<div class="placeholder animate-pulse w-full h-10">{_}</div>
			{/each}
		</div>

		<!-- Large Screen -->
		<div class="hidden tablet-sm:flex flex-col gap-2">
			{#each { length: 5 } as _, index (index)}
				<div class="placeholder animate-pulse w-full h-20">{_}</div>
			{/each}
		</div>

		<div class="placeholder animate-pulse flex justify-center mt-2 mx-auto w-28.75 h-7.5"></div>
	</div>
</ContentCard>
