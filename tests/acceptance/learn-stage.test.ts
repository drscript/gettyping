import Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { startTestServer, type TestServer } from './server';

interface StartedLearnAttempt {
	token: string;
	exercise: { id: number; stageId: number; content: string };
	stage: { id: number; name: string; keysTaught: string[]; requiredAccuracy: number };
}

interface KeystrokeEvent {
	expected: string;
	received: string;
	timestampOffsetMs: number;
}

async function createLearnPlayer(server: TestServer, nickname: string): Promise<string> {
	const response = await fetch(`${server.baseUrl}/nickname?/create`, {
		method: 'POST',
		headers: {
			accept: 'text/html',
			'content-type': 'application/x-www-form-urlencoded',
			origin: server.baseUrl
		},
		body: new URLSearchParams({ track: 'learn', source: 'typed', nickname }),
		redirect: 'manual'
	});

	expect(response.status).toBe(303);
	return response.headers.get('set-cookie')!.split(';', 1)[0];
}

function eventsWithErrors(content: string, errorCount: number): KeystrokeEvent[] {
	return [...content].map((character, index) => ({
		expected: character,
		received:
			index < errorCount ? (character === 'f' ? 'j' : character === 'j' ? 'f' : 'f') : character,
		timestampOffsetMs: Math.round(((index + 1) / content.length) * 60_000)
	}));
}

function eventsWithCorrectedError(content: string): KeystrokeEvent[] {
	const characters = [...content];
	const wrongFirstCharacter = characters[0] === 'f' ? 'j' : 'f';
	const events: KeystrokeEvent[] = [
		{ expected: characters[0], received: wrongFirstCharacter, timestampOffsetMs: 1 },
		{ expected: characters[0], received: 'Backspace', timestampOffsetMs: 2 }
	];
	characters.forEach((character, index) => {
		events.push({
			expected: character,
			received: character,
			timestampOffsetMs: Math.round(((index + 1) / characters.length) * 60_000) + 2
		});
	});
	return events;
}

async function startStage(
	server: TestServer,
	cookie: string,
	stageId = 1
): Promise<StartedLearnAttempt> {
	const response = await fetch(`${server.baseUrl}/api/attempts/learn/${stageId}`, {
		headers: { cookie }
	});
	expect(response.status).toBe(200);
	return (await response.json()) as StartedLearnAttempt;
}

async function submitStage(
	server: TestServer,
	cookie: string,
	started: StartedLearnAttempt,
	errorCount: number,
	stageId = 1
): Promise<Record<string, unknown>> {
	const response = await fetch(`${server.baseUrl}/api/attempts/learn/${stageId}`, {
		method: 'POST',
		headers: { cookie, 'content-type': 'application/json' },
		body: JSON.stringify({
			token: started.token,
			events: eventsWithErrors(started.exercise.content, errorCount)
		})
	});
	expect(response.status).toBe(200);
	return (await response.json()) as Record<string, unknown>;
}

