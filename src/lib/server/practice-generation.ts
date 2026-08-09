import type { RandomSource } from './runtime/random';

export type PracticeMode = 'word-bank' | 'bigram';

const alphabet = [...'abcdefghijklmnopqrstuvwxyz'];
const wordBank = [
	'apple',
	'badge',
	'bright',
	'calm',
	'chair',
	'cloud',
	'dance',
	'dream',
	'flame',
	'fresh',
	'giant',
	'green',
	'happy',
	'jolly',
	'jump',
	'kind',
	'light',
	'magic',
	'mouse',
	'night',
	'ocean',
	'plant',
	'quick',
	'quiet',
	'river',
	'smile',
	'space',
	'storm',
	'tiger',
	'train',
	'under',
	'vivid',
	'water',
	'whale',
	'extra',
	'yellow',
	'zebra',
	'zip'
];

function choose<T>(values: T[], random: RandomSource): T {
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

function generationPool(
	allValues: string[],
	targetedValues: string[],
	targetingAggressiveness: number,
	random: RandomSource
): string[] {
	return targetedValues.length > 0 && random.next() < targetingAggressiveness
		? targetedValues
		: allValues;
}

function generateWordBank(
	weaknessByKey: ReadonlyMap<string, number>,
	targetingAggressiveness: number,
	random: RandomSource
): string {
	const targets = weakestKeys(weaknessByKey);
	const targetedWords = wordBank.filter((word) => targets.some((key) => word.includes(key)));
	return Array.from({ length: 16 }, () =>
		choose(generationPool(wordBank, targetedWords, targetingAggressiveness, random), random)
	).join(' ');
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

export function generatePracticeContent(
	mode: PracticeMode,
	weaknessByKey: ReadonlyMap<string, number>,
	targetingAggressiveness: number,
	random: RandomSource
): string {
	return mode === 'word-bank'
		? generateWordBank(weaknessByKey, targetingAggressiveness, random)
		: generateBigrams(weaknessByKey, targetingAggressiveness, random);
}
