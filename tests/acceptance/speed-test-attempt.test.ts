import Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { startTestServer, type TestServer } from './server';

interface StartedAttempt {
	token: string;
	exercise: {
		id: number;
		content: string;
	};
}

interface KeystrokeEvent {
	expected: string;
	received: string;
	timestampOffsetMs: number;
}

function perfectEvents(content: string, elapsedMs = 60_000): KeystrokeEvent[] {
	return [...content].map((character, index) => ({
		expected: character,
		received: character,
		timestampOffsetMs: Math.round(((index + 1) / content.length) * elapsedMs)
	}));
}

async function createSpeedTestPlayer(server: TestServer, nickname: string): Promise<string> {
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
	const cookie = response.headers.get('set-cookie');
	expect(cookie).toBeTruthy();
	return cookie!.split(';', 1)[0];
}

async function startAttempt(server: TestServer, cookie: string): Promise<StartedAttempt> {
	const response = await fetch(`${server.baseUrl}/api/attempts/speed-test`, {
		headers: { cookie }
	});
	expect(response.status).toBe(200);
	return (await response.json()) as StartedAttempt;
}

async function submitAttempt(
	server: TestServer,
	cookie: string,
	token: string | undefined,
	events: KeystrokeEvent[]
): Promise<Response> {
	return fetch(`${server.baseUrl}/api/attempts/speed-test`, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			cookie
		},
		body: JSON.stringify({ ...(token === undefined ? {} : { token }), events })
	});
}

function scoreCount(databasePath: string, nickname: string): number {
	const database = new Database(databasePath, { readonly: true });
	const row = database
		.prepare('SELECT COUNT(*) AS count FROM scores WHERE nickname = ?')
		.get(nickname) as { count: number };
	database.close();
	return row.count;
}

function setHandshakeAge(databasePath: string, token: string, ageMs: number): void {
	const database = new Database(databasePath);
	database
		.prepare('UPDATE attempt_tokens SET served_at = ? WHERE id = ?')
		.run(Date.now() - ageMs, token);
	database.close();
}

function scoreEligibility(databasePath: string, nickname: string): number | undefined {
	const database = new Database(databasePath, { readonly: true });
	const row = database
		.prepare('SELECT leaderboard_eligible AS leaderboardEligible FROM scores WHERE nickname = ?')
		.get(nickname) as { leaderboardEligible: number } | undefined;
	database.close();
	return row?.leaderboardEligible;
}

