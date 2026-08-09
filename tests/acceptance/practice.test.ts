import Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { startTestServer, type TestServer } from './server';

interface StartedPracticeAttempt {
	token: string;
	exercise: { content: string; mode: 'word-bank' | 'bigram' };
}

interface KeystrokeEvent {
	expected: string;
	received: string;
	timestampOffsetMs: number;
}

async function createPlayer(server: TestServer, nickname: string): Promise<string> {
	const response = await fetch(`${server.baseUrl}/nickname?/create`, {
		method: 'POST',
		headers: {
			accept: 'text/html',
			'content-type': 'application/x-www-form-urlencoded',
			origin: server.baseUrl
		},
		body: new URLSearchParams({
			track: 'speed-test-practice',
			source: 'typed',
			nickname
		}),
		redirect: 'manual'
	});

	expect(response.status).toBe(303);
	return response.headers.get('set-cookie')!.split(';', 1)[0];
}

function completeSpeedTest(databasePath: string, nickname: string): void {
	const database = new Database(databasePath);
	const player = database
		.prepare('SELECT id FROM players WHERE nickname = ?')
		.get(nickname) as { id: string };
	database
		.prepare(
			`INSERT INTO scores
			 (player_id, exercise_id, nickname, net_wpm, gross_wpm, accuracy, elapsed_ms,
			  char_count, error_count, leaderboard_eligible, created_at)
			 VALUES (?, 22, ?, 20, 20, 1, 60000, 100, 0, 1, ?)`
		)
		.run(player.id, nickname, Date.now());
	database.close();
}

function perfectEvents(content: string): KeystrokeEvent[] {
	return [...content].map((character, index) => ({
		expected: character,
		received: character,
		timestampOffsetMs: Math.round(((index + 1) / content.length) * 60_000)
	}));
}

