import Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { startTestServer, type TestServer } from './server';

interface StartedAttempt {
	token: string;
	exercise: { id: number; content: string };
}

interface LeaderboardBody {
	exerciseId: number;
	suppressed: boolean;
	distinctRankedPlayers: number;
	rows: Array<{ rank: number; scoreId: number; nickname: string; netWpm: number }>;
	personal: {
		rank: number | null;
		status: 'ranked' | 'not-ranked';
		scoreId: number;
		nickname: string;
		netWpm: number;
	};
	personalBest: boolean;
}

async function createPlayer(
	server: TestServer,
	nickname: string,
	track = 'speed-test-practice'
): Promise<{ cookie: string; playerId: string }> {
	const response = await fetch(`${server.baseUrl}/nickname?/create`, {
		method: 'POST',
		headers: {
			accept: 'text/html',
			'content-type': 'application/x-www-form-urlencoded',
			origin: server.baseUrl
		},
		body: new URLSearchParams({ track, source: 'typed', nickname }),
		redirect: 'manual'
	});
	expect(response.status).toBe(303);

	const database = new Database(server.databasePath, { readonly: true });
	const player = database
		.prepare('SELECT id FROM players WHERE nickname = ? ORDER BY created_at DESC')
		.get(nickname) as { id: string };
	 database.close();
	return { cookie: response.headers.get('set-cookie')!.split(';', 1)[0], playerId: player.id };
}

function insertScore(
	server: TestServer,
	playerId: string,
	nickname: string,
	values: {
		exerciseId: number;
		netWpm: number;
		accuracy?: number;
		eligible?: boolean;
		createdAt?: number;
	}
): number {
	const database = new Database(server.databasePath);
	const result = database
		.prepare(
			`INSERT INTO scores
			 (player_id, exercise_id, nickname, net_wpm, gross_wpm, accuracy, elapsed_ms,
			  char_count, error_count, leaderboard_eligible, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, 60000, 100, 0, ?, ?)`
		)
		.run(
			playerId,
			values.exerciseId,
			nickname,
			values.netWpm,
			values.netWpm,
			values.accuracy ?? 1,
			values.eligible === false ? 0 : 1,
			values.createdAt ?? Date.now()
		);
	database.close();
	return Number(result.lastInsertRowid);
}

async function readBoard(
	server: TestServer,
	cookie: string,
	exerciseId: number
): Promise<LeaderboardBody> {
	const response = await fetch(`${server.baseUrl}/api/leaderboards/${exerciseId}`, {
		headers: { cookie }
	});
	expect(response.status).toBe(200);
	return (await response.json()) as LeaderboardBody;
}

function perfectEvents(content: string, elapsedMs: number) {
	return [...content].map((character, index) => ({
		expected: character,
		received: character,
		timestampOffsetMs: Math.round(((index + 1) / content.length) * elapsedMs)
	}));
}

async function completeSpeedTest(
	server: TestServer,
	cookie: string,
	elapsedMs: number
): Promise<{ score: { id: number }; leaderboard: LeaderboardBody }> {
	const startedResponse = await fetch(`${server.baseUrl}/api/attempts/speed-test`, {
		headers: { cookie }
	});
	const started = (await startedResponse.json()) as StartedAttempt;
	const database = new Database(server.databasePath);
	database
		.prepare('UPDATE attempt_tokens SET served_at = ? WHERE id = ?')
		.run(Date.now() - elapsedMs - 1_000, started.token);
	database.close();

	const response = await fetch(`${server.baseUrl}/api/attempts/speed-test`, {
		method: 'POST',
		headers: { cookie, 'content-type': 'application/json' },
		body: JSON.stringify({
			token: started.token,
			events: perfectEvents(started.exercise.content, elapsedMs)
		})
	});
	expect(response.status).toBe(200);
	return (await response.json()) as { score: { id: number }; leaderboard: LeaderboardBody };
}

