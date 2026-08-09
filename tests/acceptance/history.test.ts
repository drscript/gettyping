import Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createPlayerCookie } from './player';
import { startTestServer, type TestServer } from './server';

describe('Personal history', () => {
	let server: TestServer;

	beforeAll(async () => {
		server = await startTestServer();
	});

	afterAll(async () => {
		await server?.stop();
	});

	test('history is a Player route with honest empty states for every Track', async () => {
		const cookie = await createPlayerCookie(server, 'HistoryHeron');
		const homeResponse = await fetch(server.baseUrl, { headers: { cookie } });
		const home = await homeResponse.text();
		expect(home).toContain('href="/history"');
		expect(home).toContain('Your history');

		const response = await fetch(`${server.baseUrl}/history`, { headers: { cookie } });
		const page = (await response.text()).replace(/\s+/g, ' ');
		expect(response.status).toBe(200);
		expect(page).toContain('Your typing history');
		expect(page).toContain('Speed Test');
		expect(page).toContain('No Speed Test Attempts yet');
		expect(page).toContain('Learn');
		expect(page).toContain('No cleared Stages yet');
		expect(page).toContain('Practice');
		expect(page).toContain('No Practice Attempts yet');
		expect(page).toContain('The Profile is still gathering enough samples');
		expect(page).not.toContain('For grown-ups to view');

		const identity = JSON.parse(decodeURIComponent(cookie.split('=', 2)[1])) as {
			active: string;
		};
		const database = new Database(server.databasePath);
		database
			.prepare(
				`INSERT INTO weak_key_stats (player_id, key, attempts, errors, total_latency_ms)
				 VALUES (?, 'q', 5, 2, 5000)`
			)
			.run(identity.active);
		database.close();
		const profileResponse = await fetch(`${server.baseUrl}/history`, { headers: { cookie } });
		const profilePage = await profileResponse.text();
		expect(profilePage).toContain('No Practice Attempts yet');
		expect(profilePage).toContain('data-weak-key="q"');

		const anonymousResponse = await fetch(`${server.baseUrl}/history`, { redirect: 'manual' });
		expect(anonymousResponse.status).toBe(303);
		expect(anonymousResponse.headers.get('location')).toBe('/');
	});

	test('each Track presents only the history its Scores can support', async () => {
		const cookie = await createPlayerCookie(server, 'TrendTern');
		const identity = JSON.parse(decodeURIComponent(cookie.split('=', 2)[1])) as {
			active: string;
		};
		const database = new Database(server.databasePath);
		const insertScore = database.prepare(
			`INSERT INTO scores
			 (player_id, exercise_id, nickname, net_wpm, gross_wpm, accuracy, elapsed_ms,
			  char_count, error_count, leaderboard_eligible, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, 100, 0, ?, ?)`
		);
		const firstDate = 1_700_000_000_000;
		const day = 24 * 60 * 60 * 1000;
		const firstSpeed = Number(
			insertScore.run(identity.active, 22, 'OldTrendTern', 20, 20, 1, 60_000, 1, firstDate)
				.lastInsertRowid
		);
		const middleSpeed = Number(
			insertScore.run(identity.active, 22, 'TrendTern', 24, 24, 1, 55_000, 1, firstDate + day)
				.lastInsertRowid
		);
		const flaggedSpeed = Number(
			insertScore.run(identity.active, 22, 'TrendTern', 900, 900, 1, 1_000, 0, firstDate + day * 10)
				.lastInsertRowid
		);
		const latestSpeed = Number(
			insertScore.run(identity.active, 22, 'TrendTern', 32, 32, 0.98, 50_000, 1, firstDate + day * 30)
				.lastInsertRowid
		);
		insertScore.run(identity.active, 1, 'TrendTern', 12, 12, 0.91, 70_000, 1, 1_700_300_000_000);
		insertScore.run(identity.active, 1, 'TrendTern', 25, 25, 0.95, 60_000, 1, 1_700_400_000_000);
		insertScore.run(identity.active, 2, 'TrendTern', 99, 99, 0.5, 20_000, 1, 1_700_500_000_000);
		insertScore.run(identity.active, null, 'TrendTern', 14, 14, 0.9, 30_000, 1, 1_700_600_000_000);
		insertScore.run(identity.active, null, 'TrendTern', 16, 16, 0.92, 90_000, 1, 1_700_700_000_000);
		database
			.prepare(
				`INSERT INTO weak_key_stats (player_id, key, attempts, errors, total_latency_ms)
				 VALUES (?, 'q', 5, 2, 5000)`
			)
			.run(identity.active);
		database.close();

		const response = await fetch(`${server.baseUrl}/history`, { headers: { cookie } });
		const page = (await response.text()).replace(/\s+/g, ' ');
		expect(response.status).toBe(200);

		for (const scoreId of [firstSpeed, middleSpeed, flaggedSpeed, latestSpeed]) {
			expect(page).toContain(`data-speed-score-id="${scoreId}"`);
		}
		expect(page).toContain(`data-trend-score-id="${firstSpeed}"`);
		expect(page).toContain(`data-trend-score-id="${middleSpeed}"`);
		expect(page).toContain(`data-trend-score-id="${latestSpeed}"`);
		expect(page).not.toContain(`data-trend-score-id="${flaggedSpeed}"`);
		const middlePoint = page.match(
			new RegExp(`data-trend-score-id="${middleSpeed}" cx="([^"]+)"`)
		);
		expect(Number(middlePoint?.[1])).toBeLessThan(15);
		expect(page).toContain('Not ranked');
		expect(page).toContain('OldTrendTern');

		expect(page).toContain('data-stage-id="1"');
		expect(page).toContain('25.0 net WPM');
		expect(page).not.toContain('data-stage-id="2"');

		expect(page).toContain('data-practice-count="2"');
		expect(page).toContain('data-practice-elapsed="2m 0s"');
		expect(page).toContain('data-weak-key="q"');
		expect(page).not.toContain('data-practice-attempt');
	});
});
