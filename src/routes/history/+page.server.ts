import { redirect } from '@sveltejs/kit';
import { requireActivePlayer } from '$lib/server/active-player';
import { getDatabase } from '$lib/server/database';
import { readIdentity } from '$lib/server/identity';
import { readPersonalHistory } from '$lib/server/personal-history';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ cookies }) => {
	if (!readIdentity(cookies)) redirect(303, '/');
	const player = requireActivePlayer(cookies, 'Choose a Nickname before viewing history');
	return readPersonalHistory(getDatabase(), player.id);
};
