#!/usr/bin/env node
// Standalone deploy-time migration runner. Deliberately independent of the
// SvelteKit build graph (see docs/deploy.md) so a fresh volume can be brought
// to schema before litestream hands off to `node build`, rather than relying
// on the app's own lazy migration on first request.
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const databasePath = process.env.DATABASE_PATH;
if (!databasePath) {
	console.error('DATABASE_PATH must name the SQLite database file');
	process.exit(1);
}

const migrationsFolder = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'drizzle');

const sqlite = new Database(databasePath);
sqlite.pragma('foreign_keys = ON');
sqlite.pragma('journal_mode = WAL');
try {
	migrate(drizzle(sqlite), { migrationsFolder });
} finally {
	sqlite.close();
}

console.log(`Migrations applied to ${databasePath}`);
