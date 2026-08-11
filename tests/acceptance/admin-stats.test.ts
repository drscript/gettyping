import { randomUUID } from 'node:crypto';
import Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { startTestServer, type TestServer } from './server';

const adminToken = 'admin-stats-test-token';
const day = 1000 * 60 * 60 * 24;

function insertPlayer(server: TestServer, nickname: string, createdAt: number): string {
	const id = randomUUID();
	const database = new Database(server.databasePath);
	database
		.prepare('INSERT INTO players (id, nickname, created_at) VALUES (?, ?, ?)')
		.run(id, nickname, createdAt);
	database.close();
	return id;
}

function insertScore(
	server: TestServer,
	playerId: string,
	nickname: string,
	values: { exerciseId: number | null; netWpm: number; accuracy: number; createdAt: number }
): void {
	const database = new Database(server.databasePath);
	database
		.prepare(
			`INSERT INTO scores
			 (player_id, exercise_id, nickname, net_wpm, gross_wpm, accuracy, elapsed_ms,
			  char_count, error_count, leaderboard_eligible, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, 60000, 100, 0, 1, ?)`
		)
		.run(
			playerId,
			values.exerciseId,
			nickname,
			values.netWpm,
			values.netWpm,
			values.accuracy,
			values.createdAt
		);
	database.close();
}

function insertStageUnlock(server: TestServer, playerId: string, stageId: number): void {
	const database = new Database(server.databasePath);
	database
		.prepare('INSERT INTO stage_unlocks (player_id, stage_id, granted_at) VALUES (?, ?, ?)')
		.run(playerId, stageId, Date.now());
	database.close();
}

function insertWeakKeyStat(
	server: TestServer,
	playerId: string,
	key: string,
	attempts: number,
	errors: number
): void {
	const database = new Database(server.databasePath);
	database
		.prepare(
			`INSERT INTO weak_key_stats (player_id, key, attempts, errors, total_latency_ms)
			 VALUES (?, ?, ?, ?, 0)`
		)
		.run(playerId, key, attempts, errors);
	database.close();
}

async function adminCookie(server: TestServer): Promise<string> {
	const response = await fetch(`${server.baseUrl}/admin/login`, {
		method: 'POST',
		headers: {
			accept: 'text/html',
			'content-type': 'application/x-www-form-urlencoded',
			origin: server.baseUrl
		},
		body: new URLSearchParams({ token: adminToken }),
		redirect: 'manual'
	});
	return response.headers.get('set-cookie')!.split(';', 1)[0];
}

async function fetchAdminPage(server: TestServer, cookie: string): Promise<string> {
	const response = await fetch(`${server.baseUrl}/admin`, { headers: { cookie } });
	expect(response.status).toBe(200);
	return response.text();
}

function escapeRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Matches a <dt>/<dd> stat pair regardless of Svelte's generated CSS-scoping class, so tests don't
// break every time the component's styles change.
function statPattern(label: string, value: string | number): RegExp {
	return new RegExp(`<dt[^>]*>${escapeRegex(label)}</dt><dd[^>]*>${escapeRegex(String(value))}</dd>`);
}

// Matches a <tr> of <td> cells, same class-agnostic reasoning as statPattern.
function rowPattern(...cells: Array<string | number>): RegExp {
	const tds = cells.map((cell) => `<td[^>]*>${escapeRegex(String(cell))}</td>`).join('');
	return new RegExp(`<tr>${tds}</tr>`);
}

