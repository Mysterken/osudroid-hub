<script module lang="ts">
	import { untrack } from 'svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { convertTitleToBeatmapMetadata } from '$lib/utils/playUtils';
	import type { BeatmapScore } from '$lib/models/beatmapScore';
	import { playUtils } from '$lib/utils/playUtils';
	import type { Play } from '$lib/models/play';

	const API_BASE_URL = 'https://new.osudroid.moe/api2/frontend';
	const DB_NAME = 'osudroid_hub_analytics';
	const STORE_NAME = 'player_profiles';

	export type ScanMode = 'quick' | 'deep';

	export type FirstPlace = {
		hash: string;
		score: number;
		pp: number;
		accuracy: number;
		date: number;
		mods: string;
		title: string;
		artist: string;
		mapper: string;
		difficulty: string;
	};

	export type AnalyticsStats = {
		playCount: number;
		maxCombo: number;
		maxComboPlay: BeatmapScore | null;
		highestScore: BeatmapScore | null;
		grades: Record<string, number>;
		hits: { perfect: number; geki: number; good: number; katu: number; bad: number; miss: number };
		mods: Record<string, { count: number; ppCount: number; totalPp: number; avgPp: number }>;
		timeline: Record<string, number>;
		ppTimeline: { date: number; cumulativePp: number }[];
		mappers: Record<string, number>;
		artists: Record<string, number>;
		firstPlaces: FirstPlace[];
		duplicateHashes: number;
	};

	export type SavedAnalyticsState = {
		mode: ScanMode;
		stats: AnalyticsStats;
		pagesFetched: number;
		hashesTotal: number;
		hashesChecked: number;
		status: 'idle' | 'scraping_profile' | 'scanning_firsts' | 'rate_limited' | 'done' | 'failed';
		lastUpdated: number;
	};

	// Database helpers
	async function getDB(): Promise<IDBDatabase> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(DB_NAME, 1);
			request.onupgradeneeded = () => {
				if (!request.result.objectStoreNames.contains(STORE_NAME)) {
					request.result.createObjectStore(STORE_NAME);
				}
			};
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	}

	async function saveToDB(uid: number, data: SavedAnalyticsState) {
		const db = await getDB();
		db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(data, uid);
	}

	async function loadFromDB(uid: number): Promise<SavedAnalyticsState | null> {
		const db = await getDB();
		return new Promise((resolve) => {
			const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(uid);
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => resolve(null);
		});
	}

	// Utility functions
	function createEmptyStats(): AnalyticsStats {
		return {
			playCount: 0,
			maxCombo: 0,
			maxComboPlay: null,
			highestScore: null,
			grades: { XH: 0, SH: 0, X: 0, S: 0, A: 0, B: 0, C: 0, D: 0 },
			hits: { perfect: 0, geki: 0, good: 0, katu: 0, bad: 0, miss: 0 },
			mods: {},
			timeline: {},
			ppTimeline: [],
			mappers: {},
			artists: {},
			firstPlaces: [],
			duplicateHashes: 0
		};
	}

	// Main Scanner Class
	export class PlayerAnalyticsScanner {
		uid: number;
		status = $state<
			'idle' | 'scraping_profile' | 'scanning_firsts' | 'rate_limited' | 'done' | 'failed'
		>('idle');
		error = $state<string | null>(null);
		pagesFetched = $state(0);
		hashesTotal = $state(0);
		hashesChecked = $state(0);
		rateLimitCountdown = $state(0);
		lastUpdated = $state(0);
		stats = $state<AnalyticsStats>(createEmptyStats());
		mode = $state<ScanMode>('deep');

		private abortController: AbortController | null = null;
		private previousWorkingStatus: 'scraping_profile' | 'scanning_firsts' | null = null;
		private nextRequestTime = 0;

		private rawPpPlays: { hash: string; date: number; pp: number }[] = [];

		constructor(uid: number) {
			this.uid = uid;
			this.loadSavedState();
		}

		async loadSavedState() {
			const saved = await loadFromDB(this.uid);

			if (saved) {
				this.mode = saved.mode || 'deep';
				this.stats = saved.stats
					? { ...createEmptyStats(), ...(saved.stats as Partial<AnalyticsStats>) }
					: createEmptyStats();
				this.pagesFetched = saved.pagesFetched || 0;
				this.hashesTotal = saved.hashesTotal || 0;
				this.hashesChecked = saved.hashesChecked || 0;
				this.lastUpdated = saved.lastUpdated || 0;
				this.status = ['scraping_profile', 'scanning_firsts', 'rate_limited'].includes(saved.status)
					? 'idle'
					: saved.status;
			}
		}

		reset() {
			this.stats = createEmptyStats();
			this.pagesFetched = 0;
			this.hashesTotal = 0;
			this.hashesChecked = 0;
			this.rateLimitCountdown = 0;
			this.nextRequestTime = 0;
			this.rawPpPlays = [];
			this.error = null;
			this.status = 'idle';
			this.saveState();
		}

		stop() {
			this.abortController?.abort();
			this.abortController = null;
			this.status = 'idle';
			this.rateLimitCountdown = 0;
			this.saveState();
		}

		/**
		 * Pauses execution if we have proactively determined that the next request will hit the rate limit.
		 */
		private async enforceRateLimitDelay(signal: AbortSignal) {
			const now = Date.now();

			if (now < this.nextRequestTime) {
				this.previousWorkingStatus = this.status as 'scraping_profile' | 'scanning_firsts';
				this.status = 'rate_limited';

				const waitSeconds = Math.ceil((this.nextRequestTime - now) / 1000);
				for (let i = waitSeconds; i > 0; i--) {
					if (signal.aborted) throw new Error('Stopped by user');
					this.rateLimitCountdown = i;
					await new Promise((r) => setTimeout(r, 1000));
				}

				this.rateLimitCountdown = 0;
				if (this.previousWorkingStatus) this.status = this.previousWorkingStatus;
			}
		}

		/**
		 * Smart Fetch Wrapper that proactively and reactively handles HTTP 429
		 */
		private async fetchWithRateLimit(url: string, signal: AbortSignal): Promise<Response> {
			while (true) {
				// Check if we need to pause BEFORE making the request
				await this.enforceRateLimitDelay(signal);
				if (signal.aborted) throw new Error('Stopped by user');

				const res = await fetch(url, { signal });

				const resetSeconds = parseInt(
					res.headers.get('ratelimit-reset') || res.headers.get('retry-after') || '60',
					10
				);

				if (res.status === 429) {
					// We hit a hard limit. Schedule the next request after reset + 1s buffer.
					this.nextRequestTime = Date.now() + (resetSeconds + 1) * 1000;
					continue;
				}

				if (!res.ok) throw new Error(`API Error: ${res.status}`);

				// Proactive limit checking on successful responses
				const remainingStr = res.headers.get('ratelimit-remaining');
				if (remainingStr !== null) {
					const remaining = parseInt(remainingStr, 10);
					if (remaining <= 0) {
						// We've used up our allowance. Schedule a wait for the NEXT request.
						this.nextRequestTime = Date.now() + (resetSeconds + 1) * 1000;
					}
				}

				return res;
			}
		}

		async start(forceRestart = false, mode: ScanMode = this.mode, top50Plays: Play[] = []) {
			if (['scraping_profile', 'scanning_firsts', 'rate_limited'].includes(this.status)) return;

			if (forceRestart || this.status === 'done' || this.status === 'failed') {
				this.reset();
			}

			this.mode = mode;
			this.error = null;
			this.abortController = new AbortController();
			const signal = this.abortController.signal;

			try {
				// Phase 1: Scrape user's plays
				this.status = 'scraping_profile';
				const potentialFirstPlaces = new SvelteSet<string>();
				const seenHashes = new SvelteSet(this.stats.firstPlaces.map((r) => r.hash));

				let page = this.pagesFetched;

				while (true) {
					if (signal.aborted) return;

					const res = await this.fetchWithRateLimit(
						`${API_BASE_URL}/score-search?uid=${this.uid}&page=${page}`,
						signal
					);
					const data: BeatmapScore[] = await res.json();

					if (!Array.isArray(data) || !data.length) break;

					for (const play of data) {
						this.aggregatePlay(play);

						if (play.hash) {
							const h = String(play.hash).toLowerCase();
							if (seenHashes.has(h)) {
								this.stats.duplicateHashes = (this.stats.duplicateHashes || 0) + 1;
							} else {
								seenHashes.add(h);
								potentialFirstPlaces.add(h);
							}
						}
					}

					this.pagesFetched = page + 1;
					this.saveState();
					if (data.length < 100) break;
					page++;
				}

				// PP Timeline
				if (this.rawPpPlays.length > 0) {
					// Inject player's top play directly into the rawPpPlays array
					for (const topPlay of top50Plays) {
						if (topPlay.MapPP && topPlay.PlayedDate && topPlay.Hash) {
							this.rawPpPlays.push({
								hash: String(topPlay.Hash).toLowerCase().trim(),
								date: Math.floor(new Date(topPlay.PlayedDate).getTime() / 1000),
								pp: topPlay.MapPP
							});
						}
					}

					// Sort plays chronologically
					this.rawPpPlays.sort((a, b) => a.date - b.date);

					this.stats.ppTimeline = [];

					const bestPlays = new SvelteMap<string, number>();
					let currentMonthStr = '';

					// Track the user's running ranked playcount through time
					let runningPlayCount = 0;

					for (const play of this.rawPpPlays) {
						const dateObj = new Date(play.date * 1000);
						const playMonth = dateObj.toISOString().slice(0, 7);

						if (currentMonthStr !== '' && currentMonthStr !== playMonth) {
							const monthUnix = new Date(`${currentMonthStr}-01T00:00:00Z`).getTime() / 1000;

							this.stats.ppTimeline.push({
								date: monthUnix,
								cumulativePp: playUtils.calculateTotalPP(
									Array.from(bestPlays.values()),
									runningPlayCount
								)
							});
						}

						currentMonthStr = playMonth;

						// Increment by 1 for every ranked play processed
						runningPlayCount++;

						// Only update the map if this score is better than their previous score on it
						const normalizedHash = String(play.hash).toLowerCase().trim();
						const currentBest = bestPlays.get(normalizedHash) || 0;
						if (play.pp > currentBest) {
							bestPlays.set(normalizedHash, play.pp);
						}
					}

					// Push the final month's result
					if (currentMonthStr !== '') {
						const monthUnix = new Date(`${currentMonthStr}-01T00:00:00Z`).getTime() / 1000;

						this.stats.ppTimeline.push({
							date: monthUnix,
							cumulativePp: playUtils.calculateTotalPP(
								Array.from(bestPlays.values()),
								runningPlayCount
							)
						});
					}

					this.rawPpPlays = []; // Clear memory
				}

				// Phase 2: Verify #1 scores (deep scan only)
				if (this.mode === 'deep') {
					this.status = 'scanning_firsts';
					const existingHashes = new SvelteSet(this.stats.firstPlaces.map((r) => r.hash));
					const hashesToCheck = Array.from(potentialFirstPlaces).filter(
						(h) => !existingHashes.has(h)
					);

					this.hashesTotal = this.stats.firstPlaces.length + hashesToCheck.length;
					this.hashesChecked = this.stats.firstPlaces.length;
					this.saveState();

					for (const hash of hashesToCheck) {
						if (signal.aborted) return;

						try {
							const res = await this.fetchWithRateLimit(
								`${API_BASE_URL}/score-search?hash=${hash}&order=score&page=0`,
								signal
							);
							const leaderboard: BeatmapScore[] = await res.json();
							const top = Array.isArray(leaderboard) ? leaderboard[0] : null;

							if (top && String(top.uid) === String(this.uid) && !existingHashes.has(hash)) {
								const { songTitle, songArtist, mapper, difficulty } = convertTitleToBeatmapMetadata(
									top.filename || ''
								);

								this.stats.firstPlaces.push({
									hash,
									score: top.score,
									pp: top.pp,
									accuracy: top.accuracy || 0,
									date: top.date,
									mods: playUtils.parseModsArray(top.mods).join('') || 'NM',
									title: songTitle,
									artist: songArtist,
									mapper: mapper,
									difficulty: difficulty
								});
								existingHashes.add(hash);
							}
						} catch (err) {
							console.error(`Failed to check hash ${hash}`, err);
						}
						this.hashesChecked++;
						this.saveState();
					}
				} else {
					// Quick scan: do not verify per-hash leaderboard ranks
					this.hashesTotal = 0;
					this.hashesChecked = 0;
					this.saveState();
				}

				if (signal.aborted) return;
				this.status = 'done';
			} catch (err: unknown) {
				if (err instanceof Error && err.name === 'AbortError') {
					this.status = 'idle';
				} else {
					this.status = 'failed';
					this.error = err instanceof Error ? err.message : 'Unknown error';
				}
			} finally {
				this.rateLimitCountdown = 0;
				this.saveState();
			}
		}

		private aggregatePlay(play: BeatmapScore) {
			this.stats.playCount++;

			if (this.stats.grades[play.mark] !== undefined) {
				this.stats.grades[play.mark]++;
			}

			if (play.combo > this.stats.maxCombo) {
				this.stats.maxCombo = play.combo;
				this.stats.maxComboPlay = play;
			}

			if (play.score !== undefined && play.score !== null) {
				if (!this.stats.highestScore || play.score > (this.stats.highestScore.score || 0)) {
					this.stats.highestScore = play;
				}
			}

			this.stats.hits.perfect += play.perfect || 0;
			this.stats.hits.geki += play.geki || 0;
			this.stats.hits.good += play.good || 0;
			this.stats.hits.katu += play.katu || 0;
			this.stats.hits.bad += play.bad || 0;
			this.stats.hits.miss += play.miss || 0;

			const modKey = playUtils.parseModsArray(play.mods).join('') || 'NM';
			if (!this.stats.mods[modKey]) {
				this.stats.mods[modKey] = { count: 0, ppCount: 0, totalPp: 0, avgPp: 0 };
			}

			this.stats.mods[modKey].count++;

			if (play.pp && play.pp > 0) {
				this.stats.mods[modKey].ppCount++;
				this.stats.mods[modKey].totalPp += play.pp;
				this.stats.mods[modKey].avgPp =
					this.stats.mods[modKey].totalPp / this.stats.mods[modKey].ppCount;

				if (play.date && play.hash) {
					this.rawPpPlays.push({ hash: play.hash, date: play.date, pp: play.pp });
				}
			}

			if (play.date) {
				const month = new Date(play.date * 1000).toISOString().slice(0, 7);
				this.stats.timeline[month] = (this.stats.timeline[month] || 0) + 1;
			}

			if (play.filename) {
				const { songArtist, mapper } = convertTitleToBeatmapMetadata(play.filename);

				if (songArtist.trim()) {
					this.stats.artists[songArtist] = (this.stats.artists[songArtist] || 0) + 1;
				}
				if (mapper.trim()) {
					this.stats.mappers[mapper] = (this.stats.mappers[mapper] || 0) + 1;
				}
			}
		}

		private saveState() {
			untrack(() => {
				saveToDB(this.uid, {
					mode: this.mode,
					stats: $state.snapshot(this.stats),
					pagesFetched: this.pagesFetched,
					hashesTotal: this.hashesTotal,
					hashesChecked: this.hashesChecked,
					status: this.status,
					lastUpdated: Math.floor(Date.now() / 1000)
				});
			});
		}
	}
</script>
