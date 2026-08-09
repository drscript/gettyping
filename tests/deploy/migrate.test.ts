import Database from 'better-sqlite3';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

const expectedTables = [
	'attempt_tokens',
	'exercises',
	'players',
	'scores',
	'stage_unlocks',
	'stages',
	'weak_key_stats'
];

function runMigrateScript(env: NodeJS.ProcessEnv): ReturnType<typeof spawnSync> {
	return spawnSync(process.execPath, ['scripts/migrate.mjs'], {
		cwd: process.cwd(),
		env: { ...process.env, ...env },
		encoding: 'utf-8'
	});
}

describe('the standalone deploy-time migration script', () => {
	let directory: string;
	let databasePath: string;

	beforeEach(async () => {
		directory = await mkdtemp(join(tmpdir(), 'gettyping-migrate-'));
		databasePath = join(directory, 'deploy.sqlite');
	});

	afterEach(async () => {
		await rm(directory, { recursive: true, force: true });
	});

	test('creates every table and the curriculum seed on a fresh volume', () => {
		const result = runMigrateScript({ DATABASE_PATH: databasePath });

		expect(result.status).toBe(0);

		const database = new Database(databasePath, { readonly: true });
		const tables = database
			.prepare(
				"SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' " +
					"AND name NOT LIKE '__drizzle_%' ORDER BY name"
			)
			.all()
			.map((row) => (row as { name: string }).name);
		const journalMode = database.pragma('journal_mode', { simple: true });
		const stageCount = database
			.prepare('SELECT COUNT(*) AS count FROM stages')
			.get() as { count: number };
		database.close();

		expect(tables).toEqual(expectedTables);
		expect(journalMode).toBe('wal');
		expect(stageCount.count).toBe(21);
	});

	test('running it again against an already-migrated volume keeps existing data intact', () => {
		expect(runMigrateScript({ DATABASE_PATH: databasePath }).status).toBe(0);

		const database = new Database(databasePath);
		database
			.prepare('INSERT INTO players (id, nickname, created_at) VALUES (?, ?, ?)')
			.run('a-player-id', 'BraveOtter', Date.now());
		database.close();

		const second = runMigrateScript({ DATABASE_PATH: databasePath });
		expect(second.status).toBe(0);

		const verify = new Database(databasePath, { readonly: true });
		const player = verify
			.prepare('SELECT nickname FROM players WHERE id = ?')
			.get('a-player-id');
		verify.close();

		expect(player).toEqual({ nickname: 'BraveOtter' });
	});

	test('fails clearly when DATABASE_PATH is not set, exactly as a stray migration run should', () => {
		const result = runMigrateScript({ DATABASE_PATH: '' });

		expect(result.status).not.toBe(0);
		expect(result.stderr).toContain('DATABASE_PATH must name the SQLite database file');
	});
});
