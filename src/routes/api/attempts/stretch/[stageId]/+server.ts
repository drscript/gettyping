import { error, json } from '@sveltejs/kit';
import { requireActivePlayer } from '$lib/server/active-player';
import { completeStretchAttempt, createAttemptHandshake } from '$lib/server/attempts';
import { getDatabase } from '$lib/server/database';
import { generateFingerStretchContent } from '$lib/server/finger-stretch-generation';
import { keysTaughtByStage, stageIsAvailable } from '$lib/server/stage-progress';
import { getRuntimeConfiguration } from '$lib/server/runtime/configuration';
import { generationRandom } from '$lib/server/runtime/random';
import type { RequestHandler } from './$types';

function readStageId(value: string): number {
	const stageId = Number(value);
	if (!Number.isInteger(stageId) || stageId < 1 || stageId > 21) error(404, 'Stage not found');
	return stageId;
}

export const GET: RequestHandler = ({ cookies, params }) => {
	const stageId = readStageId(params.stageId);
	const playerId = requireActivePlayer(cookies, 'Choose a Nickname before starting Learn').id;
	const database = getDatabase();
	if (!stageIsAvailable(database, playerId, stageId)) error(403, 'This Stage is not open yet');

	const content = generateFingerStretchContent(
		stageId,
		keysTaughtByStage(database),
		getRuntimeConfiguration().stretchLengthFactor,
		generationRandom
	);

	const token = createAttemptHandshake(playerId, { kind: 'generated', content });
	return json({ token, exercise: { content } });
};

function invalidAttemptResponse(): Response {
	return json({ message: 'This Attempt could not be submitted.' }, { status: 400 });
}

export const POST: RequestHandler = async ({ cookies, request }) => {
	const completed = await completeStretchAttempt(cookies, request);
	return completed ? json({ accuracy: completed.accuracy }) : invalidAttemptResponse();
};
