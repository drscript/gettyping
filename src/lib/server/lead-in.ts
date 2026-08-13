import { eq } from 'drizzle-orm';
import type { getDatabase } from './database';
import { weakKeyStats } from './database/schema';
import { keysTaughtByStage } from './stage-progress';
import { getRuntimeConfiguration } from './runtime/configuration';
import { scoreWeakKeyProfile } from './weak-key-profile';

type Database = ReturnType<typeof getDatabase>;

export function curriculumKeySetThrough(
	taughtByStage: ReadonlyMap<number, string[]>,
	stageId: number
): Set<string> {
	const keys = new Set<string>();
	for (let id = 1; id <= stageId; id += 1) {
		for (const key of taughtByStage.get(id) ?? []) {
			keys.add(key);
		}
	}
	return keys;
}

export function leadInWeaknessMap(
	database: Database,
	playerId: string,
	allowedKeys: ReadonlySet<string>
): Map<string, number> {
	const profile = scoreWeakKeyProfile(
		database
			.select({
				key: weakKeyStats.key,
				attempts: weakKeyStats.attempts,
				errors: weakKeyStats.errors,
				totalLatencyMs: weakKeyStats.totalLatencyMs
			})
			.from(weakKeyStats)
			.where(eq(weakKeyStats.playerId, playerId))
			.all(),
		getRuntimeConfiguration().latencyClampMs
	);
	return new Map(
		profile.flatMap(({ key, weakness }) =>
			weakness === null || !allowedKeys.has(key) ? [] : [[key, weakness] as const]
		)
	);
}

export function shouldOfferLeadIn(database: Database, playerId: string, stageId: number): boolean {
	if (!Number.isInteger(stageId) || stageId < 2) return false;
	if (stageId >= 5) return true;

	const previousKeys = curriculumKeySetThrough(keysTaughtByStage(database), stageId - 1);
	return leadInWeaknessMap(database, playerId, previousKeys).size > 0;
}
