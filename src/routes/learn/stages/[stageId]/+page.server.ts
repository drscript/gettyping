import { keysTaughtByStage, stageIsAvailable } from '$lib/server/stage-progress';
import { getDatabase } from '$lib/server/database';
import { readIdentity } from '$lib/server/identity';
import { shouldOfferLeadIn } from '$lib/server/lead-in';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ cookies, params }) => {
	const stageId = Number(params.stageId);
	const database = getDatabase();
	const taught = keysTaughtByStage(database).get(stageId) ?? [];
	const identity = readIdentity(cookies);
	const leadInOffered =
		identity !== undefined &&
		Number.isInteger(stageId) &&
		stageIsAvailable(database, identity.active, stageId) &&
		shouldOfferLeadIn(database, identity.active, stageId);

	return {
		stageId,
		keysTaught: taught,
		leadInOffered,
		leadInPrompt: leadInOffered
			? stageId >= 5
				? 'Try some words first'
				: 'Try these first'
			: ''
	};
};