describe('Practice', () => {
	let server: TestServer;

	beforeAll(async () => {
		server = await startTestServer({
			RANDOM_SEED: 'practice-contract',
			TARGETING_AGGRESSIVENESS: '1'
		});
	});

	afterAll(async () => {
		await server?.stop();
	});

	test('serves readable generated text from a server-side handshake without creating an Exercise', async () => {
		const cookie = await createPlayer(server, 'PracticePika');
		completeSpeedTest(server.databasePath, 'PracticePika');
		const databaseBefore = new Database(server.databasePath, { readonly: true });
		const exerciseCountBefore = databaseBefore
			.prepare('SELECT COUNT(*) AS count FROM exercises')
			.get() as { count: number };
		databaseBefore.close();

		const response = await fetch(`${server.baseUrl}/api/attempts/practice?mode=word-bank`, {
			headers: { cookie }
		});
		const started = (await response.json()) as StartedPracticeAttempt;

		expect(response.status).toBe(200);
		expect(started.exercise.mode).toBe('word-bank');
		expect(started.exercise.content).toMatch(/^[a-z]+(?: [a-z]+){7,}$/);

		const database = new Database(server.databasePath, { readonly: true });
		const handshake = database
			.prepare(
				`SELECT exercise_id AS exerciseId, generated_content AS generatedContent
				 FROM attempt_tokens WHERE id = ?`
			)
			.get(started.token);
		const exerciseCountAfter = database
			.prepare('SELECT COUNT(*) AS count FROM exercises')
			.get();
		database.close();

		expect(handshake).toEqual({ exerciseId: null, generatedContent: started.exercise.content });
		expect(exerciseCountAfter).toEqual(exerciseCountBefore);
	});

	test('submits generated text through the shared Attempt path and updates the Profile', async () => {
		const nickname = 'LoopingLynx';
		const cookie = await createPlayer(server, nickname);
		completeSpeedTest(server.databasePath, nickname);
		const startedResponse = await fetch(`${server.baseUrl}/api/attempts/practice?mode=bigram`, {
			headers: { cookie }
		});
		const started = (await startedResponse.json()) as StartedPracticeAttempt;

		const response = await fetch(`${server.baseUrl}/api/attempts/practice`, {
			method: 'POST',
			headers: { cookie, 'content-type': 'application/json' },
			body: JSON.stringify({
				token: started.token,
				events: perfectEvents(started.exercise.content)
			})
		});

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			score: {
				id: expect.any(Number),
				netWpm: expect.any(Number),
				grossWpm: expect.any(Number),
				accuracy: 1,
				elapsedMs: 60_000,
				charCount: started.exercise.content.length,
				errorCount: 0
			}
		});

		const database = new Database(server.databasePath, { readonly: true });
		const score = database
			.prepare('SELECT exercise_id AS exerciseId FROM scores WHERE nickname = ? ORDER BY id DESC')
			.get(nickname);
		const profileCount = database
			.prepare(
				`SELECT COUNT(*) AS count FROM weak_key_stats profile
				 JOIN players player ON player.id = profile.player_id
				 WHERE player.nickname = ?`
			)
			.get(nickname) as { count: number };
		database.close();

		expect(score).toEqual({ exerciseId: null });
		expect(profileCount.count).toBeGreaterThan(0);
	});

	test('targets the weakest key reproducibly under a seeded RNG', async () => {
		const nickname = 'QuietQuokka';
		const cookie = await createPlayer(server, nickname);
		completeSpeedTest(server.databasePath, nickname);
		const database = new Database(server.databasePath);
		const player = database
			.prepare('SELECT id FROM players WHERE nickname = ?')
			.get(nickname) as { id: string };
		database
			.prepare(
				`INSERT INTO weak_key_stats (player_id, key, attempts, errors, total_latency_ms)
				 VALUES (?, 'q', 5, 5, 5000), (?, 'z', 5, 1, 1000)`
			)
			.run(player.id, player.id);
		database.close();

		await server.restart();
		const firstResponse = await fetch(`${server.baseUrl}/api/attempts/practice?mode=word-bank`, {
			headers: { cookie }
		});
		const first = (await firstResponse.json()) as StartedPracticeAttempt;
		await server.restart();
		const secondResponse = await fetch(`${server.baseUrl}/api/attempts/practice?mode=word-bank`, {
			headers: { cookie }
		});
		const second = (await secondResponse.json()) as StartedPracticeAttempt;

		expect(first.exercise.content).toBe(second.exercise.content);
		expect(first.exercise.content.split(' ').every((word) => word.includes('q'))).toBe(true);
	});
});

describe('Practice targeting configuration', () => {
	test('the aggressiveness knob changes how densely the weak key appears', async () => {
		const servers = await Promise.all([
			startTestServer({ RANDOM_SEED: 'density', TARGETING_AGGRESSIVENESS: '0' }),
			startTestServer({ RANDOM_SEED: 'density', TARGETING_AGGRESSIVENESS: '1' })
		]);
		try {
			const contents: string[] = [];
			for (const [index, configuredServer] of servers.entries()) {
				const nickname = `DensityDuck${index}`;
				const cookie = await createPlayer(configuredServer, nickname);
				completeSpeedTest(configuredServer.databasePath, nickname);
				const database = new Database(configuredServer.databasePath);
				const player = database
					.prepare('SELECT id FROM players WHERE nickname = ?')
					.get(nickname) as { id: string };
				database
					.prepare(
						`INSERT INTO weak_key_stats (player_id, key, attempts, errors, total_latency_ms)
						 VALUES (?, 'q', 5, 5, 5000)`
					)
					.run(player.id);
				database.close();
				const response = await fetch(`${configuredServer.baseUrl}/api/attempts/practice`, {
					headers: { cookie }
				});
				contents.push(((await response.json()) as StartedPracticeAttempt).exercise.content);
			}

			const qCounts = contents.map(
				(content) => [...content].filter((character) => character === 'q').length
			);
			expect(qCounts[1]).toBeGreaterThan(qCounts[0]);
		} finally {
			await Promise.all(servers.map((configuredServer) => configuredServer.stop()));
		}
	});
});
