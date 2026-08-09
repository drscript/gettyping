import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { getDatabase } from './database';
import { exercises, scores } from './database/schema';
import { getRuntimeConfiguration } from './runtime/configuration';
import { learnAccuracyThreshold } from './stage-progress';

interface RankedScoreRow {
	rank: number;
	scoreId: number;
	playerId: string;
	nickname: string;
	netWpm: number;
	accuracy: number;
}

export interface LeaderboardRow {
	rank: number;
	scoreId: number;
	nickname: string;
	netWpm: number;
	accuracy: number;
}

export interface PersonalLeaderboardRow {
	rank: number | null;
	status: 'ranked' | 'not-ranked';
	scoreId: number;
	nickname: string;
	netWpm: number;
	accuracy: number;
}

export interface LeaderboardRead {
	exerciseId: number;
	suppressed: boolean;
	distinctRankedPlayers: number;
	rows: LeaderboardRow[];
	personal: PersonalLeaderboardRow | null;
	personalBest: boolean;
}

export function readLeaderboard(
	exerciseId: number,
	playerId: string,
	currentScoreId?: number
): LeaderboardRead | undefined {
	const database = getDatabase();
	const exercise = database
		.select({ id: exercises.id, track: exercises.track })
		.from(exercises)
		.where(eq(exercises.id, exerciseId))
		.get();
	if (!exercise) return undefined;

	const accuracyPredicate =
		exercise.track === 'learn'
			? sql`and ${scores.accuracy} >= ${learnAccuracyThreshold}`
			: sql``;
	const rankedScores = database.all(sql`
		WITH ranked AS (
			SELECT
				${scores.id} AS scoreId,
				${scores.playerId} AS playerId,
				${scores.nickname} AS nickname,
				${scores.netWpm} AS netWpm,
				${scores.accuracy} AS accuracy,
				ROW_NUMBER() OVER (
					PARTITION BY ${scores.playerId}
					ORDER BY ${scores.netWpm} DESC, ${scores.id} ASC
				) AS playerBest
			FROM ${scores}
			WHERE ${scores.exerciseId} = ${exerciseId}
				AND ${scores.leaderboardEligible} = 1
				${accuracyPredicate}
		), bests AS (
			SELECT * FROM ranked WHERE playerBest = 1
		)
		SELECT
			scoreId,
			playerId,
			nickname,
			netWpm,
			accuracy,
			ROW_NUMBER() OVER (ORDER BY netWpm DESC, scoreId ASC) AS rank
		FROM bests
		ORDER BY netWpm DESC, scoreId ASC
	`) as RankedScoreRow[];

	const personalConditions = [
		eq(scores.exerciseId, exerciseId),
		eq(scores.playerId, playerId)
	];
	if (exercise.track === 'learn') {
		personalConditions.push(gte(scores.accuracy, learnAccuracyThreshold));
	}
	const personalBestScore = database
		.select({
			scoreId: scores.id,
			nickname: scores.nickname,
			netWpm: scores.netWpm,
			accuracy: scores.accuracy
		})
		.from(scores)
		.where(and(...personalConditions))
		.orderBy(desc(scores.netWpm), scores.id)
		.get();
	const rankedPersonal = personalBestScore
		? rankedScores.find((row) => row.scoreId === personalBestScore.scoreId)
		: undefined;
	const personal: PersonalLeaderboardRow | null = personalBestScore
		? {
				rank: rankedPersonal?.rank ?? null,
				status: rankedPersonal ? 'ranked' : 'not-ranked',
				...personalBestScore
			}
		: null;
	const distinctRankedPlayers = rankedScores.length;
	const suppressed =
		distinctRankedPlayers < getRuntimeConfiguration().leaderboardDisplayThreshold;

	return {
		exerciseId,
		suppressed,
		distinctRankedPlayers,
		rows: suppressed
			? []
			: rankedScores.slice(0, 10).map(({ playerId: _playerId, ...row }) => row),
		personal,
		personalBest: currentScoreId !== undefined && personal?.scoreId === currentScoreId
	};
}
