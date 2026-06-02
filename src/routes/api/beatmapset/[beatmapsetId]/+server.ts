import { json, type RequestHandler } from '@sveltejs/kit';
import { getBeatmapset } from '$lib/services/osuApi';
import { NotFoundError } from '$lib/services/errors/osuApiError';
import logger from '$lib/utils/logger';

const createFallbackBeatmapset = () => ({
	id: 0,
	title: 'Unknown Title',
	artist: 'Unknown Artist',
	creator: 'Unknown Mapper',
	status: 'graveyard',
	covers: {},
	beatmaps: []
});

export const GET: RequestHandler = async ({ params }) => {
	const rawId = String(params.beatmapsetId ?? '').trim();
	const beatmapsetId = parseInt(rawId, 10);

	if (isNaN(beatmapsetId)) {
		return json({ error: 'Invalid beatmapset ID' }, { status: 400 });
	}

	// Handle Fallback Mode (beatmapsetId = 0)
	if (beatmapsetId === 0) {
		logger.info('📦 Returning fallback mock beatmapset for ID 0');
		return json(createFallbackBeatmapset());
	}

	try {
		logger.info(`📦 Fetching beatmapset by ID: ${beatmapsetId}`);
		const beatmapset = await getBeatmapset(beatmapsetId);

		if (!beatmapset) {
			return json({ error: 'Beatmapset not found' }, { status: 404 });
		}

		return json(beatmapset);
	} catch (error) {
		if (error instanceof NotFoundError) {
			return json({ error: 'Beatmapset not found' }, { status: 404 });
		}

		logger.error({ error }, '❌ Failed to fetch beatmapset');
		return json({ error: 'Failed to fetch beatmapset' }, { status: 500 });
	}
};
