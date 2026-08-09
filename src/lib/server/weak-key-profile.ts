import { eq } from 'drizzle-orm';
import type { getDatabase } from './database';
import { weakKeyStats } from './database/schema';

export interface WeakKeyProfileEntry {
	key: string;
	attempts: number;
	errors: number;
	totalLatencyMs: number;
}

export interface ScoredWeakKeyProfileEntry extends WeakKeyProfileEntry {
	weakness: number | null;
}

interface WeakKeyProfileKeystroke {
	expected: string;
	received: string;
	timestampOffsetMs: number;
}

type WeakKeyProfileStore = Pick<ReturnType<typeof getDatabase>, 'select' | 'insert'>;

export function scoreWeakKeyProfile(
	entries: WeakKeyProfileEntry[],
	latencyClampMs: number
): ScoredWeakKeyProfileEntry[] {
	return entries.map((entry) => ({
		...entry,
		weakness:
			entry.attempts < 3
				? null
				: (entry.errors / entry.attempts) * 0.7 +
					(Math.min(latencyClampMs, entry.totalLatencyMs / entry.attempts) /
						latencyClampMs) *
						0.3
	}));
}

export function foldWeakKeyProfile(
	store: WeakKeyProfileStore,
	playerId: string,
	events: WeakKeyProfileKeystroke[],
	configuration: { decayFactor: number; latencyClampMs: number }
): void {
	const entries = new Map(
		store
			.select()
			.from(weakKeyStats)
			.where(eq(weakKeyStats.playerId, playerId))
			.all()
			.map((row) => [row.key, row])
	);
	const touchedKeys = new Set<string>();
	let previousTimestampOffsetMs = 0;

	for (const event of events) {
		const latencyMs = Math.min(
			configuration.latencyClampMs,
			event.timestampOffsetMs - previousTimestampOffsetMs
		);
		previousTimestampOffsetMs = event.timestampOffsetMs;
		if (event.received === 'Backspace') continue;

		const key = event.expected.toLowerCase();
		const previous = entries.get(key) ?? {
			playerId,
			key,
			attempts: 0,
			errors: 0,
			totalLatencyMs: 0
		};
		entries.set(key, {
			...previous,
			attempts: previous.attempts * configuration.decayFactor + 1,
			errors:
				previous.errors * configuration.decayFactor +
				(event.received === event.expected ? 0 : 1),
			totalLatencyMs: previous.totalLatencyMs * configuration.decayFactor + latencyMs
		});
		touchedKeys.add(key);
	}

	for (const key of touchedKeys) {
		const entry = entries.get(key)!;
		store
			.insert(weakKeyStats)
			.values(entry)
			.onConflictDoUpdate({
				target: [weakKeyStats.playerId, weakKeyStats.key],
				set: {
					attempts: entry.attempts,
					errors: entry.errors,
					totalLatencyMs: entry.totalLatencyMs
				}
			})
			.run();
	}
}