describe('Admin statistics', () => {
	let server: TestServer;
	let cookie: string;

	beforeAll(async () => {
		server = await startTestServer({ ADMIN_TOKEN: adminToken });
		cookie = await adminCookie(server);
	});

	afterAll(async () => {
		await server?.stop();
	});

	test('growth, engagement, and practice performance count Attempts across the rolling 7-day window', async () => {
		const now = Date.now();
		const oldPlayer = insertPlayer(server, 'OldOwl', now - 10 * day);
		const recentPlayerA = insertPlayer(server, 'FreshFox', now - 1 * day);
		const recentPlayerB = insertPlayer(server, 'NewNewt', now);

		// Old, failing Learn Attempts — outside the 7-day window and below the clearance threshold.
		insertScore(server, oldPlayer, 'OldOwl', {
			exerciseId: 1,
			netWpm: 20,
			accuracy: 0.5,
			createdAt: now - 10 * day
		});
		insertScore(server, oldPlayer, 'OldOwl', {
			exerciseId: 1,
			netWpm: 22,
			accuracy: 0.5,
			createdAt: now - 10 * day
		});
		// A recent Speed Test Attempt.
		insertScore(server, recentPlayerA, 'FreshFox', {
			exerciseId: 22,
			netWpm: 50,
			accuracy: 1,
			createdAt: now - 1 * day
		});
		// A recent Practice Attempt (generated content — no Exercise row) and a recent, failing Learn Attempt.
		insertScore(server, recentPlayerB, 'NewNewt', {
			exerciseId: null,
			netWpm: 60,
			accuracy: 1,
			createdAt: now
		});
		insertScore(server, recentPlayerB, 'NewNewt', {
			exerciseId: 1,
			netWpm: 18,
			accuracy: 0.5,
			createdAt: now
		});

		const page = await fetchAdminPage(server, cookie);

		expect(page).toMatch(statPattern('Total Players', 3));
		expect(page).toMatch(statPattern('New Players, last 7 days', 2));
		expect(page).toMatch(statPattern('Total Attempts', 5));
		expect(page).toMatch(statPattern('Attempts, last 7 days', 3));
		expect(page).toMatch(statPattern('Average Attempts per Player', '1.67'));

		// Only the Speed Test and Practice Attempts count toward practice performance — the two
		// failing Learn Attempts on exercise 1 are excluded.
		expect(page).toContain('Speed Test &amp; Practice');
		expect(page).toMatch(statPattern('Attempts', 2));
		expect(page).toMatch(statPattern('Average net WPM', '55.0'));
		expect(page).toMatch(statPattern('Average accuracy', '100.0%'));
	});

	test('the Learn funnel counts Players cleared per Stage via a qualifying Score or an explicit grown-up unlock', async () => {
		const now = Date.now();
		const clearedByScore = insertPlayer(server, 'ScoreClearedSeal', now);
		const clearedByOverride = insertPlayer(server, 'OverrideOtter', now);

		// Stage 3's Exercise is id 3 — a passing Score (>= 90% accuracy) clears it the normal way.
		insertScore(server, clearedByScore, 'ScoreClearedSeal', {
			exerciseId: 3,
			netWpm: 30,
			accuracy: 0.95,
			createdAt: now
		});
		// Stage 5 is cleared purely via a grown-up override, with no qualifying Score at all.
		insertStageUnlock(server, clearedByOverride, 5);

		const page = await fetchAdminPage(server, cookie);

		expect(page).toMatch(rowPattern('3. Home row: D &amp; K', 1));
		expect(page).toMatch(rowPattern('5. Home row: A &amp; ;', 1));
		expect(page).toMatch(rowPattern('9. Top row: W &amp; O', 0));
	});

	test('weakest keys aggregate weak-key stats across every Player, and content popularity ranks Exercises by Attempts', async () => {
		const now = Date.now();
		const playerOne = insertPlayer(server, 'KeyOneKoala', now);
		const playerTwo = insertPlayer(server, 'KeyTwoTiger', now);

		insertWeakKeyStat(server, playerOne, 'q', 10, 5);
		insertWeakKeyStat(server, playerTwo, 'q', 10, 5);
		insertWeakKeyStat(server, playerOne, 'p', 10, 1);

		insertScore(server, playerOne, 'KeyOneKoala', {
			exerciseId: 10,
			netWpm: 40,
			accuracy: 0.95,
			createdAt: now
		});
		insertScore(server, playerTwo, 'KeyTwoTiger', {
			exerciseId: 10,
			netWpm: 42,
			accuracy: 0.95,
			createdAt: now
		});

		const page = await fetchAdminPage(server, cookie);
		const weakestKeysSection = page.slice(
			page.indexOf('Weakest keys'),
			page.indexOf('Content popularity')
		);

		// 'q' has a 50% aggregate error rate (10 errors across 20 attempts), ranked above 'p' at 10%.
		const qRow = rowPattern('q', '50.0%', '20.0').exec(weakestKeysSection);
		const pRow = rowPattern('p', '10.0%', '10.0').exec(weakestKeysSection);
		expect(qRow).not.toBeNull();
		expect(pRow).not.toBeNull();
		expect(pRow!.index).toBeGreaterThan(qRow!.index);

		expect(page).toMatch(rowPattern('Top row: Q &amp; P', 2, 2));
		expect(page).toMatch(rowPattern('Punctuation: comma &amp; period', 0, 0));
	});
});
