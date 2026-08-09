import { randomUUID } from 'node:crypto';
import { and, asc, eq, isNotNull, lt } from 'drizzle-orm';
import { error, json } from '@sveltejs/kit';
import { getDatabase } from '$lib/server/database';
import { attemptTokens, exercises, players, scores } from '$lib/server/database/schema';
import { readIdentity } from '$lib/server/identity';
import { getAttemptConfiguration } from '$lib/server/runtime/attempt-configuration';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ cookies }) => {
	const identity = readIdentity(cookies);
	if (!identity) error(401, 'Choose a Nickname before starting the Speed Test');

	const database = getDatabase();
	const player = database
		.select({ id: players.id })
		.from(players)
		.where(eq(players.id, identity.active))
		.get();
	if (!player) error(401, 'Choose a Nickname before starting the Speed Test');

	const exercise = database
		.select({ id: exercises.id, content: exercises.content })
		.from(exercises)
		.where(and(eq(exercises.track, 'speed_test'), isNotNull(exercises.content)))
		.get();
	if (!exercise?.content) error(503, 'The Speed Test is not available');

	const configuration = getAttemptConfiguration();
	const servedAt = Date.now();
	const token = randomUUID();

	database.transaction((transaction) => {
		transaction
			.delete(attemptTokens)
			.where(lt(attemptTokens.servedAt, servedAt - configuration.tokenTtlMs))
			.run();

		const outstanding = transaction
			.select({ id: attemptTokens.id })
			.from(attemptTokens)
			.where(eq(attemptTokens.playerId, player.id))
			.orderBy(asc(attemptTokens.servedAt))
			.all();

		const excess = outstanding.length - configuration.outstandingTokenCap + 1;
		for (const staleToken of outstanding.slice(0, Math.max(0, excess))) {
			transaction.delete(attemptTokens).where(eq(attemptTokens.id, staleToken.id)).run();
		}

		transaction
			.insert(attemptTokens)
			.values({
				id: token,
				playerId: player.id,
				exerciseId: exercise.id,
				servedAt
			})
			.run();
	});

	return json({ token, exercise });
};

interface KeystrokeEvent {
	expected: string;
	received: string;
	timestampOffsetMs: number;
}

function invalidAttemptResponse(): Response {
	return json({ message: 'This Attempt could not be submitted.' }, { status: 400 });
}

function readSubmission(value: unknown): { token: string; events: KeystrokeEvent[] } | undefined {
	if (!value || typeof value !== 'object') return undefined;
	const submission = value as { token?: unknown; events?: unknown };
	if (typeof submission.token !== 'string' || !Array.isArray(submission.events)) return undefined;

	const events = submission.events.filter(
		(event): event is KeystrokeEvent =>
			Boolean(event) &&
			typeof event === 'object' &&
			typeof (event as KeystrokeEvent).expected === 'string' &&
			typeof (event as KeystrokeEvent).received === 'string' &&
			typeof (event as KeystrokeEvent).timestampOffsetMs === 'number'
	);
	if (events.length !== submission.events.length) return undefined;

	return { token: submission.token, events };
}

function deriveScore(
	content: string,
	events: KeystrokeEvent[],
	eventCountCeiling: number,
	maximumTimestampOffsetMs: number
) {
	if (events.length === 0 || events.length > eventCountCeiling) return undefined;

	const finalCharacters: string[] = [];
	let correctKeystrokes = 0;
	let characterCount = 0;
	let cursor = 0;
	let previousTimestamp = -1;

	for (const event of events) {
		if (
			!Number.isFinite(event.timestampOffsetMs) ||
			event.timestampOffsetMs < 0 ||
			event.timestampOffsetMs > maximumTimestampOffsetMs ||
			event.timestampOffsetMs < previousTimestamp
		) {
			return undefined;
		}
		previousTimestamp = event.timestampOffsetMs;

		if (event.received === 'Backspace') {
			if (cursor === 0 || event.expected !== content[cursor - 1]) return undefined;
			cursor -= 1;
			finalCharacters.pop();
			continue;
		}

		if ([...event.received].length !== 1 || event.expected !== content[cursor]) return undefined;
		characterCount += 1;
		if (event.received === event.expected) correctKeystrokes += 1;
		finalCharacters.push(event.received);
		cursor += 1;
	}

	const elapsedMs = events.at(-1)?.timestampOffsetMs ?? 0;
	if (cursor !== content.length || elapsedMs <= 0 || characterCount === 0) return undefined;
	const elapsedMinutes = elapsedMs / 60_000;
	const errorCount = finalCharacters.reduce(
		(total, character, index) => total + (character === content[index] ? 0 : 1),
		0
	);
	const grossWpm = characterCount / 5 / elapsedMinutes;
	const netWpm = Math.max(0, grossWpm - errorCount / elapsedMinutes);

	return {
		netWpm,
		grossWpm,
		accuracy: correctKeystrokes / characterCount,
		elapsedMs,
		charCount: characterCount,
		errorCount
	};
}

export const POST: RequestHandler = async ({ cookies, request }) => {
	const identity = readIdentity(cookies);
	if (!identity) return invalidAttemptResponse();

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return invalidAttemptResponse();
	}
	const submission = readSubmission(body);
	if (!submission) return invalidAttemptResponse();

	const database = getDatabase();
	const configuration = getAttemptConfiguration();
	database
		.delete(attemptTokens)
		.where(lt(attemptTokens.servedAt, Date.now() - configuration.tokenTtlMs))
		.run();
	const handshake = database
		.select({
			id: attemptTokens.id,
			playerId: attemptTokens.playerId,
			exerciseId: attemptTokens.exerciseId,
			content: exercises.content,
			nickname: players.nickname
		})
		.from(attemptTokens)
		.innerJoin(exercises, eq(exercises.id, attemptTokens.exerciseId))
		.innerJoin(players, eq(players.id, attemptTokens.playerId))
		.where(
			and(
				eq(attemptTokens.id, submission.token),
				eq(attemptTokens.playerId, identity.active),
				eq(exercises.track, 'speed_test')
			)
		)
		.get();
	if (!handshake?.content || handshake.exerciseId === null) return invalidAttemptResponse();

	const derived = deriveScore(
		handshake.content,
		submission.events,
		configuration.eventCountCeiling,
		configuration.tokenTtlMs
	);
	if (!derived) return invalidAttemptResponse();
	const createdAt = Date.now();
	const inserted = database.transaction((transaction) => {
		transaction.delete(attemptTokens).where(eq(attemptTokens.id, handshake.id)).run();
		return transaction
			.insert(scores)
			.values({
				playerId: handshake.playerId,
				exerciseId: handshake.exerciseId,
				nickname: handshake.nickname,
				...derived,
				leaderboardEligible: true,
				createdAt
			})
			.returning({ id: scores.id })
			.get();
	});

	return json({ score: { id: inserted.id, ...derived } });
};
