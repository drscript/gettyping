import { eq } from 'drizzle-orm';
import { error, json } from '@sveltejs/kit';
import { requireActivePlayer } from '$lib/server/active-player';
import { completeAttempt, createAttemptHandshake } from '$lib/server/attempts';
import { cumulativeKeySet } from '$lib/server/cumulative-key-set';
import { getDatabase } from '$lib/server/database';
import { weakKeyStats } from '$lib/server/database/schema';
import { playerIsEligibleForPractice } from '$lib/server/practice-eligibility';
import { corpus } from '$lib/server/practice-corpus';
import {
	generatePracticeContent,
	type PracticeMode
} from '$lib/server/practice-generation';
import { getRuntimeConfiguration } from '$lib/server/runtime/configuration';
import { generationRandom } from '$lib/server/runtime/random';
import { scoreWeakKeyProfile } from '$lib/server/weak-key-profile';
import type { RequestHandler } from './$types';

function readMode(value: string | null): PracticeMode {
	if (value === null || value === 'sentence') return 'sentence';
	if (value === 'bigram') return value;
	error(400, 'Unknown Practice mode');
}

export const GET: RequestHandler = ({ cookies, url }) => {
	const player = requireActivePlayer(cookies, 'Choose a Nickname before starting Practice');
	const database = getDatabase();
	if (!playerIsEligibleForPractice(database, player.id)) {
		error(403, 'Complete the Speed Test before starting Practice');
	}

	const mode = readMode(url.searchParams.get('mode'));
	const runtime = getRuntimeConfiguration();
	const weakKeyProfile = scoreWeakKeyProfile(
		database
			.select({
				key: weakKeyStats.key,
				attempts: weakKeyStats.attempts,
				errors: weakKeyStats.errors,
				totalLatencyMs: weakKeyStats.totalLatencyMs
			})
			.from(weakKeyStats)
			.where(eq(weakKeyStats.playerId, player.id))
			.all(),
		runtime.latencyClampMs
	);
	const weaknessByKey = new Map(
		weakKeyProfile.flatMap(({ key, weakness }) =>
			weakness === null ? [] : [[key, weakness] as const]
		)
	);
	const content = generatePracticeContent(
		mode,
		weaknessByKey,
		runtime.targetingAggressiveness,
		generationRandom,
		corpus,
		cumulativeKeySet(database, player.id)
	);

	const token = createAttemptHandshake(player.id, { kind: 'generated', content });

	return json({ token, exercise: { content, mode } });
};

function invalidAttemptResponse(): Response {
	return json({ message: 'This Attempt could not be submitted.' }, { status: 400 });
}

export const POST: RequestHandler = async ({ cookies, request }) => {
	const completed = await completeAttempt(cookies, request, 'practice');
	return completed ? json({ score: completed.score }) : invalidAttemptResponse();
};
