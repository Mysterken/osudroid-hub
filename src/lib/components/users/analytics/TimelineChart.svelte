<script lang="ts">
	import { browser } from '$app/environment';
	import { SegmentedControl } from '@skeletonlabs/skeleton-svelte';
	import type { AnalyticsStats } from '$lib/stores/analyticsScanner.svelte';

	// 🌟 FIX 1: Import ApexOptions AND the default ApexCharts class specifically as types!
	import type { ApexOptions } from 'apexcharts';
	import type ApexCharts from 'apexcharts';

	let { stats }: { stats: AnalyticsStats } = $props();

	let activeTab = $state<'plays' | 'pp'>('plays');
	let chartContainer = $state<HTMLElement | null>(null);

	// 🌟 FIX 1: Apply the strict type instead of 'any'
	let chartInstance: ApexCharts | null = null;

	let seriesData = $derived.by(() => {
		const monthlyPlays: Record<string, number> = {};

		Object.entries(stats.timeline).forEach(([month, count]) => {
			monthlyPlays[month] = count;
		});

		return stats.ppTimeline.map((entry) => {
			const dateObj = new Date(entry.date * 1000);
			const month = dateObj.toISOString().slice(0, 7);
			const plays = monthlyPlays[month] || 0;

			return {
				x: dateObj.getTime(),
				y: activeTab === 'plays' ? plays : Math.round(entry.cumulativePp)
			};
		});
	});

	$effect(() => {
		if (!browser || !chartContainer || seriesData.length === 0) return;

		let isMounted = true;

		const color = activeTab === 'plays' ? '#6366f1' : '#ec4899';
		const name = activeTab === 'plays' ? 'Monthly Plays' : 'Total PP';

		const options: ApexOptions = {
			series: [{ name, data: seriesData }],
			chart: {
				type: 'area',
				height: 300,
				background: 'transparent',
				toolbar: { show: false },
				animations: {
					enabled: true,
					speed: 800,
					dynamicAnimation: {
						enabled: true,
						speed: 350
					}
				}
			},
			colors: [color],
			fill: {
				type: 'gradient',
				gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] }
			},
			dataLabels: { enabled: false },
			stroke: { curve: 'smooth', width: 3 },
			xaxis: {
				type: 'datetime',
				axisBorder: { show: false },
				axisTicks: { show: false },
				labels: { style: { colors: '#9ca3af', fontSize: '11px' } },
				tooltip: { enabled: false }
			},
			yaxis: {
				labels: { style: { colors: '#9ca3af', fontSize: '11px' } }
			},
			grid: {
				borderColor: '#3C3C3C',
				strokeDashArray: 4,
				xaxis: { lines: { show: true } },
				yaxis: { lines: { show: true } },
				padding: { top: 0, right: 0, bottom: 0, left: 10 }
			},
			theme: { mode: 'dark' },
			tooltip: {
				theme: 'dark',
				x: { format: 'MMM yyyy' }
			}
		};

		import('apexcharts').then((module) => {
			// 🌟 FIX 2: Re-narrow the type by checking if chartContainer is still valid asynchronously
			if (!isMounted || !chartContainer) return;

			const ApexChartsDynamic = module.default;

			if (chartInstance) {
				chartInstance.updateOptions(options);
			} else {
				// TypeScript now guarantees chartContainer is exactly HTMLElement!
				chartInstance = new ApexChartsDynamic(chartContainer, options);
				chartInstance.render();
			}
		});

		return () => {
			isMounted = false;
			if (chartInstance) {
				chartInstance.destroy();
				chartInstance = null;
			}
		};
	});
</script>

<div class="bg-[#1E1E1E] border border-[#3C3C3C] rounded-xl p-6 w-full">
	<div
		class="flex flex-col tablet-sm:flex-row justify-between items-start tablet-sm:items-center gap-4 mb-4 w-full"
	>
		<h3 class="text-xl font-bold text-white shrink-0">Progression Timeline</h3>

		<SegmentedControl
			value={activeTab}
			onValueChange={(details) => (activeTab = details.value as 'plays' | 'pp')}
			class="w-full tablet-sm:w-auto"
		>
			<SegmentedControl.Control class="w-full flex">
				<SegmentedControl.Indicator />
				<SegmentedControl.Item value="plays" class="flex-1">
					<SegmentedControl.ItemText>Playcount</SegmentedControl.ItemText>
					<SegmentedControl.ItemHiddenInput />
				</SegmentedControl.Item>
				<SegmentedControl.Item value="pp" class="flex-1">
					<SegmentedControl.ItemText>Performance</SegmentedControl.ItemText>
					<SegmentedControl.ItemHiddenInput />
				</SegmentedControl.Item>
			</SegmentedControl.Control>
		</SegmentedControl>
	</div>

	{#if seriesData.length > 0}
		<div class="w-full bg-[#2A2A2A] rounded-lg border border-[#303030] p-2 min-h-[300px]">
			<div bind:this={chartContainer}></div>
		</div>

		<div class="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-[#3C3C3C]">
			<div>
				<p class="text-xs text-gray-400 mb-1">
					{activeTab === 'plays' ? 'Total Plays' : 'Total PP'}
				</p>
				<p
					class="text-lg font-bold {activeTab === 'plays'
						? 'text-indigo-400'
						: 'text-pink-400'} transition-colors duration-300"
				>
					{#if activeTab === 'plays'}
						{stats.playCount.toLocaleString()}
					{:else}
						{Math.round(seriesData[seriesData.length - 1]?.y || 0).toLocaleString()} pp
					{/if}
				</p>
			</div>
			<div>
				<p class="text-xs text-gray-400 mb-1">Months Tracked</p>
				<p class="text-lg font-bold text-white">{new Set(seriesData.map((d) => d.x)).size}</p>
			</div>
		</div>
	{/if}
</div>
