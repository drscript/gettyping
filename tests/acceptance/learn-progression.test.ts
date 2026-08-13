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
		received: index < errorCount ? (character === 'f' ? 'j' : 'f') : character,
		timestampOffsetMs: Math.round(((index + 1) / content.length) * 60_000)
	}));
}

async function startStage(
	server: TestServer,
	cookie: string,
	stageId: number
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
	errorCount: number
): Promise<{
	result: Record<string, unknown>;
	leaderboard?: Record<string, unknown>;
}> {
	const response = await fetch(
		`${server.baseUrl}/api/attempts/learn/${started.exercise.stageId}`,
		{
			method: 'POST',
			headers: { cookie, 'content-type': 'application/json' },
			body: JSON.stringify({
				token: started.token,
				events: eventsWithErrors(started.exercise.content, errorCount)
			})
		}
	);
	expect(response.status).toBe(200);
	return (await response.json()) as {
		result: Record<string, unknown>;
		leaderboard?: Record<string, unknown>;
	};
}

async function resolveStage(
	server: TestServer,
	cookie: string,
	stageId: number
): Promise<Response> {
	return fetch(`${server.baseUrl}/grown-ups?/resolve-stage`, {
		method: 'POST',
		headers: {
			accept: 'text/html',
			'content-type': 'application/x-www-form-urlencoded',
			cookie,
			origin: server.baseUrl
		},
		body: new URLSearchParams({ stageId: String(stageId) }),
		redirect: 'manual'
	});
}

