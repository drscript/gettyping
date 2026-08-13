import { readFileSync } from 'node:fs';
import Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createPlayerCookie } from './player';
import { startTestServer, type TestServer } from './server';

function playerIdFor(databasePath: string, nickname: string): string {
	const database = new Database(databasePath, { readonly: true });
	const player = database
		.prepare('SELECT id FROM players WHERE nickname = ?')
		.get(nickname) as { id: string };
	database.close();
	return player.id;
}

function recordLearnScore(
	databasePath: string,
	nickname: string,
	stageId: number,
	accuracy: number
): void {
	const database = new Database(databasePath);
	const player = database
		.prepare('SELECT id FROM players WHERE nickname = ?')
		.get(nickname) as { id: string };
	database
		.prepare(
			`INSERT INTO scores
			 (player_id, exercise_id, nickname, net_wpm, gross_wpm, accuracy, elapsed_ms,
			  char_count, error_count, leaderboard_eligible, created_at)
			 VALUES (?, ?, ?, 20, 20, ?, 60000, 100, 0, 1, ?)`
		)
		.run(player.id, stageId, nickname, accuracy, Date.now());
	database.close();
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

describe('Practice from Learn — home and copy', () => {
	let server: TestServer;

	beforeAll(async () => {
		server = await startTestServer();
	});

	afterAll(async () => {
		await server?.stop();
	});

	test('a returning Learn Player with a Score sees Practise weak keys beside Continue to the current Stage', async () => {
		const nickname = 'HomeLearnHeron';
		const cookie = await createPlayerCookie(server, nickname, { track: 'learn' });
		recordLearnScore(server.databasePath, nickname, 1, 1);

		const response = await fetch(server.baseUrl, { headers: { cookie } });
		const html = await response.text();
		expect(html).toContain('href="/practice"');
		expect(html).toContain('Practise weak keys');
		expect(html).toMatch(/class="track-door learn continue-door[^"]*" href="\/learn\/stages\/2"/);

		const stageGrid = html.match(/<ol class="stage-grid"[\s\S]*?<\/ol>/)?.[0] ?? '';
		expect(stageGrid).not.toContain('href="/practice"');
	});

	test('a Nickname-only returning Player has no Practice link and Continue still points at Stage 1', async () => {
		const cookie = await createPlayerCookie(server, 'HomeColdCoot', { track: 'learn' });
		const html = await (await fetch(server.baseUrl, { headers: { cookie } })).text();
		expect(html).not.toContain('href="/practice"');
		expect(html).toContain('href="/learn/stages/1"');
	});

	test('a graduate Continue stays on the Speed Test and the Practice link is present', async () => {
		const nickname = 'HomeGradGrebe';
		const cookie = await createPlayerCookie(server, nickname, { track: 'learn' });
		for (let stageId = 1; stageId <= 21; stageId += 1) {
			recordLearnScore(server.databasePath, nickname, stageId, 1);
		}

		const html = await (await fetch(server.baseUrl, { headers: { cookie } })).text();
		expect(html).toMatch(/class="track-door learn continue-door[^"]*" href="\/speed-test"/);
		expect(html).toContain('href="/practice"');
		expect(html).toContain('Practise weak keys');
	});

	test('a Speed-Test-only Player sees the Practice link without Continue becoming /practice', async () => {
		const nickname = 'HomeSpeedSwan';
		const cookie = await createPlayerCookie(server, nickname, { track: 'speed-test-practice' });
		completeSpeedTest(server.databasePath, nickname);

		const html = await (await fetch(server.baseUrl, { headers: { cookie } })).text();
		expect(html).toContain('href="/practice"');
		expect(html).toContain('Practise weak keys');
		expect(html).not.toMatch(/class="track-door learn continue-door"[^>]*href="\/practice"/);
	});

	test('GET /practice keeps the Speed Test & Practice Track frame', async () => {
		const nickname = 'PracticeFrameFinch';
		const cookie = await createPlayerCookie(server, nickname, { track: 'learn' });
		recordLearnScore(server.databasePath, nickname, 1, 1);

		const html = await (await fetch(`${server.baseUrl}/practice`, { headers: { cookie } })).text();
		expect(html).toContain('data-track="speed-test-practice"');
	});

	test('Learn complete still leads with the Speed Test and does not send Players to Practice', async () => {
		const nickname = 'CompleteCopyCrane';
		const cookie = await createPlayerCookie(server, nickname, { track: 'learn' });
		unlockThrough(server.databasePath, playerIdFor(server.databasePath, nickname), 21);

		const response = await fetch(`${server.baseUrl}/learn/complete`, { headers: { cookie } });
		expect(response.status).toBe(200);
		const html = await response.text();
		expect(html).toContain('href="/speed-test"');
		expect(html).toContain('Take the Speed Test');
		expect(html).not.toContain('Weak-key Profile that Practice draws from');
		expect(html).not.toContain('href="/practice"');
		expect(html).toContain('flagship Leaderboard');
	});
});

describe('Practice from Learn — source copy', () => {
	test('Practice summary offers Take the Speed Test, not Retake, and still assigns /speed-test on 403', () => {
		const source = readFileSync('src/routes/practice/+page.svelte', 'utf8');
		expect(source).not.toContain('Retake the Speed Test');
		expect(source).toContain('Take the Speed Test');
		expect(source).toContain("window.location.assign('/speed-test')");
	});

	test('Speed Test result still offers Practise your weak keys', () => {
		const source = readFileSync('src/routes/speed-test/+page.svelte', 'utf8');
		expect(source).toContain('Practise your weak keys');
	});
});
