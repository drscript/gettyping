import { asc, count, gte, sql } from 'drizzle-orm';
import type { getDatabase } from './database';
import { exercises, players, scores, stageUnlocks, stages, weakKeyStats } from './database/schema';
import { learnAccuracyThreshold } from './stage-progress';

type Database = ReturnType<typeof getDatabase>;

const sevenDaysInMs = 1000 * 60 * 60 * 24 * 7;

export interface GrowthStats {
	totalPlayers: number;
	newPlayersLast7Days: number;
}

export interface EngagementStats {
	totalAttempts: number;
	attemptsLast7Days: number;
	averageAttemptsPerPlayer: number;
}

export interface LearnFunnelStageRow {
	stageId: number;
	name: string;
	playersCleared: number;
}

export interface WeakKeyAggregateRow {
	key: string;
	totalAttempts: number;
	errorRate: number;
}

export interface PracticePerformanceStats {
	attempts: number;
	averageNetWpm: number | null;
	averageAccuracy: number | null;
	weakestKeys: WeakKeyAggregateRow[];
}

export interface ContentPopularityRow {
	exerciseId: number;
	track: 'learn' | 'speed_test';
	stageId: number | null;
	stageName: string | null;
	attempts: number;
	distinctPlayers: number;
}

export interface AdminStats {
	generatedAt: number;
	growth: GrowthStats;
	engagement: EngagementStats;
	learnFunnel: LearnFunnelStageRow[];
	practicePerformance: PracticePerformanceStats;
	contentPopularity: ContentPopularityRow[];
}

function readGrowthStats(database: Database, sevenDaysAgo: number): GrowthStats {
	const totalPlayers = database.select({ value: count() }).from(players).get()!.value;
	const newPlayersLast7Days = database
		.select({ value: count() })
		.from(players)
		.where(gte(players.createdAt, sevenDaysAgo))
		.get()!.value;

	return { totalPlayers, newPlayersLast7Days };
}

function readEngagementStats(
	database: Database,
	sevenDaysAgo: number,
	totalPlayers: number
): EngagementStats {
	const totalAttempts = database.select({ value: count() }).from(scores).get()!.value;
	const attemptsLast7Days = database
		.select({ value: count() })
		.from(scores)
		.where(gte(scores.createdAt, sevenDaysAgo))
		.get()!.value;

	return {
		totalAttempts,
		attemptsLast7Days,
		averageAttemptsPerPlayer: totalPlayers === 0 ? 0 : totalAttempts / totalPlayers
	};
}

// A Stage counts as cleared the same way the rest of the app decides it (see stageIsResolved in
// stage-progress.ts): a qualifying Score on the Stage's Exercise, or an explicit grown-up override
// recorded in stageUnlocks. Most Players clear stages the first way, so counting stageUnlocks alone
// would undercount the funnel almost entirely.
function readLearnFunnel(database: Database): LearnFunnelStageRow[] {
	const clearedCounts = database.all(sql`
		SELECT stageId, COUNT(DISTINCT playerId) AS playersCleared FROM (
			SELECT ${stages.id} AS stageId, ${scores.playerId} AS playerId
			FROM ${scores}
			INNER JOIN ${exercises} ON ${exercises.id} = ${scores.exerciseId}
			INNER JOIN ${stages} ON ${stages.id} = ${exercises.stageId}
			WHERE ${scores.accuracy} >= ${learnAccuracyThreshold}
			UNION
			SELECT ${stageUnlocks.stageId} AS stageId, ${stageUnlocks.playerId} AS playerId
			FROM ${stageUnlocks}
		) cleared
		GROUP BY stageId
	`) as { stageId: number; playersCleared: number }[];
	const clearedByStage = new Map(clearedCounts.map((row) => [row.stageId, row.playersCleared]));

	return database
		.select({ stageId: stages.id, name: stages.name })
		.from(stages)
		.orderBy(asc(stages.id))
		.all()
		.map((stage) => ({
			...stage,
			playersCleared: clearedByStage.get(stage.stageId) ?? 0
		}));
}

// Practice content is generated fresh per Attempt and never gets its own row in `exercises`, so a
// Practice Score's exerciseId is null (see completeAttempt in attempts.ts). "Speed Test & Practice
// performance" is therefore every Score that ISN'T a Learn Score: exerciseId null (Practice) or
// pointing at the one speed_test-track Exercise (the Speed Test itself).
function readPracticePerformance(database: Database): PracticePerformanceStats {
	const aggregate = database.get(sql`
		SELECT
			COUNT(*) AS attempts,
			AVG(${scores.netWpm}) AS averageNetWpm,
			AVG(${scores.accuracy}) AS averageAccuracy
		FROM ${scores}
		LEFT JOIN ${exercises} ON ${exercises.id} = ${scores.exerciseId}
		WHERE ${exercises.track} IS NULL OR ${exercises.track} = 'speed_test'
	`) as { attempts: number; averageNetWpm: number | null; averageAccuracy: number | null };

	const weakestKeys = database.all(sql`
		SELECT
			${weakKeyStats.key} AS key,
			SUM(${weakKeyStats.attempts}) AS totalAttempts,
			SUM(${weakKeyStats.errors}) AS totalErrors
		FROM ${weakKeyStats}
		GROUP BY ${weakKeyStats.key}
		HAVING totalAttempts > 0
		ORDER BY (totalErrors * 1.0 / totalAttempts) DESC, totalAttempts DESC
		LIMIT 10
	`) as { key: string; totalAttempts: number; totalErrors: number }[];

	return {
		...aggregate,
		weakestKeys: weakestKeys.map(({ key, totalAttempts, totalErrors }) => ({
			key,
			totalAttempts,
			errorRate: totalErrors / totalAttempts
		}))
	};
}

// Ranks the persisted Exercises (21 Learn + the Speed Test) by Attempts, zero-attempt ones included.
// Generated Practice content has no stable identity across Attempts, so it can't be ranked here — see
// readPracticePerformance for its Scores.
function readContentPopularity(database: Database): ContentPopularityRow[] {
	return database.all(sql`
		SELECT
			${exercises.id} AS exerciseId,
			${exercises.track} AS track,
			${exercises.stageId} AS stageId,
			${stages.name} AS stageName,
			COUNT(${scores.id}) AS attempts,
			COUNT(DISTINCT ${scores.playerId}) AS distinctPlayers
		FROM ${exercises}
		LEFT JOIN ${scores} ON ${scores.exerciseId} = ${exercises.id}
		LEFT JOIN ${stages} ON ${stages.id} = ${exercises.stageId}
		GROUP BY ${exercises.id}
		ORDER BY attempts DESC, ${exercises.id} ASC
	`) as ContentPopularityRow[];
}

export function readAdminStats(database: Database, now: number = Date.now()): AdminStats {
	const sevenDaysAgo = now - sevenDaysInMs;
	const growth = readGrowthStats(database, sevenDaysAgo);

	return {
		generatedAt: now,
		growth,
		engagement: readEngagementStats(database, sevenDaysAgo, growth.totalPlayers),
		learnFunnel: readLearnFunnel(database),
		practicePerformance: readPracticePerformance(database),
		contentPopularity: readContentPopularity(database)
	};
}
