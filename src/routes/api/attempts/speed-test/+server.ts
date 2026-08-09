import { and, eq, isNotNull } from 'drizzle-orm';
import { error, json } from '@sveltejs/kit';
import { requireActivePlayer } from '$lib/server/active-player';
import { completeAttempt, createAttemptHandshake } from '$lib/server/attempts';
import { getDatabase } from '$lib/server/database';
import { exercises } from '$lib/server/database/schema';
import { readLeaderboard } from '$lib/server/leaderboards';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ cookies }) => {
	const player = requireActivePlayer(cookies, 'Choose a Nickname before starting the Speed Test');
	const database = getDatabase();
	const exercise = database
		.select({ id: exercises.id, content: exercises.content })
		.from(exercises)
		.where(and(eq(exercises.track, 'speed_test'), isNotNull(exercises.content)))
		.get();
	if (!exercise?.content) error(503, 'The Speed Test is not available');

	const token = createAttemptHandshake(player.id, {
		kind: 'fixed',
		exerciseId: exercise.id
	});

	return json({ token, exercise });
};

function invalidAttemptResponse(): Response {
	return json({ message: 'This Attempt could not be submitted.' }, { status: 400 });
}

export const POST: RequestHandler = async ({ cookies, request }) => {
	const completed = await completeAttempt(cookies, request, 'speed-test');
	if (!completed || completed.exerciseId === null) return invalidAttemptResponse();
	return json({
		score: completed.score,
		leaderboard: readLeaderboard(
			completed.exerciseId,
			completed.playerId,
			completed.score.id
		)
	});
};
