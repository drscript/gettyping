import type { RandomSource } from './runtime/random';

const authoredRunLength = 8;
const authoredPairLength = 16;
const minimumRepeats = 2;

function shuffled<T>(values: readonly T[], random: RandomSource): T[] {
	const array = [...values];
	for (let index = array.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(random.next() * (index + 1));
		[array[index], array[swapIndex]] = [array[swapIndex], array[index]];
	}
	return array;
}

function cumulativeKeys(
	keysTaughtByStage: ReadonlyMap<number, string[]>,
	throughStageId: number
): string[] {
	const keys: string[] = [];
	for (let stageId = 1; stageId <= throughStageId; stageId += 1) {
		for (const key of keysTaughtByStage.get(stageId) ?? []) {
			if (key !== 'shift') keys.push(key);
		}
	}
	return keys;
}

function newKeyPool(
	stageId: number,
	keysTaughtByStage: ReadonlyMap<number, string[]>
): { pool: string[]; capitalize: boolean } {
	const ownKeys = (keysTaughtByStage.get(stageId) ?? []).filter((key) => key !== 'shift');
	if (ownKeys.length > 0) return { pool: ownKeys, capitalize: false };

	// A Stage that teaches only `shift` (Stage 14) has no drawable key of its
	// own — the stretch instead capitalizes the previous Stage's keys, since
	// capitalization is the actual skill being reinforced.
	const previousKeys = (keysTaughtByStage.get(stageId - 1) ?? []).filter((key) => key !== 'shift');
	return { pool: previousKeys, capitalize: true };
}

export function generateFingerStretchContent(
	stageId: number,
	keysTaughtByStage: ReadonlyMap<number, string[]>,
	lengthFactor: number,
	random: RandomSource
): string {
	const { pool: rawPool, capitalize } = newKeyPool(stageId, keysTaughtByStage);
	const pool = shuffled(rawPool, random);
	const render = (character: string) => (capitalize ? character.toUpperCase() : character);
	const runLength = Math.max(minimumRepeats, Math.round(authoredRunLength * lengthFactor));
	const pairLength = Math.max(minimumRepeats, Math.round(authoredPairLength * lengthFactor));

	const runs = pool.map((key) => render(key).repeat(runLength)).join(' ');
	const pairs = Array.from({ length: pairLength }, (_, index) =>
		render(pool[index % pool.length])
	).join('');
	const anchor = cumulativeKeys(keysTaughtByStage, stageId - 1).join('');

	// runs → pairs → anchor → pairs, the authored block grammar. Stage 1 has
	// no anchor to draw on — the anchor and one of its two surrounding spaces
	// drop, but both pair-blocks survive.
	return anchor.length > 0 ? `${runs} ${pairs} ${anchor} ${pairs}` : `${runs} ${pairs} ${pairs}`;
}
