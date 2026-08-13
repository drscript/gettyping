import { and, asc, desc, eq, gte, ne } from 'drizzle-orm';
import type { getDatabase } from './database';
import { exercises, scores, stages, stageUnlocks } from './database/schema';

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

export function consecutiveStageFailures(
	database: Database,
	playerId: string,
	stageId: number
): number {
	const attempts = database
		.select({ accuracy: scores.accuracy })
		.from(scores)
		.innerJoin(exercises, eq(exercises.id, scores.exerciseId))
		.where(and(eq(scores.playerId, playerId), eq(exercises.stageId, stageId)))
		.orderBy(desc(scores.id))
		.all();

	let failures = 0;
	for (const attempt of attempts) {
		if (attempt.accuracy >= learnAccuracyThreshold) break;
		failures += 1;
	}
	return failures;
}

export function keysTaughtByStage(database: Database): ReadonlyMap<number, string[]> {
	return new Map(
		database
			.select({ id: stages.id, keysTaught: stages.keysTaught })
			.from(stages)
			.orderBy(asc(stages.id))
			.all()
			.map((stage) => [stage.id, stage.keysTaught] as const)
	);
}

export function readStageList(database: Database, playerId: string) {
	return database
		.select({ id: stages.id, name: stages.name, keysTaught: stages.keysTaught })
		.from(stages)
		.orderBy(asc(stages.id))
		.all()
		.map((stage) => ({
			...stage,
			state: stageIsResolved(database, playerId, stage.id)
				? ('cleared' as const)
				: stageIsAvailable(database, playerId, stage.id)
					? ('current' as const)
					: ('locked' as const)
		}));
}
