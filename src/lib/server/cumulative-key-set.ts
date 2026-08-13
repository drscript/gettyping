import { and, eq } from 'drizzle-orm';
import type { getDatabase } from './database';
import { exercises, scores } from './database/schema';
import { readStageList } from './stage-progress';

type Database = ReturnType<typeof getDatabase>;

const alphabet = [...'abcdefghijklmnopqrstuvwxyz'];

function learnStarted(database: Database, playerId: string): boolean {
	return Boolean(
		database
			.select({ id: scores.id })
			.from(scores)
			.innerJoin(exercises, eq(exercises.id, scores.exerciseId))
			.where(and(eq(scores.playerId, playerId), eq(exercises.track, 'learn')))
			.limit(1)
			.get()
	);
}

export function cumulativeKeySet(database: Database, playerId: string): ReadonlySet<string> {
	if (!learnStarted(database, playerId)) return new Set(alphabet);

	const keys = new Set<string>();
	for (const stage of readStageList(database, playerId)) {
		if (stage.state !== 'cleared' && stage.state !== 'current') continue;
		for (const key of stage.keysTaught) keys.add(key);
	}
	return keys;
}
