import { sql } from 'drizzle-orm';
import {
	check,
	index,
	integer,
	primaryKey,
	real,
	sqliteTable,
	text,
	uniqueIndex
} from 'drizzle-orm/sqlite-core';

export const players = sqliteTable('players', {
	id: text('id').primaryKey(),
	nickname: text('nickname').notNull(),
	createdAt: integer('created_at').notNull()
});

export const stages = sqliteTable('stages', {
	id: integer('id').primaryKey(),
	name: text('name').notNull(),
	keysTaught: text('keys_taught', { mode: 'json' }).$type<string[]>().notNull()
});

export const exercises = sqliteTable(
	'exercises',
	{
		id: integer('id').primaryKey(),
		track: text('track', { enum: ['learn', 'speed_test'] }).notNull(),
		stageId: integer('stage_id').references(() => stages.id),
		content: text('content')
	},
	(table) => [
		uniqueIndex('exercises_stage_id_unique').on(table.stageId),
		check('exercises_track_check', sql`${table.track} in ('learn', 'speed_test')`),
		check(
			'exercises_stage_check',
			sql`(${table.track} = 'learn' and ${table.stageId} is not null) or (${table.track} = 'speed_test' and ${table.stageId} is null)`
		)
	]
);

export const scores = sqliteTable(
	'scores',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		playerId: text('player_id').notNull().references(() => players.id),
		exerciseId: integer('exercise_id').references(() => exercises.id),
		nickname: text('nickname').notNull(),
		netWpm: real('net_wpm').notNull(),
		grossWpm: real('gross_wpm').notNull(),
		accuracy: real('accuracy').notNull(),
		elapsedMs: integer('elapsed_ms').notNull(),
		charCount: integer('char_count').notNull(),
		errorCount: integer('error_count').notNull(),
		leaderboardEligible: integer('leaderboard_eligible', { mode: 'boolean' })
			.notNull()
			.default(true),
		createdAt: integer('created_at').notNull()
	},
	(table) => [
		index('scores_exercise_player_wpm_idx').on(table.exerciseId, table.playerId, table.netWpm),
		index('scores_player_created_at_idx').on(table.playerId, table.createdAt)
	]
);

export const weakKeyStats = sqliteTable(
	'weak_key_stats',
	{
		playerId: text('player_id').notNull().references(() => players.id),
		key: text('key').notNull(),
		attempts: real('attempts').notNull().default(0),
		errors: real('errors').notNull().default(0),
		totalLatencyMs: real('total_latency_ms').notNull().default(0)
	},
	(table) => [primaryKey({ columns: [table.playerId, table.key] })]
);

export const stageUnlocks = sqliteTable(
	'stage_unlocks',
	{
		playerId: text('player_id').notNull().references(() => players.id),
		stageId: integer('stage_id').notNull().references(() => stages.id),
		grantedAt: integer('granted_at').notNull()
	},
	(table) => [primaryKey({ columns: [table.playerId, table.stageId] })]
);

export const attemptTokens = sqliteTable(
	'attempt_tokens',
	{
		id: text('id').primaryKey(),
		playerId: text('player_id').notNull().references(() => players.id),
		exerciseId: integer('exercise_id').references(() => exercises.id),
		generatedContent: text('generated_content'),
		servedAt: integer('served_at').notNull()
	},
	(table) => [index('attempt_tokens_player_served_at_idx').on(table.playerId, table.servedAt)]
);
