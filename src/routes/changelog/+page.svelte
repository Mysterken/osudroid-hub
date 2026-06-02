<script lang="ts">
	import SearchBar from '$lib/components/ui/SearchBar.svelte';
	import ContentLayout from '$lib/components/layouts/ContentLayout.svelte';
	import Footer from '$lib/components/layouts/Footer.svelte';
	import { FileTextIcon } from '@lucide/svelte';

	// @ts-expect-error - md file
	import ChangelogContent from '../../../CHANGELOG.md';
</script>

<svelte:head>
	<title>Changelog - osu!droid Hub</title>
</svelte:head>

<SearchBar />

<ContentLayout>
	<div class="flex flex-col gap-6 py-6">
		<div class="flex items-center gap-4">
			<div class="flex items-center justify-center size-16 rounded-2xl">
				<FileTextIcon size={32} class="text-white" />
			</div>
			<div>
				<h1 class="text-3xl tablet-sm:text-4xl font-extrabold text-white">Changelog</h1>
				<p class="text-gray-400 mt-1">Track updates and new features</p>
			</div>
		</div>

		<div class="bg-[#2A2A2A] rounded-2xl p-6 tablet-sm:p-8">
			<article class="changelog-prose prose prose-invert max-w-none">
				<ChangelogContent />
			</article>
		</div>
	</div>
</ContentLayout>

<Footer />

<style lang="postcss">
	@reference "../../app.css";

	:global(.changelog-prose h1) {
		@apply text-3xl font-bold text-white mb-4;
	}
	:global(.changelog-prose h2) {
		@apply text-2xl font-bold text-white mt-8 mb-4 pb-2 border-b border-gray-700;
	}
	:global(.changelog-prose h3) {
		@apply text-xl font-semibold text-pink-400 mt-6 mb-3;
	}
	:global(.changelog-prose h4) {
		@apply text-lg font-semibold text-gray-300 mt-4 mb-2;
	}
	:global(.changelog-prose ul) {
		@apply list-disc list-inside space-y-2 text-gray-300 ml-4;
	}
	:global(.changelog-prose p) {
		@apply text-gray-400 leading-relaxed mb-4;
	}
	:global(.changelog-prose a) {
		@apply text-blue-400 hover:underline;
	}
	:global(.changelog-prose code) {
		@apply bg-[#1A1A1A] px-1.5 py-0.5 rounded text-pink-400 text-sm;
	}
</style>
