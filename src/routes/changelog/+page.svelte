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
			<article
				class="prose prose-invert max-w-none
            prose-h1:text-3xl prose-h1:font-bold prose-h1:text-white prose-h1:mb-4
            prose-h2:text-2xl prose-h2:font-bold prose-h2:text-white prose-h2:mt-8 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-gray-700
            prose-h3:text-xl prose-h3:font-semibold prose-h3:text-pink-400 prose-h3:mt-6 prose-h3:mb-3
            prose-h4:text-lg prose-h4:font-semibold prose-h4:text-gray-300 prose-h4:mt-4 prose-h4:mb-2
            prose-ul:list-disc prose-ul:list-inside prose-ul:space-y-2 prose-ul:text-gray-300 prose-ul:ml-4
            prose-p:text-gray-400 prose-p:leading-relaxed prose-p:mb-4
            prose-a:text-blue-400 hover:prose-a:underline
            prose-code:bg-[#1A1A1A] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-pink-400 prose-code:text-sm prose-code:before:content-none prose-code:after:content-none"
			>
				<ChangelogContent />
			</article>
		</div>
	</div>
</ContentLayout>

<Footer />
