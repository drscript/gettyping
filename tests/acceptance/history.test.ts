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
		expect(profilePage).toContain('data-heat-cap="q"');
		expect(profilePage).toContain('q: 38% weak');
		expect(profilePage).toContain('shift (no data)');
		expect(profilePage).toContain('space (not yet measured)');

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
		expect(page).toContain('data-heat-cap="q"');
		expect(page).toContain('q: 38% weak');
		expect(page).not.toContain('data-practice-attempt');
	});

	test('the heat map pools dual-value caps, floors on pooled attempts, and labels hot keys', async () => {
		const cookie = await createPlayerCookie(server, 'HeatMapHawk');
		const identity = JSON.parse(decodeURIComponent(cookie.split('=', 2)[1])) as {
			active: string;
		};
		const database = new Database(server.databasePath);
		const insertStat = database.prepare(
			`INSERT INTO weak_key_stats (player_id, key, attempts, errors, total_latency_ms)
			 VALUES (?, ?, ?, ?, ?)`
		);
		// q alone: 0.4 × 0.7 + (1000/3000) × 0.3 = 0.38
		insertStat.run(identity.active, 'q', 5, 2, 5000);
		// The `1 !` cap pools its two recorded keys: 4 attempts, 0 errors, 8000ms → 0.2
		insertStat.run(identity.active, '1', 2, 0, 6000);
		insertStat.run(identity.active, '!', 2, 0, 2000);
		// The `/ ?` cap pools to 3 attempts, 1 error, 9000ms → 7/15 ≈ 0.5333 (hottest)
		insertStat.run(identity.active, '/', 2, 1, 6000);
		insertStat.run(identity.active, '?', 1, 0, 3000);
		// The `; :` cap pools to only 2 attempts → below the floor → neutral
		insertStat.run(identity.active, ';', 1, 1, 3000);
		insertStat.run(identity.active, ':', 1, 0, 3000);
		database.close();

		const response = await fetch(`${server.baseUrl}/history`, { headers: { cookie } });
		const page = await response.text();
		expect(response.status).toBe(200);

		// One pooled cap per dual-value key pair, keyed by the canonical recorded key
		expect(page).toContain('data-heat-cap="1"');
		expect(page).toContain('data-heat-cap="/"');
		expect(page).not.toContain('data-heat-cap="!"');
		expect(page).not.toContain('data-heat-cap="?"');

		// Pooled arithmetic, as absolute percentages in the accessible labels
		expect(page).toContain('1 !: 20% weak');
		expect(page).toContain('/ ?: 53% weak');

		// Hot threshold (≥ 0.5 × the Player's own max of 53%): q and `/ ?` print, `1 !` does not
		expect(page).toMatch(/<span class="cap-percent[^"]*">53%<\/span>/);
		expect(page).toMatch(/<span class="cap-percent[^"]*">38%<\/span>/);
		expect(page).not.toMatch(/<span class="cap-percent[^"]*">20%<\/span>/);

		// The floor applies to pooled attempts
		expect(page).toContain('; : (not yet measured)');

		// Shift is never an expected character, so it carries no data
		expect(page).toContain('shift (no data)');
	});
});
