import { error } from '@sveltejs/kit';
import { deriveKeySet, isPlayable, type CorpusEntry } from './practice-corpus';
import type { RandomSource } from './runtime/random';

export type PracticeMode = 'sentence' | 'bigram';

const alphabet = [...'abcdefghijklmnopqrstuvwxyz'];
const sentenceDrawCount = 6;

function choose<T>(values: readonly T[], random: RandomSource): T {
	return values[Math.floor(random.next() * values.length)] ?? values[0];
}

function weakestKeys(weaknessByKey: ReadonlyMap<string, number>): string[] {
	const rankedKeys = [...weaknessByKey.entries()]
		.filter(([key]) => alphabet.includes(key))
		.sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
	const highestWeakness = rankedKeys[0]?.[1];
	if (highestWeakness === undefined) return [];
	return rankedKeys
		.filter(([, weakness]) => weakness === highestWeakness)
		.map(([key]) => key);
}

function generationPool<T>(
	allValues: readonly T[],
	targetedValues: readonly T[],
	targetingAggressiveness: number,
	random: RandomSource
): readonly T[] {
	return targetedValues.length > 0 && random.next() < targetingAggressiveness
		? targetedValues
		: allValues;
}

function generateBigrams(
	weaknessByKey: ReadonlyMap<string, number>,
	targetingAggressiveness: number,
	random: RandomSource
): string {
	const targets = weakestKeys(weaknessByKey);
	return Array.from({ length: 24 }, () => {
		const first = choose(generationPool(alphabet, targets, targetingAggressiveness, random), random);
		const second = choose(generationPool(alphabet, targets, targetingAggressiveness, random), random);
		return `${first}${second}`;
	}).join(' ');
}

function drawEntries(
	pool: readonly CorpusEntry[],
	targets: readonly string[],
	count: number,
	targetingAggressiveness: number,
	random: RandomSource
): CorpusEntry[] {
	const targetedPool = pool.filter((entry) =>
		targets.some((key) => deriveKeySet(entry.text).has(key))
	);
	let remaining = [...pool];
	const drawn: CorpusEntry[] = [];
	for (let index = 0; index < count; index += 1) {
		if (remaining.length === 0) remaining = [...pool];
		const targetedRemaining = targetedPool.filter((entry) => remaining.includes(entry));
		const chosen = choose(
			generationPool(remaining, targetedRemaining, targetingAggressiveness, random),
			random
		);
		remaining = remaining.filter((entry) => entry !== chosen);
		drawn.push(chosen);
	}
	return drawn;
}

function generateSentences(
	corpus: readonly CorpusEntry[],
	cumulativeKeySet: ReadonlySet<string>,
	weaknessByKey: ReadonlyMap<string, number>,
	targetingAggressiveness: number,
	random: RandomSource
): string {
	const playableSentences = corpus.filter(
		(entry) => entry.kind === 'sentences' && isPlayable(entry, cumulativeKeySet)
	);
	const playableLetters = corpus.filter(
		(entry) => entry.kind === 'letters' && isPlayable(entry, cumulativeKeySet)
	);
	const pool = playableSentences.length > 0 ? playableSentences : playableLetters;
	if (pool.length === 0) error(503, 'Practice could not start. Please try again.');

	const targets = weakestKeys(weaknessByKey);
	return drawEntries(pool, targets, sentenceDrawCount, targetingAggressiveness, random)
		.map((entry) => entry.text)
		.join(' ');
}

export function generatePracticeContent(
	mode: PracticeMode,
	weaknessByKey: ReadonlyMap<string, number>,
	targetingAggressiveness: number,
	random: RandomSource,
	corpus: readonly CorpusEntry[],
	cumulativeKeySet: ReadonlySet<string>
): string {
	return mode === 'sentence'
		? generateSentences(corpus, cumulativeKeySet, weaknessByKey, targetingAggressiveness, random)
		: generateBigrams(weaknessByKey, targetingAggressiveness, random);
}
