<script lang="ts">
	import { scaleTime } from 'd3-scale';
	import { format } from 'date-fns';
	import { Axis, Chart, Highlight, Spline, Svg, Tooltip } from 'layerchart';
	import { SegmentedControl } from '@skeletonlabs/skeleton-svelte';
	import type { AnalyticsStats } from '$lib/stores/analyticsScanner.svelte';

	let { stats }: { stats: AnalyticsStats } = $props();

	let activeTab = $state<'plays' | 'pp'>('plays');

	type ChartPoint = {
		date: Date;
		month: string;
		monthlyPlays: number;
		cumulativePp: number;
		timestamp: number;
	};

	let chartData = $derived.by<ChartPoint[]>(() => {
		const monthlyPlays: Record<string, number> = {};

		Object.entries(stats.timeline).forEach(([month, count]) => {
			monthlyPlays[month] = count;
		});

		return stats.ppTimeline.map((entry) => {
			const dateObj = new Date(entry.date * 1000);
			const month = dateObj.toISOString().slice(0, 7);

			return {
				date: dateObj,
				month,
				monthlyPlays: monthlyPlays[month] || 0,
				cumulativePp: entry.cumulativePp,
				timestamp: entry.date * 1000
			};
		});
	});

	let maxValue = $derived(
		Math.max(0, ...chartData.map((d) => (activeTab === 'plays' ? d.monthlyPlays : d.cumulativePp)))
	);

	function niceStep(max: number, targetTicks = 4) {
		if (max <= 0) return 10;
		const raw = max / targetTicks;
		const magnitude = 10 ** Math.floor(Math.log10(raw));
		const normalized = raw / magnitude;

		if (normalized <= 1) return magnitude;
		if (normalized <= 2) return 2 * magnitude;
		if (normalized <= 5) return 5 * magnitude;
		return 10 * magnitude;
	}

	let yAxisTop = $derived.by(() => {
		const step = niceStep(maxValue, 4);
		return Math.max(step, Math.ceil(maxValue / step) * step);
	});

	let yTickLabels = $derived.by(() => {
		const step = niceStep(maxValue, 4);
		const ticks = [];

		for (let i = yAxisTop; i > 0; i -= step) {
			ticks.push(i);
		}
		ticks.push(0);

		return ticks.map((v) => Math.max(0, v).toLocaleString());
	});

	let lineColor = $derived(activeTab === 'plays' ? '#6366f1' : '#ec4899');

	let containerHeight = $state(0);
</script>

<div class="bg-[#2A2A2A] rounded-lg">
	<div
		class="flex flex-col tablet-sm:flex-row justify-between items-start tablet-sm:items-center gap-4 mb-4 w-full"
	>
		<h3 class="text-sm font-semibold text-gray-300 shrink-0">Progression Timeline</h3>

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

	{#if chartData.length > 0}
		<div
			class="w-full bg-[#1E1E1E] rounded-lg relative border border-[#303030]"
			style="height: 300px;"
		>
			<div
				class="absolute left-0 top-4 bottom-6 w-12 pointer-events-none flex flex-col justify-between pl-3"
				aria-hidden="true"
			>
				{#each yTickLabels as tick, i (`tick-${i}`)}
					<span class="text-[11px] text-gray-300 leading-none">{tick}</span>
				{/each}
			</div>

			<div class="h-full pl-10 custom-chart" bind:clientHeight={containerHeight}>
				{#if containerHeight > 0}
					{#key activeTab}
						<Chart
							data={chartData}
							x="date"
							xScale={scaleTime()}
							y={activeTab === 'plays' ? 'monthlyPlays' : 'cumulativePp'}
							yDomain={[0, yAxisTop]}
							padding={{ left: 8, bottom: 24, right: 16, top: 16 }}
							tooltip={{ mode: 'bisect-x' }}
						>
							<Svg>
								<Axis
									placement="left"
									grid
									rule
									classes={{
										rule: 'stroke-[#4A4A4A]',
										tick: 'stroke-[#4A4A4A]',
										tickLabel: 'fill-transparent'
									}}
								/>
								<Axis
									placement="bottom"
									format={(d) => format(d, 'MMM yy')}
									rule
									classes={{
										rule: 'stroke-[#4A4A4A]',
										tick: 'stroke-[#4A4A4A]',
										tickLabel: 'fill-gray-400 text-xs'
									}}
								/>

								<Spline
									stroke={lineColor}
									stroke-width="2"
									class="fill-none transition-colors duration-300"
								/>
								<Highlight points={{ fill: lineColor, r: 3 }} lines />
							</Svg>

							<Tooltip.Root let:data>
								<Tooltip.Header class="font-bold text-white mb-1">
									{format(data.date, 'MMMM yyyy')}
								</Tooltip.Header>
								<Tooltip.List>
									<Tooltip.Item
										label={activeTab === 'plays' ? 'Monthly Plays' : 'Total PP'}
										value={activeTab === 'plays'
											? data.monthlyPlays
											: `${Math.round(data.cumulativePp).toLocaleString()} pp`}
										color={lineColor}
									/>
								</Tooltip.List>
							</Tooltip.Root>
						</Chart>
					{/key}
				{/if}
			</div>
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
						{Math.round(chartData[chartData.length - 1]?.cumulativePp || 0).toLocaleString()} pp
					{/if}
				</p>
			</div>
			<div>
				<p class="text-xs text-gray-400 mb-1">Months Tracked</p>
				<p class="text-lg font-bold text-white">{new Set(chartData.map((d) => d.month)).size}</p>
			</div>
		</div>
	{:else}
		<div class="text-center py-8 text-gray-500 text-sm">
			No timeline data available. Complete a scan to see your progression.
		</div>
	{/if}
</div>
