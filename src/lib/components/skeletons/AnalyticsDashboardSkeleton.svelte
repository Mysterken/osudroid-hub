<script lang="ts">
	import { ChartNoAxesColumn, ChevronDownIcon } from '@lucide/svelte';
</script>

<div class="w-full bg-[#1E1E1E] border border-[#3C3C3C] rounded-xl text-white overflow-hidden">
	<div class="flex flex-col xl:flex-row justify-between items-start xl:items-center w-full">
		<div class="p-6 flex-1 flex w-full items-start xl:items-center gap-4 text-left">
			<div class="flex items-center gap-3 w-full">
				<ChevronDownIcon size={20} class="text-gray-600" />
				<div class="flex flex-col gap-2 w-full">
					<h2 class="text-xl font-bold flex items-center gap-2 text-gray-500">
						<ChartNoAxesColumn class="text-gray-600" /> Deep Analytics
					</h2>
					<div class="placeholder animate-pulse h-3 w-48 rounded bg-gray-800"></div>
				</div>
			</div>
		</div>

		<div class="p-6 pt-0 xl:pt-6 xl:pl-0 flex items-center w-full xl:w-auto justify-end shrink-0">
			<div class="flex flex-row w-full xl:w-auto gap-3">
				<div
					class="placeholder animate-pulse h-[38px] w-full xl:w-[115px] rounded-lg bg-[#2A2A2A]"
				></div>
				<div
					class="placeholder animate-pulse h-[38px] w-full xl:w-[115px] rounded-lg bg-gray-800"
				></div>
			</div>
		</div>
	</div>
</div>