describe('Learn progression, replay, completion, and authored content', () => {
	let server: TestServer;

	beforeAll(async () => {
		server = await startTestServer({
			CONSECUTIVE_FAILURE_COUNT: '2',
			STRETCH_OFFER_COUNT: '1',
			LEADERBOARD_DISPLAY_THRESHOLD: '1',
			NET_WPM_CEILING: '100'
		});
	});

	afterAll(async () => {
		await server?.stop();
	});

	test('offers quiet adult help only at the configured consecutive-failure count', async () => {
		const cookie = await createLearnPlayer(server, 'PatientPuffin');
		const first = await startStage(server, cookie, 1);
		const firstResult = await submitStage(server, cookie, first, 11);
		expect(firstResult.result).toMatchObject({
			state: 'failed',
			adultHelpAvailable: false,
			requiredAccuracy: 0.9
		});

		const second = await startStage(server, cookie, 1);
		const secondResult = await submitStage(server, cookie, second, 11);
		expect(secondResult.result).toMatchObject({
			state: 'failed',
			adultHelpAvailable: true,
			requiredAccuracy: 0.9
		});
		expect(JSON.stringify(secondResult)).not.toMatch(/skip/i);
	});

	test('an adult resolves the current Stage without a qualifying Score and opens the next', async () => {
		const nickname = 'GuidedGannet';
		const cookie = await createLearnPlayer(server, nickname);
		const response = await resolveStage(server, cookie, 1);
		expect(response.status).toBe(303);
		expect(response.headers.get('location')).toBe('/');

		const stageTwo = await fetch(`${server.baseUrl}/api/attempts/learn/2`, {
			headers: { cookie }
		});
		expect(stageTwo.status).toBe(200);

		const database = new Database(server.databasePath, { readonly: true });
		const rows = database
			.prepare(
				`SELECT unlock.stage_id AS stageId, COUNT(score.id) AS qualifyingScores
				 FROM stage_unlocks unlock
				 LEFT JOIN scores score ON score.player_id = unlock.player_id AND score.accuracy >= 0.9
				 JOIN players player ON player.id = unlock.player_id
				 WHERE player.nickname = ?
				 GROUP BY unlock.stage_id`
			)
			.all(nickname);
		database.close();
		expect(rows).toEqual([{ stageId: 1, qualifyingScores: 0 }]);
	});

	test('shows all Stage states, allows replay, and never moves progression backwards', async () => {
		const nickname = 'ReplayRook';
		const cookie = await createLearnPlayer(server, nickname);
		const first = await startStage(server, cookie, 1);
		const clear = await submitStage(server, cookie, first, 0);
		expect(clear.result).toMatchObject({ state: 'cleared', nextStageId: 2 });

		const home = await fetch(server.baseUrl, { headers: { cookie } });
		const html = await home.text();
		expect(html.match(/data-stage-state=/g)).toHaveLength(21);
		expect(html).toContain('data-stage-state="cleared"');
		expect(html).toContain('data-stage-state="current"');
		expect(html).toContain('data-stage-state="locked"');

		const replay = await startStage(server, cookie, 1);
		const replayResult = await submitStage(server, cookie, replay, 11);
		expect(replayResult.result).toMatchObject({ state: 'cleared', nextStageId: 2 });
		expect(replayResult.leaderboard).toMatchObject({
			exerciseId: 1,
			personal: { accuracy: 1 }
		});

		const nextStage = await fetch(`${server.baseUrl}/api/attempts/learn/2`, {
			headers: { cookie }
		});
		expect(nextStage.status).toBe(200);

		const database = new Database(server.databasePath, { readonly: true });
		const scores = database
			.prepare(
				`SELECT accuracy FROM scores
				 JOIN players ON players.id = scores.player_id
				 WHERE players.nickname = ? AND exercise_id = 1 ORDER BY scores.id`
			)
			.all(nickname) as Array<{ accuracy: number }>;
		database.close();
		expect(scores).toEqual([{ accuracy: 1 }, { accuracy: 0.89 }]);
	});

	test('adult override on Stage 21 completes Learn and graduates the home continue action', async () => {
		const cookie = await createLearnPlayer(server, 'GraduateGull');
		for (let stageId = 1; stageId < 21; stageId += 1) {
			const response = await resolveStage(server, cookie, stageId);
			expect(response.status).toBe(303);
		}

		const finalResponse = await resolveStage(server, cookie, 21);
		expect(finalResponse.status).toBe(303);
		expect(finalResponse.headers.get('location')).toBe('/learn/complete');

		const completion = await fetch(`${server.baseUrl}/learn/complete`, { headers: { cookie } });
		expect(completion.status).toBe(200);
		expect(await completion.text()).toContain('Speed Test');

		const home = await fetch(server.baseUrl, { headers: { cookie } });
		const html = await home.text();
		expect(html.match(/data-stage-state="cleared"/g)).toHaveLength(21);
		expect(html).toContain('href="/speed-test"');
	});

	test('serves fixed cumulative text using only taught keys across all 21 Stages', async () => {
		const cookie = await createLearnPlayer(server, 'CurriculumCrane');
		const inheritedKeys = new Set<string>([' ']);

		for (let stageId = 1; stageId <= 21; stageId += 1) {
			const started = await startStage(server, cookie, stageId);
			const previousKeys = new Set(inheritedKeys);
			const newKeys = started.stage.keysTaught.map((key) => (key === "''" ? "'" : key));
			const usesShift = newKeys.includes('shift');
			for (const key of newKeys) if (key !== 'shift') inheritedKeys.add(key);

			for (const character of started.exercise.content) {
				const normalized = character.toLowerCase();
				expect(
					inheritedKeys.has(normalized),
					`Stage ${stageId} contains untaught character ${JSON.stringify(character)}`
				).toBe(true);
			}

			const newKeyUses = [...started.exercise.content].filter((character) =>
				usesShift
					? character !== character.toLowerCase()
					: newKeys.includes(character.toLowerCase())
			).length;
			const inheritedUses = [...started.exercise.content].filter(
				(character) =>
					character !== ' ' &&
					!newKeys.includes(character.toLowerCase()) &&
					character === character.toLowerCase()
			).length;
			for (const inheritedKey of previousKeys) {
				if (inheritedKey !== ' ') {
					expect(started.exercise.content.toLowerCase()).toContain(inheritedKey);
				}
			}
			const newKeyWeight = newKeyUses / (usesShift ? 1 : newKeys.length);
			const inheritedKeyCount = Math.max(1, previousKeys.size - 1);
			expect(newKeyWeight, `Stage ${stageId} should emphasize its new keys`).toBeGreaterThan(
				inheritedUses / inheritedKeyCount
			);

			if (stageId < 21) {
				const response = await resolveStage(server, cookie, stageId);
				expect(response.status).toBe(303);
			}
		}
	});
});
