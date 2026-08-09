import { redirect } from '@sveltejs/kit';
import { requireActivePlayer } from '$lib/server/active-player';
import { getDatabase } from '$lib/server/database';
import { stageIsResolved } from '$lib/server/stage-progress';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ cookies }) => {
	const player = requireActivePlayer(cookies, 'Choose a Nickname before opening Learn completion');
	if (!stageIsResolved(getDatabase(), player.id, 21)) redirect(303, '/');
	return {};
};
