<script lang="ts">
	import { CircleAlert } from '@lucide/svelte';
	import { resolve } from '$app/paths';
</script>

<div
	class="
		flex flex-col items-center justify-center
		text-center px-4
		min-h-page
		w-full
	"
>
	<CircleAlert class="size-16 text-red-500" />
	<h2 class="text-2xl font-bold mt-4 animate-fade-in">User Not Found</h2>
	<p class="text-gray-400 text-sm mt-2 animate-fade-in delay-100">
		Sorry, we couldn't find the player you're looking for. <br />
		Please check the uid or try searching again.
	</p>
	<a
		href={resolve('/')}
		data-sveltekit-preload-data
		class="
			mt-4 px-4 py-2 bg-blue-500 text-white rounded-md
			hover:bg-blue-600 transition
		"
	>
		Back to Home
	</a>
</div>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.animate-fade-in {
		animation: fade-in 0.4s ease forwards;
		opacity: 0;
	}
	.animate-fade-in.delay-100 {
		animation-delay: 0.1s;
	}
</style>
