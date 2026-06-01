<script lang="ts">
	import { scaleTime } from 'd3-scale';
	import { format } from 'date-fns';
	import { Axis, Chart, Highlight, Spline, Svg, Tooltip } from 'layerchart';
	import type { AnalyticsStats } from '$lib/stores/analyticsScanner.svelte';

	let { stats }: { stats: AnalyticsStats } = $props();

	type ChartPoint = {
		date: Date;
		month: string;
		monthlyPlays: number;
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
				timestamp: entry.date * 1000
			};
		});
	});

	let maxMonthlyPlays = $derived(Math.max(0, ...chartData.map((d) => d.monthlyPlays)));

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
		const step = niceStep(maxMonthlyPlays, 4);
		return Math.max(step, Math.ceil(maxMonthlyPlays / step) * step);
	});

	let yTickLabels = $derived.by(() => {
		const step = niceStep(maxMonthlyPlays, 4);
		const ticks = [];

		for (let i = yAxisTop; i > 0; i -= step) {
			ticks.push(i);
		}
		ticks.push(0);

		return ticks.map((v) => Math.max(0, v).toLocaleString());
	});
</script>

<div class="bg-[#2A2A2A] rounded-lg">
	<h3 class="text-sm font-semibold text-gray-300 mb-4">Progression Timeline</h3>

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

			<div class="h-full pl-10">
				<Chart
					data={chartData}
					x="date"
					xScale={scaleTime()}
					y="monthlyPlays"
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

						<Spline y={(d) => d.monthlyPlays} stroke="#6366f1" class="fill-none" />

						<Highlight y={(d) => d.monthlyPlays} points={{ fill: '#818cf8', r: 3 }} lines />
					</Svg>

					<Tooltip.Root let:data>
						<Tooltip.Header class="font-bold text-white mb-1">
							{format(data.date, 'MMMM yyyy')}
						</Tooltip.Header>
						<Tooltip.List>
							<Tooltip.Item label="Monthly Plays" value={data.monthlyPlays} color="#818cf8" />
						</Tooltip.List>
					</Tooltip.Root>
				</Chart>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-[#3C3C3C]">
			<div>
				<p class="text-xs text-gray-400 mb-1">Total Plays</p>
				<p class="text-lg font-bold text-blue-400">{stats.playCount.toLocaleString()}</p>
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
