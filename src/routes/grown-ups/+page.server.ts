import { eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { requireActivePlayer } from '$lib/server/active-player';
import { getDatabase } from '$lib/server/database';
import { players, stageUnlocks } from '$lib/server/database/schema';
import { readIdentity } from '$lib/server/identity';
import {
	readStageList,
	stageIsAvailable,
	stageIsResolved
} from '$lib/server/stage-progress';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ cookies }) => {
	const identity = readIdentity(cookies);
	if (!identity) return { currentStage: null };
	const database = getDatabase();
	const player = database
		.select({ id: players.id })
		.from(players)
		.where(eq(players.id, identity.active))
		.get();
	if (!player) return { currentStage: null };
	const stages = readStageList(database, player.id);
	return { currentStage: stages.find((stage) => stage.state === 'current') ?? null };
};

export const actions: Actions = {
	'resolve-stage': async ({ cookies, request }) => {
		const player = requireActivePlayer(cookies, 'Choose a Nickname before resolving a Stage');
		const data = await request.formData();
		const stageId = Number(data.get('stageId'));
		if (!Number.isInteger(stageId) || stageId < 1 || stageId > 21) {
			return fail(400, { message: 'That Stage could not be resolved.' });
		}

		const database = getDatabase();
		if (!stageIsAvailable(database, player.id, stageId) || stageIsResolved(database, player.id, stageId)) {
			return fail(409, { message: 'Only the current unresolved Stage can be resolved.' });
		}

		database
			.insert(stageUnlocks)
			.values({ playerId: player.id, stageId, grantedAt: Date.now() })
			.onConflictDoNothing()
			.run();

		redirect(303, stageId === 21 ? '/learn/complete' : '/');
	}
};
