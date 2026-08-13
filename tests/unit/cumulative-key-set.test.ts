import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { cumulativeKeySet } from '../../src/lib/server/cumulative-key-set';
import * as schema from '../../src/lib/server/database/schema';
import { players, scores, stageUnlocks } from '../../src/lib/server/database/schema';

type TestDatabase = BetterSQLite3Database<typeof schema>;
type ScoreInsert = typeof scores.$inferInsert;

let directory: string;
let sqlite: InstanceType<typeof Database>;
let database: TestDatabase;

beforeEach(async () => {
	directory = await mkdtemp(join(tmpdir(), 'gettyping-cumulative-key-set-'));
	sqlite = new Database(join(directory, 'test.sqlite'));
	sqlite.pragma('foreign_keys = ON');
	database = drizzle(sqlite, { schema });
	migrate(database, { migrationsFolder: resolve('drizzle') });
});

afterEach(async () => {
	sqlite.close();
	await rm(directory, { recursive: true, force: true });
});

function createPlayer(): string {
	const id = randomUUID();
	database.insert(players).values({ id, nickname: `Player-${id.slice(0, 8)}`, createdAt: Date.now() }).run();
	return id;
}

function insertScore(playerId: string, overrides: Partial<ScoreInsert> & { exerciseId: number }): void {
	database
		.insert(scores)
		.values({
			playerId,
			nickname: 'tester',
			netWpm: 20,
			grossWpm: 20,
			accuracy: 1,
			elapsedMs: 1000,
			charCount: 10,
			errorCount: 0,
			leaderboardEligible: true,
			createdAt: Date.now(),
			...overrides
		})
		.run();
}

function clearStage(playerId: string, stageId: number): void {
	insertScore(playerId, { exerciseId: stageId, accuracy: 1 });
}

describe('cumulativeKeySet', () => {
	test('a Player with no Learn Scores at all gets the full lowercase alphabet', () => {
		const playerId = createPlayer();
		insertScore(playerId, { exerciseId: 22, accuracy: 1 }); // Speed Test only

		const keySet = cumulativeKeySet(database, playerId);

		expect([...keySet].sort()).toEqual([...'abcdefghijklmnopqrstuvwxyz'].sort());
	});

	test('a brand new Player with no Scores at all also gets the full alphabet', () => {
		const playerId = createPlayer();

		expect([...cumulativeKeySet(database, playerId)].sort()).toEqual(
			[...'abcdefghijklmnopqrstuvwxyz'].sort()
		);
	});

	test('a Player with a failing Stage 1 Attempt but nothing cleared gets exactly {f, j}', () => {
		const playerId = createPlayer();
		insertScore(playerId, { exerciseId: 1, accuracy: 0.2 });

		expect(cumulativeKeySet(database, playerId)).toEqual(new Set(['f', 'j']));
	});

	test('a leaderboard-ineligible Score still counts as having started Learn', () => {
		const playerId = createPlayer();
		insertScore(playerId, { exerciseId: 1, accuracy: 0.2, leaderboardEligible: false });

		expect(cumulativeKeySet(database, playerId)).toEqual(new Set(['f', 'j']));
	});

	test('clearing Stages unions their keysTaught, including the next current Stage', () => {
		const playerId = createPlayer();
		clearStage(playerId, 1); // {f, j}
		clearStage(playerId, 2); // {g, h}
		// Stage 3 ({d, k}) is now current but not cleared.

		expect(cumulativeKeySet(database, playerId)).toEqual(new Set(['f', 'j', 'g', 'h', 'd', 'k']));
	});

	test('shift enters the set once Stage 14 is cleared, and the newly-current Stage 15 keys with it', () => {
		const playerId = createPlayer();
		for (let stageId = 1; stageId <= 14; stageId += 1) clearStage(playerId, stageId);
		// Stage 15 ({',', '.'}) is now current (its keys count, same as Stage 1 for a fresh Learner);
		// Stage 16 ({"'", '?', '!'}) is still locked.

		const keySet = cumulativeKeySet(database, playerId);

		expect(keySet.has('shift')).toBe(true);
		expect(keySet.has(',')).toBe(true);
		expect(keySet.has('.')).toBe(true);
		expect(keySet.has("'")).toBe(false);
		expect(keySet.has('?')).toBe(false);
		expect(keySet.has('!')).toBe(false);
	});

	test('a fully-cleared curriculum includes digits and punctuation as-is', () => {
		const playerId = createPlayer();
		for (let stageId = 1; stageId <= 21; stageId += 1) clearStage(playerId, stageId);

		const keySet = cumulativeKeySet(database, playerId);

		for (const digit of '1234567890') expect(keySet.has(digit)).toBe(true);
		for (const mark of [';', ',', '.', "'", '?', '!']) expect(keySet.has(mark)).toBe(true);
		expect(keySet.has('shift')).toBe(true);
	});

	test('a stage_unlocks override resolves a Stage without a qualifying Score', () => {
		const playerId = createPlayer();
		database.insert(stageUnlocks).values({ playerId, stageId: 1, grantedAt: Date.now() }).run();
		insertScore(playerId, { exerciseId: 1, accuracy: 0.1 }); // failing Attempt, still "started"

		// Stage 1 resolved via override (not a qualifying Score) -> Stage 2 is current.
		expect(cumulativeKeySet(database, playerId)).toEqual(new Set(['f', 'j', 'g', 'h']));
	});
});
