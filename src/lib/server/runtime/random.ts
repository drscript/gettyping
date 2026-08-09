export interface RandomSource {
	next: () => number;
}

function seedNumber(seed: string): number {
	let hash = 2166136261;
	for (const character of seed) {
		hash ^= character.codePointAt(0) ?? 0;
		hash = Math.imul(hash, 16777619);
	}
	return hash >>> 0;
}

export function createSeededRandom(seed: string): RandomSource {
	let state = seedNumber(seed);

	return {
		next: () => {
			state = (state + 0x6d2b79f5) >>> 0;
			let value = state;
			value = Math.imul(value ^ (value >>> 15), value | 1);
			value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
			return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
		}
	};
}

export const generationRandom = createSeededRandom(process.env.RANDOM_SEED ?? 'gettyping');
