import { isHttpError } from '@sveltejs/kit';
import { describe, expect, test } from 'vitest';
import { generatePracticeContent } from '../../src/lib/server/practice-generation';
import { createSeededRandom, type RandomSource } from '../../src/lib/server/runtime/random';
import type { CorpusEntry } from '../../src/lib/server/practice-corpus';

const fullAlphabet = new Set([...'abcdefghijklmnopqrstuvwxyz']);
const noWeakness = new Map<string, number>();

function randomFor(seed: string): RandomSource {
	return createSeededRandom(seed);
}

describe('generatePracticeContent — sentence mode retirement', () => {
	test('serves sentences entries when any are playable', () => {
		const corpus: CorpusEntry[] = [
			{ text: 'a lad has a rat', kind: 'sentences' },
			{ text: 'a dog naps', kind: 'sentences' },
			{ text: 'fj fj fj fj', kind: 'letters' }
		];
		const content = generatePracticeContent(
			'sentence',
			noWeakness,
			0,
			randomFor('retirement-sentences'),
			corpus,
			fullAlphabet
		);
		expect(content.split(' ')).not.toContain('fj');
	});

	test('falls back to letters entries when no sentences are playable', () => {
		const corpus: CorpusEntry[] = [
			{ text: 'a lad has a rat', kind: 'sentences' },
			{ text: 'fj fj fj fj', kind: 'letters' },
			{ text: 'gh gh gh gh', kind: 'letters' },
			{ text: 'fg gh hg gf', kind: 'letters' },
			{ text: 'ff jj gg hh', kind: 'letters' }
		];
		const content = generatePracticeContent(
			'sentence',
			noWeakness,
			0,
			randomFor('retirement-letters'),
			corpus,
			new Set(['f', 'j', 'g', 'h']) // Stage 2: no vowel yet, no sentences playable
		);
		expect(content).not.toMatch(/[^fghj ]/); // only f, g, h, j and spaces
	});

	test('never mixes sentences and letters entries within one Exercise', () => {
		const corpus: CorpusEntry[] = [
			{ text: 'a lad has a rat', kind: 'sentences' },
			{ text: 'a dog naps', kind: 'sentences' },
			{ text: 'a cat sleeps', kind: 'sentences' },
			{ text: 'fj fj fj fj', kind: 'letters' }
		];
		const content = generatePracticeContent(
			'sentence',
			noWeakness,
			0,
			randomFor('no-mixing'),
			corpus,
			fullAlphabet
		);
		expect(content).not.toContain('fj');
	});
});

describe('generatePracticeContent — sentence mode draw-without-replacement', () => {
	function repeatingCorpus(count: number): CorpusEntry[] {
		return Array.from({ length: count }, (_, index) => ({
			text: String.fromCharCode(97 + index).repeat(3), // 'aaa', 'bbb', 'ccc', ...
			kind: 'sentences' as const
		}));
	}

	test('draws six unique entries when the pool has at least twelve', () => {
		const content = generatePracticeContent(
			'sentence',
			noWeakness,
			0,
			randomFor('no-repeat'),
			repeatingCorpus(12),
			fullAlphabet
		);
		const words = content.split(' ');
		expect(words).toHaveLength(6);
		expect(new Set(words).size).toBe(6);
	});

	test('refills and repeats once a small pool is exhausted mid-draw', () => {
		const content = generatePracticeContent(
			'sentence',
			noWeakness,
			0,
			randomFor('small-pool-repeat'),
			repeatingCorpus(4),
			fullAlphabet
		);
		const words = content.split(' ');
		expect(words).toHaveLength(6);
		expect(new Set(words).size).toBeLessThan(6);
		// Every entry that appears should still come from the 4-entry pool.
		for (const word of words) expect(word).toMatch(/^[abcd]{3}$/);
	});
});

describe('generatePracticeContent — coverage gating', () => {
	test('an entry outside the cumulative key set is never drawn', () => {
		const corpus: CorpusEntry[] = [
			{ text: 'a lad has a rat', kind: 'sentences' }, // no shift
			{ text: 'Dad has a big red van', kind: 'sentences' } // needs shift
		];
		const content = generatePracticeContent(
			'sentence',
			noWeakness,
			0,
			randomFor('coverage-gating'),
			corpus,
			new Set([...'abcdefghijklmnopqrstuvwxyz']) // no shift yet
		);
		expect(content).not.toContain('Dad');
	});
});

describe('generatePracticeContent — weak-key targeting', () => {
	test('forces the first draw to a targeted entry when aggressiveness is 1', () => {
		const corpus: CorpusEntry[] = [
			{ text: 'a rare quiet lad', kind: 'sentences' },
			{ text: 'a dog naps', kind: 'sentences' },
			{ text: 'a cat sleeps', kind: 'sentences' },
			{ text: 'a bird sings', kind: 'sentences' }
		];
		const weaknessByKey = new Map([['q', 1]]);
		const content = generatePracticeContent(
			'sentence',
			weaknessByKey,
			1,
			randomFor('weak-key-targeting'),
			corpus,
			fullAlphabet
		);
		expect(content).toContain('quiet');
	});
});

describe('generatePracticeContent — empty-pool guard', () => {
	test('throws a 503 when the playable pool is empty', () => {
		const corpus: CorpusEntry[] = [{ text: 'Dad has a van', kind: 'sentences' }]; // needs shift
		expect(() =>
			generatePracticeContent(
				'sentence',
				noWeakness,
				0,
				randomFor('empty-pool'),
				corpus,
				new Set([...'abcdefghijklmnopqrstuvwxyz']) // no shift
			)
		).toThrow();

		try {
			generatePracticeContent(
				'sentence',
				noWeakness,
				0,
				randomFor('empty-pool'),
				corpus,
				new Set([...'abcdefghijklmnopqrstuvwxyz'])
			);
			expect.unreachable();
		} catch (thrown) {
			expect(isHttpError(thrown)).toBe(true);
			if (isHttpError(thrown)) {
				expect(thrown.status).toBe(503);
				expect(thrown.body.message).toBe('Practice could not start. Please try again.');
			}
		}
	});
});

describe('generatePracticeContent — bigram mode is unaffected by the Corpus', () => {
	test('still produces 24 space-joined two-letter pairs', () => {
		const content = generatePracticeContent(
			'bigram',
			noWeakness,
			0,
			randomFor('bigram-sanity'),
			[],
			new Set()
		);
		const pairs = content.split(' ');
		expect(pairs).toHaveLength(24);
		for (const pair of pairs) expect(pair).toMatch(/^[a-z]{2}$/);
	});
});
