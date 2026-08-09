import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { resolve } from 'node:path';
import * as schema from './schema';

let database: BetterSQLite3Database<typeof schema> | undefined;

export function getDatabase(): BetterSQLite3Database<typeof schema> {
	if (database) return database;

	const databasePath = process.env.DATABASE_PATH;
	if (!databasePath) {
		throw new Error('DATABASE_PATH must name the SQLite database file');
	}

	const sqlite = new Database(databasePath);
	sqlite.pragma('foreign_keys = ON');
	sqlite.pragma('journal_mode = WAL');
	database = drizzle(sqlite, { schema });
	migrate(database, { migrationsFolder: resolve('drizzle') });

	return database;
}
