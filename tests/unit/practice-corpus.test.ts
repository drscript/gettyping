import { describe, expect, test } from 'vitest';
import {
	corpus,
	deriveKeySet,
	isPlayable,
	validateEntry,
	type CorpusEntry
} from '../../src/lib/server/practice-corpus';

describe('deriveKeySet', () => {
	test('a lowercase letter contributes itself', () => {
		expect(deriveKeySet('t')).toEqual(new Set(['t']));
	});

	test('a capital letter contributes the letter and shift', () => {
		expect(deriveKeySet('T')).toEqual(new Set(['t', 'shift']));
	});

	test('a digit contributes itself', () => {
		expect(deriveKeySet('7')).toEqual(new Set(['7']));
	});

	test('punctuation contributes itself as-is', () => {
		expect(deriveKeySet(',')).toEqual(new Set([',']));
	});

	test('a space contributes nothing', () => {
		expect(deriveKeySet('a b')).toEqual(new Set(['a', 'b']));
	});

	test('a mixed sentence derives the union of its characters', () => {
		expect(deriveKeySet("Ben's 2 dogs!")).toEqual(
			new Set(['b', 'shift', 'e', 'n', "'", 's', '2', 'd', 'o', 'g', '!'])
		);
	});
});

describe('isPlayable', () => {
	test('true when the derived key set is a subset of the cumulative key set', () => {
		const entry: CorpusEntry = { text: 'fj', kind: 'letters' };
		expect(isPlayable(entry, new Set(['f', 'j', 'g']))).toBe(true);
	});

	test('false when the derived key set includes a key outside the cumulative key set', () => {
		const entry: CorpusEntry = { text: 'fjg', kind: 'letters' };
		expect(isPlayable(entry, new Set(['f', 'j']))).toBe(false);
	});
});

describe('validateEntry', () => {
	test('rejects an entry with a key outside the curriculum key universe', () => {
		expect(() => validateEntry({ text: 'café', kind: 'sentences' })).toThrow(/outside the curriculum key universe/);
	});

	test('rejects an entry with empty text', () => {
		expect(() => validateEntry({ text: '   ', kind: 'sentences' })).toThrow(/empty text/);
	});

	test('accepts a well-formed entry', () => {
		expect(() => validateEntry({ text: "Dad's 2 cats!", kind: 'sentences' })).not.toThrow();
	});
});

describe('the authored corpus', () => {
	test('loads without throwing (every entry validates)', () => {
		expect(corpus.length).toBeGreaterThan(0);
	});

	test('every entry is either letters or sentences kind', () => {
		for (const entry of corpus) {
			expect(['letters', 'sentences']).toContain(entry.kind);
		}
	});
});

// Mirrors the curriculum seeded in drizzle/0000_walking_skeleton.sql — used only to
// verify the corpus meets the density bar, independent of the Practice route (ticket 02).
const stageKeysTaught: Record<number, string[]> = {
	1: ['f', 'j'],
	2: ['g', 'h'],
	3: ['d', 'k'],
	4: ['s', 'l'],
	5: ['a', ';'],
	6: ['r', 'u'],
	7: ['t', 'y'],
	8: ['e', 'i'],
	9: ['w', 'o'],
	10: ['q', 'p'],
	11: ['v', 'n'],
	12: ['b', 'm'],
	13: ['z', 'x', 'c'],
	14: ['shift'],
	15: [',', '.'],
	16: ["'", '?', '!'],
	17: ['1', '0'],
	18: ['2', '9'],
	19: ['3', '8'],
	20: ['4', '7'],
	21: ['5', '6']
};

function cumulativeKeySetThroughStage(stageId: number): Set<string> {
	const keys = new Set<string>();
	for (let stage = 1; stage <= stageId; stage += 1) {
		for (const key of stageKeysTaught[stage]) keys.add(key);
	}
	return keys;
}

