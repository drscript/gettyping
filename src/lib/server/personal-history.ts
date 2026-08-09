import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm';
import { exercises, scores, stages, weakKeyStats } from './database/schema';
import type { getDatabase } from './database';
import { getRuntimeConfiguration } from './runtime/configuration';
import { readStageList } from './stage-progress';
import { scoreWeakKeyProfile } from './weak-key-profile';

type Database = ReturnType<typeof getDatabase>;

export function readPersonalHistory(database: Database, playerId: string) {
	const speedTestScores = database
		.select({
			id: scores.id,
			nickname: scores.nickname,
			netWpm: scores.netWpm,
			accuracy: scores.accuracy,
			leaderboardEligible: scores.leaderboardEligible,
			createdAt: scores.createdAt
		})
		.from(scores)
		.innerJoin(exercises, eq(exercises.id, scores.exerciseId))
		.where(and(eq(scores.playerId, playerId), eq(exercises.track, 'speed_test')))
		.orderBy(asc(scores.createdAt), asc(scores.id))
		.all();

	const clearedStageIds = new Set(
		readStageList(database, playerId)
			.filter((stage) => stage.state === 'cleared')
			.map((stage) => stage.id)
	);
	const bestByStage = new Map<
		number,
		{
			id: number;
			stageId: number;
			stageName: string;
			nickname: string;
			netWpm: number;
			accuracy: number;
			createdAt: number;
		}
	>();
	for (const score of database
		.select({
			id: scores.id,
			stageId: exercises.stageId,
			stageName: stages.name,
			nickname: scores.nickname,
			netWpm: scores.netWpm,
			accuracy: scores.accuracy,
			createdAt: scores.createdAt
		})
		.from(scores)
		.innerJoin(exercises, eq(exercises.id, scores.exerciseId))
		.innerJoin(stages, eq(stages.id, exercises.stageId))
		.where(and(eq(scores.playerId, playerId), eq(exercises.track, 'learn')))
		.orderBy(asc(exercises.stageId), desc(scores.netWpm), asc(scores.id))
		.all()) {
		if (
			score.stageId !== null &&
			clearedStageIds.has(score.stageId) &&
			!bestByStage.has(score.stageId)
		) {
			bestByStage.set(score.stageId, { ...score, stageId: score.stageId });
		}
	}

	const practiceAggregate = database
		.select({
			attempts: sql<number>`count(*)`.mapWith(Number),
			elapsedMs: sql<number>`coalesce(sum(${scores.elapsedMs}), 0)`.mapWith(Number)
		})
		.from(scores)
		.where(and(eq(scores.playerId, playerId), isNull(scores.exerciseId)))
		.get() ?? { attempts: 0, elapsedMs: 0 };
	const { latencyClampMs } = getRuntimeConfiguration();
	const weakKeys = scoreWeakKeyProfile(
		database
			.select({
				key: weakKeyStats.key,
				attempts: weakKeyStats.attempts,
				errors: weakKeyStats.errors,
				totalLatencyMs: weakKeyStats.totalLatencyMs
			})
			.from(weakKeyStats)
			.where(eq(weakKeyStats.playerId, playerId))
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

	return {
		speedTestScores,
		learnScores: [...bestByStage.values()],
		practice: { ...practiceAggregate, weakKeys }
	};
}