describe('Speed Test Attempt', () => {
	let server: TestServer;

	beforeAll(async () => {
		server = await startTestServer({ EVENT_COUNT_CEILING: '150', NET_WPM_CEILING: '30' });
	});

	afterAll(async () => {
		await server?.stop();
	});

	test('starting records a persistent server-side handshake for the Player and Exercise', async () => {
		const cookie = await createSpeedTestPlayer(server, 'SwiftOtter');
		const beforeRequest = Date.now();
		const response = await fetch(`${server.baseUrl}/api/attempts/speed-test`, {
			headers: { cookie }
		});
		const afterRequest = Date.now();
		const body = (await response.json()) as StartedAttempt;

		expect(response.status).toBe(200);
		expect(body).toEqual({
			token: expect.any(String),
			exercise: {
				id: 22,
				content: expect.stringMatching(/\S.{40,}/)
			}
		});

		const database = new Database(server.databasePath, { readonly: true });
		const handshake = database
			.prepare(
				`SELECT token.id, token.player_id AS playerId, token.exercise_id AS exerciseId,
					token.served_at AS servedAt, player.nickname
				 FROM attempt_tokens token
				 JOIN players player ON player.id = token.player_id
				 WHERE token.id = ?`
			)
			.get(body.token) as {
			id: string;
			playerId: string;
			exerciseId: number;
			servedAt: number;
			nickname: string;
		};
		database.close();

		expect(handshake).toEqual({
			id: body.token,
			playerId: expect.any(String),
			exerciseId: 22,
			servedAt: expect.any(Number),
			nickname: 'SwiftOtter'
		});
		expect(handshake.servedAt).toBeGreaterThanOrEqual(beforeRequest);
		expect(handshake.servedAt).toBeLessThanOrEqual(afterRequest);
	});

	test('derives a completed Score from raw events and never trusts submitted aggregates', async () => {
		const cookie = await createSpeedTestPlayer(server, 'CalmFalcon');
		const startResponse = await fetch(`${server.baseUrl}/api/attempts/speed-test`, {
			headers: { cookie }
		});
		const started = (await startResponse.json()) as StartedAttempt;

		const response = await fetch(`${server.baseUrl}/api/attempts/speed-test`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				cookie
			},
			body: JSON.stringify({
				token: started.token,
				events: perfectEvents(started.exercise.content),
				netWpm: 999,
				accuracy: 0
			})
		});

		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			score: {
				id: expect.any(Number),
				netWpm: 28.4,
				grossWpm: 28.4,
				accuracy: 1,
				elapsedMs: 60_000,
				charCount: 142,
				errorCount: 0
			}
		});

		const database = new Database(server.databasePath, { readonly: true });
		const score = database
			.prepare(
				`SELECT score.player_id AS playerId, score.exercise_id AS exerciseId,
					score.nickname, score.net_wpm AS netWpm, score.gross_wpm AS grossWpm,
					score.accuracy, score.elapsed_ms AS elapsedMs, score.char_count AS charCount,
					score.error_count AS errorCount
				 FROM scores score
				 JOIN players player ON player.id = score.player_id
				 WHERE player.nickname = ?`
			)
			.get('CalmFalcon');
		const remainingToken = database
			.prepare('SELECT id FROM attempt_tokens WHERE id = ?')
			.get(started.token);
		const eventTable = database
			.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE '%event%'")
			.get();
		database.close();

		expect(score).toEqual({
			playerId: expect.any(String),
			exerciseId: 22,
			nickname: 'CalmFalcon',
			netWpm: 28.4,
			grossWpm: 28.4,
			accuracy: 1,
			elapsedMs: 60_000,
			charCount: 142,
			errorCount: 0
		});
		expect(remainingToken).toBeUndefined();
		expect(eventTable).toBeUndefined();
	});

	test('counts a corrected mistake in accuracy and as an error', async () => {
		const cookie = await createSpeedTestPlayer(server, 'BrightBadger');
		const startResponse = await fetch(`${server.baseUrl}/api/attempts/speed-test`, {
			headers: { cookie }
		});
		const started = (await startResponse.json()) as StartedAttempt;
		const events = [
			{ expected: 's', received: 'x', timestampOffsetMs: 100 },
			{ expected: 's', received: 'Backspace', timestampOffsetMs: 200 },
			...perfectEvents(started.exercise.content)
		];

		const response = await fetch(`${server.baseUrl}/api/attempts/speed-test`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				cookie
			},
			body: JSON.stringify({ token: started.token, events })
		});

		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			score: {
				id: expect.any(Number),
				netWpm: 27.6,
				grossWpm: 28.6,
				accuracy: 0.993006993006993,
				elapsedMs: 60_000,
				charCount: 143,
				errorCount: 1
			}
		});
	});

	test('persists a Score over the configured Net WPM ceiling in history with eligibility off', async () => {
		const cookie = await createSpeedTestPlayer(server, 'RapidRabbit');
		const started = await startAttempt(server, cookie);
		setHandshakeAge(server.databasePath, started.token, 120_000);

		const response = await submitAttempt(
			server,
			cookie,
			started.token,
			perfectEvents(started.exercise.content, 30_000)
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			score: {
				id: expect.any(Number),
				netWpm: 56.8,
				grossWpm: 56.8,
				accuracy: 1,
				elapsedMs: 30_000,
				charCount: 142,
				errorCount: 0
			}
		});
		expect(scoreCount(server.databasePath, 'RapidRabbit')).toBe(1);
		expect(scoreEligibility(server.databasePath, 'RapidRabbit')).toBe(0);
	});

	test('persists a wall-clock-inconsistent Score with the same ordinary success shape', async () => {
		const plausibleCookie = await createSpeedTestPlayer(server, 'PatientPanda');
		const plausible = await startAttempt(server, plausibleCookie);
		setHandshakeAge(server.databasePath, plausible.token, 61_000);
		const plausibleResponse = await submitAttempt(
			server,
			plausibleCookie,
			plausible.token,
			perfectEvents(plausible.exercise.content)
		);

		const implausibleCookie = await createSpeedTestPlayer(server, 'HastyHeron');
		const implausible = await startAttempt(server, implausibleCookie);
		const implausibleResponse = await submitAttempt(
			server,
			implausibleCookie,
			implausible.token,
			perfectEvents(implausible.exercise.content)
		);

		expect(plausibleResponse.status).toBe(200);
		expect(implausibleResponse.status).toBe(200);
		const plausibleBody = (await plausibleResponse.json()) as { score: Record<string, unknown> };
		const implausibleBody = (await implausibleResponse.json()) as {
			score: Record<string, unknown>;
		};
		expect({ ...implausibleBody.score, id: undefined }).toEqual({
			...plausibleBody.score,
			id: undefined
		});
		expect(Object.keys(implausibleBody.score).sort()).toEqual(Object.keys(plausibleBody.score).sort());
		expect(scoreEligibility(server.databasePath, 'PatientPanda')).toBe(1);
		expect(scoreEligibility(server.databasePath, 'HastyHeron')).toBe(0);
	});

	test('rejects structurally invalid streams without persisting a Score', async () => {
		const cases: Array<{
			nickname: string;
			buildEvents: (content: string) => KeystrokeEvent[];
		}> = [
			{
				nickname: 'TimeTurner',
				buildEvents: (content) => {
					const events = perfectEvents(content);
					events[1].timestampOffsetMs = events[0].timestampOffsetMs - 1;
					return events;
				}
			},
			{
				nickname: 'SpanSeeker',
				buildEvents: (content) => {
					const events = perfectEvents(content);
					events[0].timestampOffsetMs = -1;
					return events;
				}
			},
			{
				nickname: 'EventFlood',
				buildEvents: (content) => [
					...Array.from({ length: 5 }, (_, index) => [
						{ expected: content[0], received: 'x', timestampOffsetMs: index * 20 + 10 },
						{ expected: content[0], received: 'Backspace', timestampOffsetMs: index * 20 + 20 }
					]).flat(),
					...perfectEvents(content)
				]
			},
			{
				nickname: 'HalfPrompt',
				buildEvents: (content) => perfectEvents(content.slice(0, -1))
			}
		];

		for (const invalidCase of cases) {
			const cookie = await createSpeedTestPlayer(server, invalidCase.nickname);
			const started = await startAttempt(server, cookie);
			const before = scoreCount(server.databasePath, invalidCase.nickname);
			const response = await submitAttempt(
				server,
				cookie,
				started.token,
				invalidCase.buildEvents(started.exercise.content)
			);

			expect(response.status, invalidCase.nickname).toBe(400);
			expect(await response.json()).toEqual({
				message: 'This Attempt could not be submitted.'
			});
			expect(scoreCount(server.databasePath, invalidCase.nickname)).toBe(before);
		}
	});

	test('rejects missing, expired, consumed, and foreign handshakes without an extra Score', async () => {
		const missingNickname = 'MissingMole';
		const missingCookie = await createSpeedTestPlayer(server, missingNickname);
		const missingResponse = await submitAttempt(server, missingCookie, undefined, []);
		expect(missingResponse.status).toBe(400);
		expect(scoreCount(server.databasePath, missingNickname)).toBe(0);

		const expiredNickname = 'LateLynx';
		const expiredCookie = await createSpeedTestPlayer(server, expiredNickname);
		const expired = await startAttempt(server, expiredCookie);
		const writableDatabase = new Database(server.databasePath);
		writableDatabase
			.prepare('UPDATE attempt_tokens SET served_at = ? WHERE id = ?')
			.run(Date.now() - 30 * 60 * 1000 - 1, expired.token);
		writableDatabase.close();
		const expiredResponse = await submitAttempt(
			server,
			expiredCookie,
			expired.token,
			perfectEvents(expired.exercise.content)
		);
		expect(expiredResponse.status).toBe(400);
		expect(scoreCount(server.databasePath, expiredNickname)).toBe(0);

		const ownerCookie = await createSpeedTestPlayer(server, 'TokenOwner');
		const intruderCookie = await createSpeedTestPlayer(server, 'TokenGuest');
		const foreign = await startAttempt(server, ownerCookie);
		const foreignResponse = await submitAttempt(
			server,
			intruderCookie,
			foreign.token,
			perfectEvents(foreign.exercise.content)
		);
		expect(foreignResponse.status).toBe(400);
		expect(scoreCount(server.databasePath, 'TokenOwner')).toBe(0);
		expect(scoreCount(server.databasePath, 'TokenGuest')).toBe(0);

		const consumedNickname = 'OneShotOwl';
		const consumedCookie = await createSpeedTestPlayer(server, consumedNickname);
		const consumed = await startAttempt(server, consumedCookie);
		const events = perfectEvents(consumed.exercise.content);
		const firstResponse = await submitAttempt(server, consumedCookie, consumed.token, events);
		expect(firstResponse.status).toBe(200);
		const consumedResponse = await submitAttempt(server, consumedCookie, consumed.token, events);
		expect(consumedResponse.status).toBe(400);
		expect(scoreCount(server.databasePath, consumedNickname)).toBe(1);
	});

	test('keeps an in-flight handshake across restart and sweeps abandoned handshakes', async () => {
		const cookie = await createSpeedTestPlayer(server, 'SteadyStoat');
		const started = await startAttempt(server, cookie);

		await server.restart();

		const response = await submitAttempt(
			server,
			cookie,
			started.token,
			perfectEvents(started.exercise.content)
		);
		expect(response.status).toBe(200);
		expect(scoreCount(server.databasePath, 'SteadyStoat')).toBe(1);

		const abandoned = await startAttempt(server, cookie);
		const writableDatabase = new Database(server.databasePath);
		writableDatabase
			.prepare('UPDATE attempt_tokens SET served_at = ? WHERE id = ?')
			.run(Date.now() - 30 * 60 * 1000 - 1, abandoned.token);
		writableDatabase.close();

		await startAttempt(server, cookie);

		const database = new Database(server.databasePath, { readonly: true });
		const expiredToken = database
			.prepare('SELECT id FROM attempt_tokens WHERE id = ?')
			.get(abandoned.token);
		database.close();
		expect(expiredToken).toBeUndefined();
	});

	test('recycles the oldest handshake when a Player reaches the outstanding cap', async () => {
		const cookie = await createSpeedTestPlayer(server, 'ReadyRaven');
		const attempts = [];
		for (let index = 0; index < 4; index += 1) {
			attempts.push(await startAttempt(server, cookie));
		}

		const database = new Database(server.databasePath, { readonly: true });
		const outstanding = database
			.prepare(
				`SELECT token.id
				 FROM attempt_tokens token
				 JOIN players player ON player.id = token.player_id
				 WHERE player.nickname = ?
				 ORDER BY token.served_at, token.id`
			)
			.all('ReadyRaven') as Array<{ id: string }>;
		database.close();

		const outstandingIds = outstanding.map(({ id }) => id);
		expect(outstandingIds).toHaveLength(3);
		expect(outstandingIds).toContain(attempts[3].token);
		expect(attempts.slice(0, 3).filter(({ token }) => outstandingIds.includes(token))).toHaveLength(2);
	});
});
