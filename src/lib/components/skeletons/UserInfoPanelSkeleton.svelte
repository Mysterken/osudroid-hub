<script lang="ts">
	import ContentCard from '$lib/components/layouts/ContentCard.svelte';
	import { InfoIcon } from '@lucide/svelte';
</script>

<ContentCard sx="!p-2.5 flex flex-col gap-2.5">
	<div class="flex items-center gap-3.5">
		<InfoIcon class="size-8" />
		<h1 class="font-bold text-lg">User Info</h1>
	</div>
	<div class="user-info flex flex-col justify-center w-full px-2">
		<table class="w-full text-sm max-w-[400px]">
			<tbody>
				<tr>
					<td class="pb-1 text-left">Registered</td>
					<td class="pb-1 text-right font-bold h-full">
						<div class="placeholder animate-pulse w-24 h-2 ml-auto"></div>
					</td>
				</tr>
				<tr>
					<td class="pb-1 text-left">Last Login</td>
					<td class="pb-1 text-right font-bold h-full">
						<div class="placeholder animate-pulse w-20 h-2 ml-auto"></div>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</ContentCard>
