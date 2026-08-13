import { asc, eq, inArray } from 'drizzle-orm';
import { getDatabase } from '$lib/server/database';
import { players, stages } from '$lib/server/database/schema';
import { readIdentity } from '$lib/server/identity';
import { playerIsEligibleForPractice } from '$lib/server/practice-eligibility';
import { readStageList } from '$lib/server/stage-progress';
import type { PageServerLoad } from './$types';

/** The Stages the welcome landscape names so the Learn path shows real curriculum. */
const previewStageIds = [1, 2, 3, 21];

function readPreviewStages() {
	return getDatabase()
		.select({ id: stages.id, name: stages.name })
		.from(stages)
		.where(inArray(stages.id, previewStageIds))
		.orderBy(asc(stages.id))
		.all();
}

export const load: PageServerLoad = ({ cookies, url }) => {
	const identity = readIdentity(cookies);
	if (!identity) return { player: null, previewStages: readPreviewStages() };

	const player = getDatabase()
		.select({ id: players.id, nickname: players.nickname })
		.from(players)
		.where(eq(players.id, identity.active))
		.get();

	if (!player) return { player: null, previewStages: readPreviewStages() };

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

	return {
		player,
		continueHref,
		stages: stageList,
		eligibleForPractice: playerIsEligibleForPractice(database, player.id)
	};
};