function playableCount(kind: CorpusEntry['kind'], stageId: number): number {
	const cumulative = cumulativeKeySetThroughStage(stageId);
	return corpus.filter((entry) => entry.kind === kind && isPlayable(entry, cumulative)).length;
}

describe('corpus density (per-tier sentences additions)', () => {
	test('Stage 5 stands alone at >= 12 sentences', () => {
		expect(playableCount('sentences', 5)).toBeGreaterThanOrEqual(12);
	});

	test('cumulative sentence pool is >= 12 at every Stage from 5 on', () => {
		for (let stage = 5; stage <= 21; stage += 1) {
			expect(playableCount('sentences', stage)).toBeGreaterThanOrEqual(12);
		}
	});

	test('Stages 6-13 each add >= 3 newly-playable sentences', () => {
		for (let stage = 6; stage <= 13; stage += 1) {
			const added = playableCount('sentences', stage) - playableCount('sentences', stage - 1);
			expect(added).toBeGreaterThanOrEqual(3);
		}
	});

	test('Stage 14 adds >= 6 newly-playable sentences (shift/capitals)', () => {
		const added = playableCount('sentences', 14) - playableCount('sentences', 13);
		expect(added).toBeGreaterThanOrEqual(6);
	});

	test('Stages 15-16 each add >= 4 newly-playable sentences', () => {
		for (const stage of [15, 16]) {
			const added = playableCount('sentences', stage) - playableCount('sentences', stage - 1);
			expect(added).toBeGreaterThanOrEqual(4);
		}
	});

	test('Stages 17-21 each add >= 3 newly-playable sentences (digit tiers)', () => {
		for (let stage = 17; stage <= 21; stage += 1) {
			const added = playableCount('sentences', stage) - playableCount('sentences', stage - 1);
			expect(added).toBeGreaterThanOrEqual(3);
		}
	});

	test('capital-bearing sentences are not playable before Stage 14', () => {
		const capitalBearing = corpus.filter(
			(entry) => entry.kind === 'sentences' && /[A-Z]/.test(entry.text)
		);
		expect(capitalBearing.length).toBeGreaterThan(0);
		const cumulativeBefore14 = cumulativeKeySetThroughStage(13);
		for (const entry of capitalBearing) {
			expect(isPlayable(entry, cumulativeBefore14)).toBe(false);
		}
	});

	test('digit-bearing sentences are not playable before their tier', () => {
		const digitBearing = corpus.filter(
			(entry) => entry.kind === 'sentences' && /[0-9]/.test(entry.text)
		);
		expect(digitBearing.length).toBeGreaterThan(0);
		const cumulativeBefore17 = cumulativeKeySetThroughStage(16);
		for (const entry of digitBearing) {
			expect(isPlayable(entry, cumulativeBefore17)).toBe(false);
		}
	});
});

describe('corpus density (letters entries)', () => {
	test('each pre-vowel Stage (1-4) has at least 4 letters entries', () => {
		for (let stage = 1; stage <= 4; stage += 1) {
			const cumulative = cumulativeKeySetThroughStage(stage);
			const previous = cumulativeKeySetThroughStage(stage - 1);
			const newAtThisStage = corpus.filter(
				(entry) =>
					entry.kind === 'letters' && isPlayable(entry, cumulative) && !isPlayable(entry, previous)
			);
			expect(newAtThisStage.length).toBeGreaterThanOrEqual(4);
		}
	});
});

describe('corpus authoring rules', () => {
	test('sentences entries are capped at 8 words', () => {
		for (const entry of corpus) {
			if (entry.kind !== 'sentences') continue;
			expect(entry.text.split(' ').length).toBeLessThanOrEqual(8);
		}
	});

	test('sentences entries are capped at ~40 characters', () => {
		for (const entry of corpus) {
			if (entry.kind !== 'sentences') continue;
			expect(entry.text.length).toBeLessThanOrEqual(40);
		}
	});
});
