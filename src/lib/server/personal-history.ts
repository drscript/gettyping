import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm';
import { exercises, scores, stages, weakKeyStats } from './database/schema';
import type { getDatabase } from './database';
import { getRuntimeConfiguration } from './runtime/configuration';
import { readStageList } from './stage-progress';
import { scoreWeakKeyProfile, type WeakKeyProfileEntry } from './weak-key-profile';
import {
	capByRecordedKey,
	canonicalKeyFor,
	type KeyboardCap,
	type WeakKeyHeatEntry
} from '$lib/ui/keyboard-caps';
import type { TypingKey } from '$lib/ui/types';

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
	const stats = database
		.select({
			key: weakKeyStats.key,
			attempts: weakKeyStats.attempts,
			errors: weakKeyStats.errors,
			totalLatencyMs: weakKeyStats.totalLatencyMs
		})
		.from(weakKeyStats)
		.where(eq(weakKeyStats.playerId, playerId))
		.all();

	// Dual-value caps (`1 !`, `/ ?`, `; :`) pool the raw stats of both recorded
	// keys; the sample floor applies to the pooled attempts. Shift pools nothing —
	// it is never an expected character, so it can never carry Profile data.
	const pooledByCap = new Map<KeyboardCap, WeakKeyProfileEntry & { key: TypingKey }>();
	for (const row of stats) {
		const cap = capByRecordedKey.get(row.key as TypingKey);
		if (!cap) continue;
		const canonical = canonicalKeyFor(cap);
		if (canonical === undefined) continue;
		const pooled = pooledByCap.get(cap) ?? {
			key: canonical,
			attempts: 0,
			errors: 0,
			totalLatencyMs: 0
		};
		pooled.attempts += row.attempts;
		pooled.errors += row.errors;
		pooled.totalLatencyMs += row.totalLatencyMs;
		pooledByCap.set(cap, pooled);
	}

	// The heat map is every floored cap, scored with the unchanged Profile formula.
	// Below-floor and never-typed caps are simply absent — the render treats absence
	// as neutral. The letter-only top-5 slice stays on `/api/weak-key-profile`.
	const weakKeyHeat: WeakKeyHeatEntry[] = scoreWeakKeyProfile([...pooledByCap.values()], latencyClampMs)
		.filter((entry): entry is typeof entry & { weakness: number } => entry.weakness !== null)
		.sort((left, right) => right.weakness - left.weakness || left.key.localeCompare(right.key))
		// The pooled keys come from the cap table's canonical recorded keys, so
		// they are always members of TypingKey even though the scorer widens them.
		.map(({ key, weakness }) => ({ key: key as TypingKey, weakness }));

	return {
		speedTestScores,
		learnScores: [...bestByStage.values()],
		practice: { ...practiceAggregate, weakKeyHeat }
	};
}
