import { randomUUID } from 'node:crypto';
import { and, asc, eq, lt } from 'drizzle-orm';
import type { Cookies } from '@sveltejs/kit';
import { getDatabase } from './database';
import {
	attemptTokens,
	exercises,
	players,
	scores
} from './database/schema';
import { readIdentity } from './identity';
import { getAttemptConfiguration } from './runtime/attempt-configuration';
import { getRuntimeConfiguration } from './runtime/configuration';
import { foldWeakKeyProfile } from './weak-key-profile';

export interface KeystrokeEvent {
	expected: string;
	received: string;
	timestampOffsetMs: number;
}

export interface DerivedScore {
	id: number;
	netWpm: number;
	grossWpm: number;
	accuracy: number;
	elapsedMs: number;
	charCount: number;
	errorCount: number;
}

export type AttemptKind = 'speed-test' | 'practice' | 'learn' | 'stretch';

interface AttemptSubmission {
	token: string;
	events: KeystrokeEvent[];
}

export interface CompletedAttempt {
	score: DerivedScore;
	playerId: string;
	exerciseId: number | null;
	stageId: number | null;
}

type ServedAttempt =
	| { kind: 'fixed'; exerciseId: number }
	| { kind: 'generated'; content: string };

export function createAttemptHandshake(playerId: string, served: ServedAttempt): string {
	const database = getDatabase();
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
			.where(eq(attemptTokens.playerId, playerId))
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
				playerId,
				exerciseId: served.kind === 'fixed' ? served.exerciseId : null,
				generatedContent: served.kind === 'generated' ? served.content : null,
				servedAt
			})
			.run();
	});

	return token;
}

function readSubmission(value: unknown): AttemptSubmission | undefined {
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
): Omit<DerivedScore, 'id'> | undefined {
	if (events.length === 0 || events.length > eventCountCeiling) return undefined;

	let correctKeystrokes = 0;
	let characterCount = 0;
	let errorCount = 0;
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
			continue;
		}

		if ([...event.received].length !== 1 || event.expected !== content[cursor]) return undefined;
		characterCount += 1;
		if (event.received === event.expected) correctKeystrokes += 1;
		else errorCount += 1;
		cursor += 1;
	}

	const elapsedMs = events.at(-1)?.timestampOffsetMs ?? 0;
	if (cursor !== content.length || elapsedMs <= 0 || characterCount === 0) return undefined;
	const elapsedMinutes = elapsedMs / 60_000;
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

function handshakeMatchesKind(
	kind: AttemptKind,
	handshake: { exerciseId: number | null; track: 'learn' | 'speed_test' | null }
): boolean {
	// Practice and Stretch are both generated, non-exercise content and are
	// genuinely indistinguishable at this row's shape (zero schema change,
	// per the Finger-stretch decision) — a token served by one is technically
	// redeemable at the other. Accepted: neither touches Stage progression or
	// a Leaderboard, so the worst case is a scoreless/scored mismatch.
	if (kind === 'practice' || kind === 'stretch') return handshake.exerciseId === null;
	if (kind === 'speed-test') return handshake.track === 'speed_test';
	return handshake.track === 'learn';
}

interface ResolvedAttempt {
	handshake: {
		id: string;
		playerId: string;
		exerciseId: number | null;
		stageId: number | null;
		nickname: string;
		servedAt: number;
	};
	submission: AttemptSubmission;
	derived: Omit<DerivedScore, 'id'>;
}

async function resolveAttempt(
	cookies: Cookies,
	request: Request,
	kind: AttemptKind,
	expectedStageId?: number
): Promise<ResolvedAttempt | undefined> {
	const identity = readIdentity(cookies);
	if (!identity) return undefined;

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return undefined;
	}
	const submission = readSubmission(body);
	if (!submission) return undefined;

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
			generatedContent: attemptTokens.generatedContent,
			content: exercises.content,
			track: exercises.track,
			stageId: exercises.stageId,
			nickname: players.nickname,
			servedAt: attemptTokens.servedAt
		})
		.from(attemptTokens)
		.leftJoin(exercises, eq(exercises.id, attemptTokens.exerciseId))
		.innerJoin(players, eq(players.id, attemptTokens.playerId))
		.where(
			and(
				eq(attemptTokens.id, submission.token),
				eq(attemptTokens.playerId, identity.active)
			)
		)
		.get();
	if (!handshake || !handshakeMatchesKind(kind, handshake)) return undefined;
	if (expectedStageId !== undefined && handshake.stageId !== expectedStageId) return undefined;
	const content = handshake.generatedContent ?? handshake.content;
	if (!content) return undefined;

	const derived = deriveScore(
		content,
		submission.events,
		configuration.eventCountCeiling,
		configuration.tokenTtlMs
	);
	if (!derived) return undefined;

	return { handshake, submission, derived };
}

export async function completeAttempt(
	cookies: Cookies,
	request: Request,
	kind: AttemptKind,
	expectedStageId?: number
): Promise<CompletedAttempt | undefined> {
	const resolved = await resolveAttempt(cookies, request, kind, expectedStageId);
	if (!resolved) return undefined;
	const { handshake, submission, derived } = resolved;

	const database = getDatabase();
	const createdAt = Date.now();
	const observedElapsedMs = createdAt - handshake.servedAt;
	const observedElapsedMinutes = observedElapsedMs / 60_000;
	const observedGrossWpm = derived.charCount / 5 / observedElapsedMinutes;
	const runtime = getRuntimeConfiguration();
	const leaderboardEligible =
		derived.netWpm <= runtime.netWpmCeiling &&
		derived.elapsedMs <= observedElapsedMs &&
		observedGrossWpm <= runtime.netWpmCeiling;

	const inserted = database.transaction((transaction) => {
		transaction.delete(attemptTokens).where(eq(attemptTokens.id, handshake.id)).run();
		const insertedScore = transaction
			.insert(scores)
			.values({
				playerId: handshake.playerId,
				exerciseId: handshake.exerciseId,
				nickname: handshake.nickname,
				...derived,
				leaderboardEligible,
				createdAt
			})
			.returning({ id: scores.id })
			.get();

		foldWeakKeyProfile(transaction, handshake.playerId, submission.events, {
			decayFactor: runtime.weakKeyDecayFactor,
			latencyClampMs: runtime.latencyClampMs
		});

		return insertedScore;
	});

	return {
		score: { id: inserted.id, ...derived },
		playerId: handshake.playerId,
		exerciseId: handshake.exerciseId,
		stageId: handshake.stageId
	};
}

export interface CompletedStretch {
	accuracy: number;
}

export async function completeStretchAttempt(
	cookies: Cookies,
	request: Request
): Promise<CompletedStretch | undefined> {
	const resolved = await resolveAttempt(cookies, request, 'stretch');
	if (!resolved) return undefined;
	const { handshake, submission, derived } = resolved;

	const database = getDatabase();
	const runtime = getRuntimeConfiguration();
	database.transaction((transaction) => {
		transaction.delete(attemptTokens).where(eq(attemptTokens.id, handshake.id)).run();
		foldWeakKeyProfile(transaction, handshake.playerId, submission.events, {
			decayFactor: runtime.weakKeyDecayFactor,
			latencyClampMs: runtime.latencyClampMs
		});
	});

	return { accuracy: derived.accuracy };
}
