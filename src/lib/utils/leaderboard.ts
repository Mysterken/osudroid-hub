import { Medal } from '@lucide/svelte';
import type { Component } from 'svelte';

export function getRankColor(rank: number): string {
	if (rank === 1) return 'text-yellow-400';
	if (rank === 2) return 'text-gray-300';
	if (rank === 3) return 'text-amber-600';
	return 'text-gray-400';
}

export function getRankIcon(rank: number): Component | null {
	return rank <= 3 ? (Medal as unknown as Component) : null;
}

const numberFormatter = new Intl.NumberFormat();
export function formatNumber(num: number): string {
	return numberFormatter.format(Math.round(num));
}

/**
 * Computes the absolute rank of a player at `index` within `currentPage`.
 */
export function computeRank(currentPage: number, playersPerPage: number, index: number): number {
	return (currentPage - 1) * playersPerPage + index + 1;
}