describe('Learn Stage gate', () => {
	let server: TestServer;

	beforeAll(async () => {
		server = await startTestServer({ NET_WPM_CEILING: '1' });
	});

	afterAll(async () => {
		await server?.stop();
	});

	test('serves Stage 1 fixed text using only F and J', async () => {
		const cookie = await createLearnPlayer(server, 'FirstFinch');
		const started = await startStage(server, cookie);

		expect(started).toEqual({
			token: expect.any(String),
			exercise: { id: 1, stageId: 1, content: expect.stringMatching(/^[fj ]{40,}$/) },
			stage: {
				id: 1,
				name: 'Home row: F & J',
				keysTaught: ['f', 'j'],
				requiredAccuracy: 0.9
			}
		});
	});

	test('90% accuracy clears the Stage and opens the next even when the Score is ineligible', async () => {
		const nickname = 'GateGull';
		const cookie = await createLearnPlayer(server, nickname);
		const setupDatabase = new Database(server.databasePath);
		setupDatabase
			.prepare("UPDATE exercises SET content = 'fff jjj ggg hhh' WHERE id = 2")
			.run();
		setupDatabase.close();
		const lockedStageResponse = await fetch(`${server.baseUrl}/api/attempts/learn/2`, {
			headers: { cookie }
		});
		expect(lockedStageResponse.status).toBe(403);
		const started = await startStage(server, cookie);
		expect(started.exercise.content).toHaveLength(100);

		const body = await submitStage(server, cookie, started, 10);

		expect(body).toMatchObject({
			score: {
				id: expect.any(Number),
				netWpm: expect.any(Number),
				grossWpm: 20,
				accuracy: 0.9,
				elapsedMs: 60_000,
				charCount: 100,
				errorCount: 10
			},
			result: {
				state: 'cleared',
				achievedAccuracy: 0.9,
				requiredAccuracy: 0.9,
				nextStageId: 2
			},
			leaderboard: {
				exerciseId: 1,
				suppressed: true,
				rows: [],
				personal: { status: 'not-ranked', accuracy: 0.9 }
			}
		});

		const database = new Database(server.databasePath, { readonly: true });
		const stored = database
			.prepare(
				`SELECT leaderboard_eligible AS eligible FROM scores
				 WHERE nickname = ? AND exercise_id = 1`
			)
			.get(nickname);
		const progressionColumns = database.prepare('PRAGMA table_info(players)').all();
		database.close();
		expect(stored).toEqual({ eligible: 0 });
		expect(progressionColumns).not.toEqual(
			expect.arrayContaining([expect.objectContaining({ name: expect.stringMatching(/stage|progress/) })])
		);
		const openedStageResponse = await fetch(`${server.baseUrl}/api/attempts/learn/2`, {
			headers: { cookie }
		});
		expect(openedStageResponse.status).toBe(200);
	});

	test('uses the same 90% threshold at Stage 21', async () => {
		const nickname = 'FinalFlamingo';
		const cookie = await createLearnPlayer(server, nickname);
		const database = new Database(server.databasePath);
		const player = database
			.prepare('SELECT id FROM players WHERE nickname = ?')
			.get(nickname) as { id: string };
		database
			.prepare('UPDATE exercises SET content = (SELECT content FROM exercises WHERE id = 1) WHERE id = 21')
			.run();
		database
			.prepare(
				`INSERT INTO scores
				 (player_id, exercise_id, nickname, net_wpm, gross_wpm, accuracy, elapsed_ms,
				  char_count, error_count, leaderboard_eligible, created_at)
				 VALUES (?, 20, ?, 10, 10, 0.9, 60000, 100, 10, 1, ?)`
			)
			.run(player.id, nickname, Date.now());
		database.close();

		const started = await startStage(server, cookie, 21);
		const body = await submitStage(server, cookie, started, 10, 21);

		expect(body).toMatchObject({
			score: expect.objectContaining({ accuracy: 0.9 }),
			result: {
				state: 'completed',
				achievedAccuracy: 0.9,
				requiredAccuracy: 0.9,
				nextStageId: null
			},
			leaderboard: { exerciseId: 21, personal: { accuracy: 0.9 } }
		});
	});

	test('a mistake corrected with Backspace still counts as an error', async () => {
		const cookie = await createLearnPlayer(server, 'CorrectingCrane');
		const started = await startStage(server, cookie);

		const response = await fetch(`${server.baseUrl}/api/attempts/learn/1`, {
			method: 'POST',
			headers: { cookie, 'content-type': 'application/json' },
			body: JSON.stringify({
				token: started.token,
				events: eventsWithCorrectedError(started.exercise.content)
			})
		});
		expect(response.status).toBe(200);
		const body = (await response.json()) as Record<string, unknown>;

		expect(body).toMatchObject({ score: { errorCount: 1 } });
	});

	test('89% enters the same quiet failure state on every retry and records every Score', async () => {
		const nickname = 'RetryRobin';
		const cookie = await createLearnPlayer(server, nickname);
		const firstAttempt = await startStage(server, cookie);
		const firstText = firstAttempt.exercise.content;
		const firstBody = await submitStage(server, cookie, firstAttempt, 11);

		expect(firstBody).toEqual({
			score: expect.objectContaining({ accuracy: 0.89 }),
			result: {
				state: 'failed',
				achievedAccuracy: 0.89,
				requiredAccuracy: 0.9,
				nextStageId: null,
				adultHelpAvailable: false
			}
		});
		expect(firstBody).not.toHaveProperty('leaderboard');

		let fifthBody = firstBody;
		for (let failureNumber = 2; failureNumber <= 5; failureNumber += 1) {
			const retry = await startStage(server, cookie);
			expect(retry.exercise.content).toBe(firstText);
			fifthBody = await submitStage(server, cookie, retry, 11);
		}

		expect(fifthBody.result).toEqual({
			state: 'failed',
			achievedAccuracy: 0.89,
			requiredAccuracy: 0.9,
			nextStageId: null,
			adultHelpAvailable: true
		});
		const database = new Database(server.databasePath, { readonly: true });
		const scoreCount = database
			.prepare('SELECT COUNT(*) AS count FROM scores WHERE nickname = ? AND exercise_id = 1')
			.get(nickname);
		database.close();
		expect(scoreCount).toEqual({ count: 5 });
	});
});
