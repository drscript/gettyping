import { and, eq, gte, ne } from 'drizzle-orm';
import type { getDatabase } from './database';
import { exercises, scores, stageUnlocks } from './database/schema';

export const learnAccuracyThreshold = 0.9;

type Database = ReturnType<typeof getDatabase>;

export function stageIsResolved(
	database: Database,
	playerId: string,
	stageId: number,
	excludingScoreId?: number
): boolean {
	const scoreConditions = [
		eq(scores.playerId, playerId),
		eq(exercises.stageId, stageId),
		gte(scores.accuracy, learnAccuracyThreshold)
	];
	if (excludingScoreId !== undefined) scoreConditions.push(ne(scores.id, excludingScoreId));
	const qualifyingScore = database
		.select({ id: scores.id })
		.from(scores)
		.innerJoin(exercises, eq(exercises.id, scores.exerciseId))
		.where(and(...scoreConditions))
		.get();
	const unlock = database
		.select({ stageId: stageUnlocks.stageId })
		.from(stageUnlocks)
		.where(and(eq(stageUnlocks.playerId, playerId), eq(stageUnlocks.stageId, stageId)))
		.get();
	return Boolean(qualifyingScore || unlock);
}

export function stageIsAvailable(database: Database, playerId: string, stageId: number): boolean {
	return stageId === 1 || (stageId > 1 && stageIsResolved(database, playerId, stageId - 1));
}
