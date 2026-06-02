<script module lang="ts">
	export interface ColumnDef {
		key: string;
		label: string;
		align?: 'left' | 'center' | 'right';
		width?: string;
	}
</script>

<script lang="ts" generics="TRow">
	import { LoaderCircle } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import LeaderboardPagination from './LeaderboardPagination.svelte';

	interface Props {
		rows: TRow[];
		columns: ColumnDef[];
		isLoading: boolean;
		hasError?: boolean;
		currentPage: number;
		totalPages: number;
		pageSize: number;
		totalCount: number;
		emptyMessage?: string;
		loadingMessage?: string;
		onPageChange: (page: number) => void;
		row: Snippet<[TRow, number]>;
		card: Snippet<[TRow, number]>;
		error?: Snippet;
		getRowKey?: (row: TRow, index: number) => string | number;
	}

	let {
		rows,
		columns,
		isLoading,
		hasError = false,
		currentPage,
		totalPages,
		pageSize,
		totalCount,
		emptyMessage = 'No results found',
		loadingMessage = 'Loading...',
		onPageChange,
		row: rowSnippet,
		card: cardSnippet,
		error: errorSnippet,
		getRowKey = (_row, i) => i
	}: Props = $props();

	const hasRows = $derived(!isLoading && rows.length > 0 && !hasError);
	const colSpan = $derived(columns.length);

	function alignClass(align: ColumnDef['align'] = 'left'): string {
		return align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
	}
</script>

{#snippet loadingIndicator(label: string)}
	<div class="flex items-center justify-center gap-3 py-16">
		<LoaderCircle size={24} class="animate-spin text-pink-600" />
		<span class="text-gray-400">{label}</span>
	</div>
{/snippet}

<div class="bg-[#2A2A2A] rounded-2xl overflow-hidden">
	<div class="hidden md:block overflow-x-auto">
		<table class="w-full">
			<thead class="bg-[#1A1A1A] border-b border-gray-700">
				<tr>
					{#each columns as col (col.key)}
						<th
							class="px-6 py-4 text-sm font-semibold text-gray-400 {alignClass(
								col.align
							)} {col.width ?? ''}"
						>
							{col.label}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#if isLoading}
					<tr>
						<td colspan={colSpan} class="px-6 py-16 text-center">
							{@render loadingIndicator(loadingMessage)}
						</td>
					</tr>
				{:else if hasError && errorSnippet}
					<tr>
						<td colspan={colSpan} class="px-6 py-16 text-center">
							{@render errorSnippet()}
						</td>
					</tr>
				{:else if rows.length === 0}
					<tr>
						<td colspan={colSpan} class="px-6 py-16 text-center text-gray-400">
							{emptyMessage}
						</td>
					</tr>
				{:else}
					{#each rows as r, i (getRowKey(r, i))}
						{@render rowSnippet(r, i)}
					{/each}
				{/if}
			</tbody>
		</table>
	</div>

	<div class="md:hidden">
		{#if isLoading}
			{@render loadingIndicator(loadingMessage)}
		{:else if hasError && errorSnippet}
			{@render errorSnippet()}
		{:else if rows.length === 0}
			<div class="py-16 text-center text-gray-400">{emptyMessage}</div>
		{:else}
			{#each rows as r, i (getRowKey(r, i))}
				{@render cardSnippet(r, i)}
			{/each}
		{/if}
	</div>

	{#if hasRows}
		<LeaderboardPagination {currentPage} {totalPages} {pageSize} {totalCount} {onPageChange} />
	{/if}
</div>
