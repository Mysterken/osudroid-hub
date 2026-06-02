<script lang="ts">
	import ContentCard from '$lib/components/layouts/ContentCard.svelte';
	import { CrownIcon } from '@lucide/svelte';
</script>

<ContentCard
	sx="
   flex flex-col gap-1
   phone-sm:gap-3
   phone-lg:gap-4
   tablet-sm:gap-5
   tablet-lg:gap-6"
>
	<div
		class="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 tablet-sm:gap-4 w-full"
	>
		<div class="flex items-center gap-2 tablet-sm:gap-3 shrink-0">
			<CrownIcon class="tablet-sm:size-8 text-yellow-400" />
			<h1 class="font-bold text-lg text-white whitespace-nowrap">First Place Ranks</h1>
		</div>
	</div>

	<div class="flex flex-col gap-1 phone-sm:gap-1.5 justify-center">
		<div
			class="placeholder animate-pulse w-full h-[180px] rounded-lg bg-[#1E1E1E] border border-[#3C3C3C]/50"
		></div>
	</div>
</ContentCard>
