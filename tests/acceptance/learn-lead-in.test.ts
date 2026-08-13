import Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createPlayerCookie } from './player';
import { startTestServer, type TestServer } from './server';

interface StartedLeadIn {
	token: string;
	exercise: { content: string };
}

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

function playerIdFor(databasePath: string, nickname: string): string {
	const database = new Database(databasePath, { readonly: true });
	const player = database
		.prepare('SELECT id FROM players WHERE nickname = ?')
		.get(nickname) as { id: string };
	database.close();
	return player.id;
}

function unlockThrough(databasePath: string, playerId: string, lastResolvedStageId: number): void {
	const database = new Database(databasePath);
	const insert = database.prepare(
		'INSERT INTO stage_unlocks (player_id, stage_id, granted_at) VALUES (?, ?, ?)'
	);
	const now = Date.now();
	for (let stageId = 1; stageId <= lastResolvedStageId; stageId += 1) {
		insert.run(playerId, stageId, now);
	}
	database.close();
}

function floorKeys(
	databasePath: string,
	playerId: string,
	rows: Array<{ key: string; attempts: number; errors: number; totalLatencyMs: number }>
): void {
	const database = new Database(databasePath);
	const insert = database.prepare(
		`INSERT INTO weak_key_stats (player_id, key, attempts, errors, total_latency_ms)
		 VALUES (?, ?, ?, ?, ?)`
	);
	for (const row of rows) {
		insert.run(playerId, row.key, row.attempts, row.errors, row.totalLatencyMs);
	}
	database.close();
}

function derivedKeys(text: string): Set<string> {
	const keys = new Set<string>();
	for (const character of text) {
		if (character === ' ') continue;
		if (character >= 'A' && character <= 'Z') {
			keys.add(character.toLowerCase());
			keys.add('shift');
			continue;
		}
		keys.add(character);
	}
	return keys;
}

function correctEvents(content: string): KeystrokeEvent[] {
	return [...content].map((character, index) => ({
		expected: character,
		received: character,
		timestampOffsetMs: Math.round(((index + 1) / content.length) * 30_000)
	}));
}

function eventsWithErrors(content: string, errorCount: number): KeystrokeEvent[] {
	return [...content].map((character, index) => ({
		expected: character,
		received:
			index < errorCount ? (character === 'f' ? 'j' : character === 'j' ? 'f' : 'f') : character,
		timestampOffsetMs: Math.round(((index + 1) / content.length) * 60_000)
	}));
}

function failingErrorCount(content: string): number {
	return Math.max(1, Math.ceil(content.length * 0.11));
}

async function startLeadIn(
	server: TestServer,
	cookie: string,
	stageId: number
): Promise<StartedLeadIn> {
	const response = await fetch(`${server.baseUrl}/api/attempts/lead-in/${stageId}`, {
		headers: { cookie }
	});
	expect(response.status).toBe(200);
	return (await response.json()) as StartedLeadIn;
}

async function completeLeadIn(
	server: TestServer,
	cookie: string,
	stageId: number,
	started: StartedLeadIn
): Promise<Record<string, unknown>> {
	const response = await fetch(`${server.baseUrl}/api/attempts/lead-in/${stageId}`, {
		method: 'POST',
		headers: { cookie, 'content-type': 'application/json' },
		body: JSON.stringify({ token: started.token, events: correctEvents(started.exercise.content) })
	});
	expect(response.status).toBe(200);
	return (await response.json()) as Record<string, unknown>;
}

async function acknowledgeStageOne(server: TestServer, cookie: string): Promise<void> {
	const acknowledged = await fetch(`${server.baseUrl}/api/attempts/learn/1`, {
		method: 'POST',
		headers: { cookie, 'content-type': 'application/json' },
		body: JSON.stringify({ stageOneIntroSeen: true })
	});
	expect(acknowledged.status).toBe(204);
}

