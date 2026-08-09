import { eq } from 'drizzle-orm';
import { getDatabase } from '$lib/server/database';
import { players } from '$lib/server/database/schema';
import { readIdentity } from '$lib/server/identity';
import { readStageList } from '$lib/server/stage-progress';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ cookies, url }) => {
	const identity = readIdentity(cookies);
	if (!identity) return { player: null };

	const player = getDatabase()
		.select({ id: players.id, nickname: players.nickname })
		.from(players)
		.where(eq(players.id, identity.active))
		.get();

	if (!player) return { player: null };

	const database = getDatabase();
	const stageList = readStageList(database, player.id);
	const nextStage = stageList.find((stage) => stage.state === 'current');
	const requestedTrack = url.searchParams.get('track');
	const continueHref =
		requestedTrack === 'speed-test-practice'
			? '/speed-test'
			: nextStage
				? `/learn/stages/${nextStage.id}`
				: '/speed-test';

	return { player, continueHref, stages: stageList };
};
