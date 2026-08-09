import { eq } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import { requireActivePlayer } from '$lib/server/active-player';
import { getDatabase } from '$lib/server/database';
import { weakKeyStats } from '$lib/server/database/schema';
import { getRuntimeConfiguration } from '$lib/server/runtime/configuration';
import { scoreWeakKeyProfile } from '$lib/server/weak-key-profile';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ cookies }) => {
	const player = requireActivePlayer(
		cookies,
		'Choose a Nickname before viewing your Weak-key Profile'
	);
	const database = getDatabase();
	const { latencyClampMs } = getRuntimeConfiguration();
	const keys = scoreWeakKeyProfile(
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
		latencyClampMs
	)
		.filter(
			(entry): entry is typeof entry & { weakness: number } =>
				/^[a-z]$/.test(entry.key) && entry.weakness !== null
		)
		.sort((left, right) => right.weakness - left.weakness || left.key.localeCompare(right.key))
		.slice(0, 5)
		.map(({ key, weakness }) => ({ key, weakness }));

	return json({ keys });
};
