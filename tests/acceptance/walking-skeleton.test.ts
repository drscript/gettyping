import Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { startTestServer, type TestServer } from './server';

const expectedTables = [
	'attempt_tokens',
	'exercises',
	'players',
	'scores',
	'stage_unlocks',
	'stages',
	'transfer_codes',
	'weak_key_stats'
];

describe('walking skeleton', () => {
	let server: TestServer;

	beforeAll(async () => {
		server = await startTestServer();
	});

	afterAll(async () => {
		await server?.stop();
	});

	test('serves the migrated and seeded curriculum over HTTP', async () => {
		const response = await fetch(`${server.baseUrl}/api/stages`);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			stages: [
				{ id: 1, name: 'Home row: F & J', keysTaught: ['f', 'j'] },
				{ id: 2, name: 'Home row: G & H', keysTaught: ['g', 'h'] },
				{ id: 3, name: 'Home row: D & K', keysTaught: ['d', 'k'] },
				{ id: 4, name: 'Home row: S & L', keysTaught: ['s', 'l'] },
				{ id: 5, name: 'Home row: A & ;', keysTaught: ['a', ';'] },
				{ id: 6, name: 'Top row: R & U', keysTaught: ['r', 'u'] },
				{ id: 7, name: 'Top row: T & Y', keysTaught: ['t', 'y'] },
				{ id: 8, name: 'Top row: E & I', keysTaught: ['e', 'i'] },
				{ id: 9, name: 'Top row: W & O', keysTaught: ['w', 'o'] },
				{ id: 10, name: 'Top row: Q & P', keysTaught: ['q', 'p'] },
				{ id: 11, name: 'Bottom row: V & N', keysTaught: ['v', 'n'] },
				{ id: 12, name: 'Bottom row: B & M', keysTaught: ['b', 'm'] },
				{ id: 13, name: 'Bottom row: Z, X, C', keysTaught: ['z', 'x', 'c'] },
				{ id: 14, name: 'Shift & capitalization', keysTaught: ['shift'] },
				{ id: 15, name: 'Punctuation: comma & period', keysTaught: [',', '.'] },
				{ id: 16, name: "Punctuation: apostrophe, ?, !", keysTaught: ["'", '?', '!'] },
				{ id: 17, name: 'Numbers: 1 & 0', keysTaught: ['1', '0'] },
				{ id: 18, name: 'Numbers: 2 & 9', keysTaught: ['2', '9'] },
				{ id: 19, name: 'Numbers: 3 & 8', keysTaught: ['3', '8'] },
				{ id: 20, name: 'Numbers: 4 & 7', keysTaught: ['4', '7'] },
				{ id: 21, name: 'Numbers: 5 & 6', keysTaught: ['5', '6'] }
			]
		});

		const database = new Database(server.databasePath, { readonly: true });
		const tables = database
			.prepare(
				"SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' " +
					"AND name NOT LIKE '__drizzle_%' ORDER BY name"
			)
			.all()
			.map((row) => (row as { name: string }).name);
		const journalMode = database.pragma('journal_mode', { simple: true });
		const exerciseSeeds = database
			.prepare('SELECT track, stage_id AS stageId, content FROM exercises ORDER BY id')
			.all();
		database.close();

		expect(tables).toEqual(expectedTables);
		expect(journalMode).toBe('wal');
		expect(exerciseSeeds).toHaveLength(22);
		expect(exerciseSeeds.slice(0, 21)).toEqual(
			Array.from({ length: 21 }, (_, index) => ({
				track: 'learn',
				stageId: index + 1,
				content: expect.any(String)
			}))
		);
		expect(exerciseSeeds[21]).toEqual({
			track: 'speed_test',
			stageId: null,
			content:
				'small steps build steady skill. keep your hands relaxed and let each key arrive in its own time. accuracy grows into speed with calm practice.'
		});
	});

	test('injects every tunable and makes random generation repeatable from a seed', async () => {
		const overrides = {
			ENABLE_TEST_API: 'true',
			RANDOM_SEED: 'repeatable-acceptance-seed',
			TARGETING_AGGRESSIVENESS: '0.42',
			WEAK_KEY_DECAY_FACTOR: '0.81',
			SPEED_TEST_FLOOR_WPM: '17',
			CONSECUTIVE_FAILURE_COUNT: '4',
			LEADERBOARD_DISPLAY_THRESHOLD: '8',
			NET_WPM_CEILING: '275',
			LATENCY_CLAMP_MS: '2450'
		};
		const first = await startTestServer(overrides);
		const second = await startTestServer(overrides);

		try {
			const [firstResponse, secondResponse] = await Promise.all([
				fetch(`${first.baseUrl}/api/testing/runtime`),
				fetch(`${second.baseUrl}/api/testing/runtime`)
			]);
			const firstRuntime = await firstResponse.json();
			const secondRuntime = await secondResponse.json();

			expect(firstResponse.status).toBe(200);
			expect(firstRuntime).toEqual({
				configuration: {
					targetingAggressiveness: 0.42,
					weakKeyDecayFactor: 0.81,
					speedTestFloorWpm: 17,
					consecutiveFailureCount: 4,
					leaderboardDisplayThreshold: 8,
					netWpmCeiling: 275,
					latencyClampMs: 2450
				},
				randomSequence: expect.arrayContaining([expect.any(Number)])
			});
			expect(secondResponse.status).toBe(200);
			expect(secondRuntime.randomSequence).toEqual(firstRuntime.randomSequence);
		} finally {
			await Promise.all([first.stop(), second.stop()]);
		}
	});
});