async function startStage(
	server: TestServer,
	cookie: string,
	stageId: number
): Promise<StartedLearnAttempt> {
	if (stageId === 1) await acknowledgeStageOne(server, cookie);
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
): Promise<Record<string, unknown>> {
	const response = await fetch(`${server.baseUrl}/api/attempts/learn/${started.exercise.stageId}`, {
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

function tokenCount(databasePath: string, playerId: string, exerciseIdNotNull: boolean): number {
	const database = new Database(databasePath, { readonly: true });
	const row = database
		.prepare(
			exerciseIdNotNull
				? 'SELECT COUNT(*) AS count FROM attempt_tokens WHERE player_id = ? AND exercise_id IS NOT NULL'
				: 'SELECT COUNT(*) AS count FROM attempt_tokens WHERE player_id = ? AND exercise_id IS NULL'
		)
		.get(playerId) as { count: number };
	database.close();
	return row.count;
}

describe('Learn Lead-in', () => {
	let server: TestServer;

	beforeAll(async () => {
		server = await startTestServer();
	});

	afterAll(async () => {
		await server?.stop();
	});

	test('Stage 5 landing does not mint the gated Exercise handshake, and offers a Lead-in', async () => {
		const nickname = 'LeadLanding';
		const cookie = await createPlayerCookie(server, nickname, { track: 'learn' });
		const playerId = playerIdFor(server.databasePath, nickname);
		unlockThrough(server.databasePath, playerId, 4);

		const page = await fetch(`${server.baseUrl}/learn/stages/5`, { headers: { cookie } });
		expect(page.status).toBe(200);
		const html = await page.text();
		expect(html).toContain('Try some words first');
		expect(html).toContain('Find A and ;');
		expect(tokenCount(server.databasePath, playerId, true)).toBe(0);

		const started = await startStage(server, cookie, 5);
		const database = new Database(server.databasePath, { readonly: true });
		const seeded = database
			.prepare("SELECT content FROM exercises WHERE stage_id = 5 AND track = 'learn'")
			.get() as { content: string };
		database.close();
		expect(started.exercise.content).toBe(seeded.content);
	});

	test('Stage 1 still auto-starts the Exercise with no Lead-in resource required', async () => {
		const nickname = 'LeadStageOne';
		const cookie = await createPlayerCookie(server, nickname, { track: 'learn' });
		const page = await fetch(`${server.baseUrl}/learn/stages/1`, { headers: { cookie } });
		const html = await page.text();
		expect(html).not.toContain('Try some words first');
		expect(html).not.toContain('Try these first');

		const started = await startStage(server, cookie, 1);
		expect(started.exercise.stageId).toBe(1);
		expect(started.exercise.content).toMatch(/^[fj ]+$/);
	});

	test('replaying a cleared Stage 1 still does not offer a Lead-in', async () => {
		const nickname = 'LeadReplayOne';
		const cookie = await createPlayerCookie(server, nickname, { track: 'learn' });
		const playerId = playerIdFor(server.databasePath, nickname);
		unlockThrough(server.databasePath, playerId, 1);

		const page = await fetch(`${server.baseUrl}/learn/stages/1`, { headers: { cookie } });
		const html = await page.text();
		expect(html).not.toContain('Try these first');
		expect(html).not.toContain('Try some words first');

		const started = await startStage(server, cookie, 1);
		expect(started.exercise.stageId).toBe(1);
	});

	test('Stage 5 Lead-in is a generated handshake of playable sentences even with an empty Profile', async () => {
		const nickname = 'LeadEmpty';
		const cookie = await createPlayerCookie(server, nickname, { track: 'learn' });
		const playerId = playerIdFor(server.databasePath, nickname);
		unlockThrough(server.databasePath, playerId, 4);

		const started = await startLeadIn(server, cookie, 5);
		expect(started.token).toEqual(expect.any(String));
		expect(started.exercise.content.length).toBeGreaterThan(0);
		expect(started.exercise.content).toMatch(/\b(dad|lad|lass|flag|glad|asks|salad|flask)\b/);
		const allowed = new Set(['f', 'j', 'g', 'h', 'd', 'k', 's', 'l', 'a', ';']);
		for (const key of derivedKeys(started.exercise.content)) {
			expect(allowed.has(key)).toBe(true);
		}
		expect(tokenCount(server.databasePath, playerId, false)).toBe(1);
		expect(tokenCount(server.databasePath, playerId, true)).toBe(0);
	});

	test('completing a Lead-in returns accuracy only, writes no Score, and folds the Profile', async () => {
		const nickname = 'LeadFold';
		const cookie = await createPlayerCookie(server, nickname, { track: 'learn' });
		const playerId = playerIdFor(server.databasePath, nickname);
		unlockThrough(server.databasePath, playerId, 4);
		const started = await startLeadIn(server, cookie, 5);

		const body = await completeLeadIn(server, cookie, 5, started);
		expect(body).toEqual({ accuracy: 1 });
		expect(body).not.toHaveProperty('score');
		expect(body).not.toHaveProperty('netWpm');
		expect(body).not.toHaveProperty('leaderboard');

		const database = new Database(server.databasePath, { readonly: true });
		const scoreCount = database
			.prepare('SELECT COUNT(*) AS count FROM scores WHERE player_id = ?')
			.get(playerId) as { count: number };
		const weakKeyRow = database
			.prepare('SELECT COUNT(*) AS count FROM weak_key_stats WHERE player_id = ?')
			.get(playerId) as { count: number };
		const stageFiveOpen = database
			.prepare(
				`SELECT COUNT(*) AS count FROM scores
				 JOIN exercises ON exercises.id = scores.exercise_id
				 WHERE scores.player_id = ? AND exercises.stage_id = 5 AND scores.accuracy >= 0.9`
			)
			.get(playerId) as { count: number };
		database.close();
		expect(scoreCount.count).toBe(0);
		expect(weakKeyRow.count).toBeGreaterThan(0);
		expect(stageFiveOpen.count).toBe(0);

		const locked = await fetch(`${server.baseUrl}/api/attempts/learn/6`, { headers: { cookie } });
		expect(locked.status).toBe(403);
	});

	test('a qualifying gated Score after a Lead-in still clears the Stage', async () => {
		const nickname = 'LeadThenClear';
		const cookie = await createPlayerCookie(server, nickname, { track: 'learn' });
		const playerId = playerIdFor(server.databasePath, nickname);
		unlockThrough(server.databasePath, playerId, 4);
		await completeLeadIn(server, cookie, 5, await startLeadIn(server, cookie, 5));

		const started = await startStage(server, cookie, 5);
		const body = await submitStage(server, cookie, started, 0);
		expect(body).toMatchObject({
			result: { state: 'cleared', nextStageId: 6 }
		});
		const opened = await fetch(`${server.baseUrl}/api/attempts/learn/6`, { headers: { cookie } });
		expect(opened.status).toBe(200);
	});

	test('a structurally incomplete Lead-in POST is 400 and folds nothing', async () => {
		const nickname = 'LeadBroken';
		const cookie = await createPlayerCookie(server, nickname, { track: 'learn' });
		const playerId = playerIdFor(server.databasePath, nickname);
		unlockThrough(server.databasePath, playerId, 4);
		const started = await startLeadIn(server, cookie, 5);

		const response = await fetch(`${server.baseUrl}/api/attempts/lead-in/5`, {
			method: 'POST',
			headers: { cookie, 'content-type': 'application/json' },
			body: JSON.stringify({
				token: started.token,
				events: [{ expected: started.exercise.content[0], received: 'z', timestampOffsetMs: 1 }]
			})
		});
		expect(response.status).toBe(400);

		const database = new Database(server.databasePath, { readonly: true });
		const scoreCount = database
			.prepare('SELECT COUNT(*) AS count FROM scores WHERE player_id = ?')
			.get(playerId) as { count: number };
		const weakKeyRow = database
			.prepare('SELECT COUNT(*) AS count FROM weak_key_stats WHERE player_id = ?')
			.get(playerId) as { count: number };
		database.close();
		expect(scoreCount.count).toBe(0);
		expect(weakKeyRow.count).toBe(0);
	});

	test('Lead-in is 403 when the Stage is not open and 401 with no Player', async () => {
		const cookie = await createPlayerCookie(server, 'LeadLocked', { track: 'learn' });
		const locked = await fetch(`${server.baseUrl}/api/attempts/lead-in/5`, { headers: { cookie } });
		expect(locked.status).toBe(403);

		const anonymous = await fetch(`${server.baseUrl}/api/attempts/lead-in/5`);
		expect(anonymous.status).toBe(401);
	});

	test('Stage 2 offers a letters Lead-in after floored F/J, and does not offer after override with no Profile', async () => {
		const offeredNickname = 'LeadStageTwo';
		const offeredCookie = await createPlayerCookie(server, offeredNickname, { track: 'learn' });
		const offeredId = playerIdFor(server.databasePath, offeredNickname);
		unlockThrough(server.databasePath, offeredId, 1);
		floorKeys(server.databasePath, offeredId, [
			{ key: 'f', attempts: 5, errors: 2, totalLatencyMs: 5000 },
			{ key: 'j', attempts: 5, errors: 1, totalLatencyMs: 1000 }
		]);

		const offeredPage = await fetch(`${server.baseUrl}/learn/stages/2`, {
			headers: { cookie: offeredCookie }
		});
		const offeredHtml = await offeredPage.text();
		expect(offeredHtml).toContain('Try these first');
		expect(offeredHtml).not.toContain('Try some words first');
		expect(tokenCount(server.databasePath, offeredId, true)).toBe(0);

		const letters = await startLeadIn(server, offeredCookie, 2);
		expect(letters.exercise.content).toMatch(/^[fjgh ]+$/);
		expect(letters.exercise.content).not.toMatch(/\b(dad|lad|lass|flag)\b/);

		const overrideNickname = 'LeadOverride';
		const overrideCookie = await createPlayerCookie(server, overrideNickname, { track: 'learn' });
		const overrideId = playerIdFor(server.databasePath, overrideNickname);
		unlockThrough(server.databasePath, overrideId, 1);

		const overridePage = await fetch(`${server.baseUrl}/learn/stages/2`, {
			headers: { cookie: overrideCookie }
		});
		expect(await overridePage.text()).not.toContain('Try these first');
		const autoStarted = await startStage(server, overrideCookie, 2);
		expect(autoStarted.exercise.stageId).toBe(2);
	});

	test('Stage 4 Lead-in is letters only; Stage 5 for the same Player includes Corpus sentences', async () => {
		const nickname = 'LeadLettersThenWords';
		const cookie = await createPlayerCookie(server, nickname, { track: 'learn' });
		const playerId = playerIdFor(server.databasePath, nickname);
		unlockThrough(server.databasePath, playerId, 4);
		floorKeys(server.databasePath, playerId, [
			{ key: 'f', attempts: 5, errors: 2, totalLatencyMs: 5000 }
		]);

		const stage4 = await startLeadIn(server, cookie, 4);
		expect(stage4.exercise.content).toMatch(/^[fjghdksl ]+$/);
		expect(stage4.exercise.content).not.toMatch(/\b(dad|lad|lass|flag|glad)\b/);
		const stage4Allowed = new Set(['f', 'j', 'g', 'h', 'd', 'k', 's', 'l']);
		for (const key of derivedKeys(stage4.exercise.content)) {
			expect(stage4Allowed.has(key)).toBe(true);
		}

		const stage5 = await startLeadIn(server, cookie, 5);
		expect(stage5.exercise.content).toMatch(/\b(dad|lad|lass|flag|glad|asks|salad|flask)\b/);
	});

	test('replay of a cleared Stage 2 still offers a Lead-in and still serves the seeded Exercise', async () => {
		const nickname = 'LeadReplay';
		const cookie = await createPlayerCookie(server, nickname, { track: 'learn' });
		const playerId = playerIdFor(server.databasePath, nickname);
		unlockThrough(server.databasePath, playerId, 2);
		floorKeys(server.databasePath, playerId, [
			{ key: 'f', attempts: 5, errors: 2, totalLatencyMs: 5000 }
		]);

		const page = await fetch(`${server.baseUrl}/learn/stages/2`, { headers: { cookie } });
		expect(await page.text()).toContain('Try these first');

		await completeLeadIn(server, cookie, 2, await startLeadIn(server, cookie, 2));
		const started = await startStage(server, cookie, 2);
		const database = new Database(server.databasePath, { readonly: true });
		const seeded = database
			.prepare("SELECT content FROM exercises WHERE stage_id = 2 AND track = 'learn'")
			.get() as { content: string };
		database.close();
		expect(started.exercise.content).toBe(seeded.content);
	});

	test('after a Lead-in, history shows no Learn best, Practice count 0, and a moved Profile', async () => {
		const nickname = 'LeadHistory';
		const cookie = await createPlayerCookie(server, nickname, { track: 'learn' });
		const playerId = playerIdFor(server.databasePath, nickname);
		unlockThrough(server.databasePath, playerId, 4);
		const started = await startLeadIn(server, cookie, 5);
		await completeLeadIn(server, cookie, 5, started);

		const history = await fetch(`${server.baseUrl}/history`, { headers: { cookie } });
		const page = (await history.text()).replace(/\s+/g, ' ');
		expect(page).toContain('No cleared Stages yet');
		expect(page).toContain('No Practice Attempts yet');
		expect(page).toMatch(/data-heat-cap="[a-z;]"/);
		expect(page).not.toContain('The Profile is still gathering enough samples');

		const database = new Database(server.databasePath, { readonly: true });
		const exercise = database
			.prepare("SELECT id FROM exercises WHERE stage_id = 5 AND track = 'learn'")
			.get() as { id: number };
		database.close();
		const board = await fetch(`${server.baseUrl}/api/leaderboards/${exercise.id}`, {
			headers: { cookie }
		});
		const leaderboard = (await board.json()) as { personal: unknown; rows: unknown[] };
		expect(leaderboard.personal).toBeNull();
	});

	test('after a Lead-in, try-again serves the seeded Exercise and Finger stretch still appears after the offer count', async () => {
		const nickname = 'LeadStretch';
		const cookie = await createPlayerCookie(server, nickname, { track: 'learn' });
		const playerId = playerIdFor(server.databasePath, nickname);
		unlockThrough(server.databasePath, playerId, 4);
		await completeLeadIn(server, cookie, 5, await startLeadIn(server, cookie, 5));

		const first = await startStage(server, cookie, 5);
		const seeded = first.exercise.content;
		const firstFail = await submitStage(
			server,
			cookie,
			first,
			failingErrorCount(first.exercise.content)
		);
		expect(firstFail).toMatchObject({
			result: { state: 'failed', stretchAvailable: false }
		});

		const retry = await startStage(server, cookie, 5);
		expect(retry.exercise.content).toBe(seeded);

		const secondFail = await submitStage(
			server,
			cookie,
			retry,
			failingErrorCount(retry.exercise.content)
		);
		expect(secondFail).toMatchObject({
			result: { state: 'failed', stretchAvailable: true }
		});

		const stretchResponse = await fetch(`${server.baseUrl}/api/attempts/stretch/5`, {
			headers: { cookie }
		});
		expect(stretchResponse.status).toBe(200);
		const stretch = (await stretchResponse.json()) as StartedLeadIn;
		expect(stretch.exercise.content).toMatch(/(aaaa|;;;;)/);
		expect(stretch.exercise.content).not.toMatch(/\b(dad|lass|flag)\b/);

		const stretchPost = await fetch(`${server.baseUrl}/api/attempts/stretch/5`, {
			method: 'POST',
			headers: { cookie, 'content-type': 'application/json' },
			body: JSON.stringify({
				token: stretch.token,
				events: correctEvents(stretch.exercise.content)
			})
		});
		expect(stretchPost.status).toBe(200);
		expect(await stretchPost.json()).toEqual({ accuracy: 1 });

		const database = new Database(server.databasePath, { readonly: true });
		const scoreCount = database
			.prepare('SELECT COUNT(*) AS count FROM scores WHERE player_id = ? AND exercise_id IS NULL')
			.get(playerId) as { count: number };
		const gatedFailures = database
			.prepare(
				`SELECT COUNT(*) AS count FROM scores
				 JOIN exercises ON exercises.id = scores.exercise_id
				 WHERE scores.player_id = ? AND exercises.stage_id = 5`
			)
			.get(playerId) as { count: number };
		database.close();
		expect(scoreCount.count).toBe(0);
		expect(gatedFailures.count).toBe(2);

		const afterStretch = await startStage(server, cookie, 5);
		expect(afterStretch.exercise.content).toBe(seeded);
	});
});

describe('Learn Lead-in targeting', () => {
	test('a unique floored F is favoured over a uniform empty-map draw under the same seed', async () => {
		const servers = await Promise.all([
			startTestServer({ RANDOM_SEED: 'lead-in-target', TARGETING_AGGRESSIVENESS: '1' }),
			startTestServer({ RANDOM_SEED: 'lead-in-target', TARGETING_AGGRESSIVENESS: '1' })
		]);
		try {
			const contents: string[] = [];
			for (const [index, configured] of servers.entries()) {
				const nickname = `LeadTarget${index}`;
				const cookie = await createPlayerCookie(configured, nickname, { track: 'learn' });
				const playerId = playerIdFor(configured.databasePath, nickname);
				unlockThrough(configured.databasePath, playerId, 4);
				if (index === 1) {
					floorKeys(configured.databasePath, playerId, [
						{ key: 'f', attempts: 5, errors: 5, totalLatencyMs: 5000 }
					]);
				}
				const started = await startLeadIn(configured, cookie, 5);
				contents.push(started.exercise.content);
			}
			const fCounts = contents.map(
				(content) => [...content].filter((character) => character === 'f').length
			);
			expect(fCounts[1]).toBeGreaterThan(fCounts[0]);
		} finally {
			await Promise.all(servers.map((configured) => configured.stop()));
		}
	});
});
