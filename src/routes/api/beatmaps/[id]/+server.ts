import { json, type RequestHandler } from '@sveltejs/kit';
import { getBeatmaps, lookupBeatmap, refreshTokenIfNeeded } from '$lib/services/osuApi';
import { NotFoundError } from '$lib/services/errors/osuApiError';
import logger from '$lib/utils/logger';

const MD5_REGEX = /^[a-fA-F0-9]{32}$/i;

const createFallbackBeatmap = (hash: string) => ({
	id: hash,
	beatmapset_id: 0,
	checksum: hash,
	version: 'Unknown Difficulty',
	difficulty_rating: 0,
	status: 'graveyard',
	beatmapset: {
		title: 'Unknown Title',
		artist: 'Unknown Artist',
		creator: 'Unknown Mapper',
		covers: {}
	}
});

export const GET: RequestHandler = async ({ params }) => {
	const raw = String(params.id ?? '').trim();

	if (!raw) {
		return json({ error: 'Missing beatmap identifier' }, { status: 400 });
	}

	const isHash = MD5_REGEX.test(raw);
	const isNumericId = /^\d+$/.test(raw);

	if (!isHash && !isNumericId) {
		return json(
			{ error: 'Invalid beatmap identifier. Must be a numeric beatmap ID or 32-char MD5 hash.' },
			{ status: 400 }
		);
	}

	try {
		await refreshTokenIfNeeded();

		// Resolve by Hash (with Fallback)
		if (isHash) {
			const hash = raw.toLowerCase();
			logger.info(`🎵 Fetching beatmap by hash: ${hash}`);

			try {
				const beatmap = await lookupBeatmap(undefined, hash);
				return json(beatmap || createFallbackBeatmap(hash));
			} catch (error) {
				if (error instanceof NotFoundError) {
					return json(createFallbackBeatmap(hash));
				}

				logger.error({ error }, '❌ Failed to fetch beatmap');
				return json({ error: 'Failed to fetch beatmap' }, { status: 500 });
			}
		}

		// Resolve by Numeric ID
		const id = parseInt(raw, 10);
		logger.info(`🎵 Fetching beatmap by ID: ${id}`);

		const beatmaps = await getBeatmaps([id]);

		if (!beatmaps || beatmaps.length === 0) {
			return json({ error: 'Beatmap not found' }, { status: 404 });
		}

		return json(beatmaps[0]);
	} catch (error) {
		if (error instanceof NotFoundError) {
			return json({ error: 'Beatmap not found' }, { status: 404 });
		}

		logger.error({ error }, '❌ Failed to fetch beatmap');
		return json({ error: 'Failed to fetch beatmap' }, { status: 500 });
	}
};
