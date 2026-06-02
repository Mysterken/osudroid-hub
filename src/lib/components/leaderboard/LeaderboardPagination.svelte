<script lang="ts">
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import { Pagination } from '@skeletonlabs/skeleton-svelte';

	interface Props {
		currentPage: number;
		totalPages: number;
		pageSize: number;
		totalCount: number;
		onPageChange: (page: number) => void;
	}

	let { currentPage, pageSize, totalCount, onPageChange }: Props = $props();
</script>

<div
	class="bg-[#1A1A1A] px-4 py-4 md:px-6 flex items-center justify-center border-t border-gray-700"
>
	<Pagination
		count={totalCount}
		{pageSize}
		page={currentPage}
		onPageChange={(event) => onPageChange(event.page)}
	>
		<Pagination.PrevTrigger
			class="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2A2A2A] hover:bg-[#333333] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white"
		>
			<ChevronLeft size={20} />
			<span class="font-medium hidden sm:inline">Previous</span>
		</Pagination.PrevTrigger>

		<Pagination.Context>
			{#snippet children(pagination)}
				{#each pagination().pages as page, index (page)}
					{#if page.type === 'page'}
						<Pagination.Item
							{...page}
							class="size-10 rounded-lg font-medium transition-colors {currentPage === page.value
								? 'bg-pink-600 text-white'
								: 'bg-[#2A2A2A] text-gray-400 hover:bg-[#333333]'}"
						>
							{page.value}
						</Pagination.Item>
					{:else}
						<Pagination.Ellipsis {index} class="px-2 text-gray-400">&#8230;</Pagination.Ellipsis>
					{/if}
				{/each}
			{/snippet}
		</Pagination.Context>

		<Pagination.NextTrigger
			class="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2A2A2A] hover:bg-[#333333] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white"
		>
			<span class="font-medium hidden sm:inline">Next</span>
			<ChevronRight size={20} />
		</Pagination.NextTrigger>
	</Pagination>
</div>
