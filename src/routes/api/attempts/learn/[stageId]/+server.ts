import { and, eq } from 'drizzle-orm';
import { error, json } from '@sveltejs/kit';
import { requireActivePlayer } from '$lib/server/active-player';
import { completeAttempt, createAttemptHandshake } from '$lib/server/attempts';
import { getDatabase } from '$lib/server/database';
import { exercises, stages } from '$lib/server/database/schema';
import {
	consecutiveStageFailures,
	learnAccuracyThreshold,
	stageIsAvailable,
	stageIsResolved
} from '$lib/server/stage-progress';
import { getRuntimeConfiguration } from '$lib/server/runtime/configuration';
import { readLeaderboard } from '$lib/server/leaderboards';
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

	const exercise = database
		.select({
			id: exercises.id,
			stageId: exercises.stageId,
			content: exercises.content,
			name: stages.name,
			keysTaught: stages.keysTaught
		})
		.from(exercises)
		.innerJoin(stages, eq(stages.id, exercises.stageId))
		.where(and(eq(exercises.track, 'learn'), eq(exercises.stageId, stageId)))
		.get();
	if (!exercise?.content || exercise.stageId === null) error(503, 'This Stage is not ready yet');

	const token = createAttemptHandshake(playerId, { kind: 'fixed', exerciseId: exercise.id });
	return json({
		token,
		exercise: { id: exercise.id, stageId: exercise.stageId, content: exercise.content },
		stage: {
			id: exercise.stageId,
			name: exercise.name,
			keysTaught: exercise.keysTaught,
			requiredAccuracy: learnAccuracyThreshold
		}
	});
};

function invalidAttemptResponse(): Response {
	return json({ message: 'This Attempt could not be submitted.' }, { status: 400 });
}

export const POST: RequestHandler = async ({ cookies, params, request }) => {
	const stageId = readStageId(params.stageId);
	const completed = await completeAttempt(cookies, request, 'learn', stageId);
	if (!completed) return invalidAttemptResponse();

	const alreadyResolved = stageIsResolved(
		getDatabase(),
		completed.playerId,
		stageId,
		completed.score.id
	);
	const cleared = alreadyResolved || completed.score.accuracy >= learnAccuracyThreshold;
	const completedTrack = cleared && stageId === 21;
	const runtime = getRuntimeConfiguration();
	const failureStreak = cleared
		? 0
		: consecutiveStageFailures(getDatabase(), completed.playerId, stageId);
	const adultHelpAvailable = !cleared && failureStreak >= runtime.consecutiveFailureCount;
	const stretchAvailable = !cleared && failureStreak >= runtime.stretchOfferCount;
	return json({
		score: completed.score,
		...(cleared && completed.exerciseId !== null
			? {
					leaderboard: readLeaderboard(
						completed.exerciseId,
						completed.playerId,
						completed.score.id
					)
				}
			: {}),
		result: {
			state: completedTrack ? 'completed' : cleared ? 'cleared' : 'failed',
			achievedAccuracy: completed.score.accuracy,
			requiredAccuracy: learnAccuracyThreshold,
			nextStageId: cleared && stageId < 21 ? stageId + 1 : null,
			...(!cleared ? { adultHelpAvailable, stretchAvailable } : {})
		}
	});
};