describe('per-Exercise Leaderboards', () => {
	let server: TestServer;

	beforeAll(async () => {
		server = await startTestServer({
			LEADERBOARD_DISPLAY_THRESHOLD: '3',
			NET_WPM_CEILING: '100'
		});
	});

	afterAll(async () => {
		await server?.stop();
	});

	test('dedupes eligible bests, returns ten, and keeps tied order stable by earlier Score id', async () => {
		const active = await createPlayer(server, 'BoardBadger');
		const earlierTie = insertScore(server, active.playerId, 'BoardBadger', {
			exerciseId: 22,
			netWpm: 80
		});
		insertScore(server, active.playerId, 'BoardBadger', { exerciseId: 22, netWpm: 70 });

		for (let index = 0; index < 11; index += 1) {
			const nickname = `Ranked${index}`;
			const player = await createPlayer(server, nickname);
			insertScore(server, player.playerId, nickname, {
				exerciseId: 22,
				netWpm: index === 0 ? 80 : 79 - index
			});
		}

		const first = await readBoard(server, active.cookie, 22);
		const second = await readBoard(server, active.cookie, 22);
		expect(first).toEqual(second);
		expect(first.rows).toHaveLength(10);
		expect(first.distinctRankedPlayers).toBe(12);
		expect(first.rows.slice(0, 2).map((row) => row.scoreId)).toEqual([
			earlierTie,
			expect.any(Number)
		]);
		expect(first.rows[0].nickname).toBe('BoardBadger');
		expect(first.rows[1].nickname).toBe('Ranked0');
	});

	test('appends the active Player outside the top ten with their true rank and best Score', async () => {
		const active = await createPlayer(server, 'OutsideOwl');
		const bestId = insertScore(server, active.playerId, 'OutsideOwl', {
			exerciseId: 22,
			netWpm: 10
		});
		insertScore(server, active.playerId, 'OutsideOwl', { exerciseId: 22, netWpm: 5 });

		const board = await readBoard(server, active.cookie, 22);
		expect(board.rows).toHaveLength(10);
		expect(board.personal).toEqual({
			rank: 13,
			status: 'ranked',
			scoreId: bestId,
			nickname: 'OutsideOwl',
			netWpm: 10,
			accuracy: 1
		});
	});

	test('suppresses sparse rows but preserves the personal panel and marks an ineligible Score without a reason', async () => {
		const active = await createPlayer(server, 'SoloSeal');
		const scoreId = insertScore(server, active.playerId, 'SoloSeal', {
			exerciseId: 1,
			netWpm: 90,
			eligible: false
		});

		const board = await readBoard(server, active.cookie, 1);
		expect(board).toMatchObject({
			suppressed: true,
			distinctRankedPlayers: 0,
			rows: [],
			personal: {
				rank: null,
				status: 'not-ranked',
				scoreId,
				nickname: 'SoloSeal',
				netWpm: 90
			}
		});
		expect(JSON.stringify(board.personal)).not.toMatch(/reason|ceiling|eligible/i);
	});

	test('shows the actual personal best as not ranked when it is higher but ineligible', async () => {
		const active = await createPlayer(server, 'FlaggedFox');
		insertScore(server, active.playerId, 'FlaggedFox', {
			exerciseId: 22,
			netWpm: 20
		});
		const flaggedBest = insertScore(server, active.playerId, 'FlaggedFox', {
			exerciseId: 22,
			netWpm: 40,
			eligible: false
		});

		const board = await readBoard(server, active.cookie, 22);
		expect(board.personal).toMatchObject({
			scoreId: flaggedBest,
			netWpm: 40,
			rank: null,
			status: 'not-ranked'
		});
	});

	test('marks personal best only on the Attempt that becomes the best', async () => {
		const active = await createPlayer(server, 'PersonalPuma');
		const first = await completeSpeedTest(server, active.cookie, 60_000);
		expect(first.leaderboard.personalBest).toBe(true);
		expect(first.leaderboard.personal.scoreId).toBe(first.score.id);

		const slower = await completeSpeedTest(server, active.cookie, 120_000);
		expect(slower.leaderboard.personalBest).toBe(false);
		expect(slower.leaderboard.personal.scoreId).toBe(first.score.id);
	});

	test('applies the accuracy predicate only to Learn boards', async () => {
		const active = await createPlayer(server, 'AccurateAlbatross', 'learn');
		const fastLowAccuracyLearn = insertScore(server, active.playerId, 'AccurateAlbatross', {
			exerciseId: 1,
			netWpm: 99,
			accuracy: 0.89
		});
		const clearingLearn = insertScore(server, active.playerId, 'AccurateAlbatross', {
			exerciseId: 1,
			netWpm: 20,
			accuracy: 0.9
		});
		const lowAccuracySpeed = insertScore(server, active.playerId, 'AccurateAlbatross', {
			exerciseId: 22,
			netWpm: 99,
			accuracy: 0.5
		});

		for (let index = 0; index < 2; index += 1) {
			const nickname = `LearnPeer${index}`;
			const peer = await createPlayer(server, nickname, 'learn');
			insertScore(server, peer.playerId, nickname, {
				exerciseId: 1,
				netWpm: 19 - index,
				accuracy: 0.95
			});
		}

		const learn = await readBoard(server, active.cookie, 1);
		expect(learn.rows.map((row) => row.scoreId)).toContain(clearingLearn);
		expect(learn.rows.map((row) => row.scoreId)).not.toContain(fastLowAccuracyLearn);
		expect(learn.personal.scoreId).toBe(clearingLearn);

		const speed = await readBoard(server, active.cookie, 22);
		expect(speed.personal.scoreId).toBe(lowAccuracySpeed);
		expect(speed.personal.status).toBe('ranked');
	});

	test('never uses a sub-threshold Score as a Learn personal row', async () => {
		const active = await createPlayer(server, 'OverrideOnlyOrca', 'learn');
		insertScore(server, active.playerId, 'OverrideOnlyOrca', {
			exerciseId: 1,
			netWpm: 80,
			accuracy: 0.89
		});

		const board = await readBoard(server, active.cookie, 1);
		expect(board.personal).toBeNull();
	});
});
