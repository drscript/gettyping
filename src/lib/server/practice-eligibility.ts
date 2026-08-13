import { and, eq, inArray } from 'drizzle-orm';
import type { getDatabase } from './database';
import { exercises, scores } from './database/schema';

type Database = ReturnType<typeof getDatabase>;

export function playerIsEligibleForPractice(database: Database, playerId: string): boolean {
	return Boolean(
		database
			.select({ id: scores.id })
			.from(scores)
			.innerJoin(exercises, eq(exercises.id, scores.exerciseId))
			.where(
				and(eq(scores.playerId, playerId), inArray(exercises.track, ['learn', 'speed_test']))
			)
			.limit(1)
			.get()
	);
}
