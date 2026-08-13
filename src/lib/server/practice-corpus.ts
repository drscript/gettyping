export interface CorpusEntry {
	text: string;
	kind: 'letters' | 'sentences';
}

const punctuationUniverse = [';', ',', '.', "'", '?', '!'];

const curriculumKeyUniverse: ReadonlySet<string> = new Set([
	...'abcdefghijklmnopqrstuvwxyz',
	'shift',
	...'0123456789',
	...punctuationUniverse
]);

export function deriveKeySet(text: string): ReadonlySet<string> {
	const keys = new Set<string>();
	for (const character of text) {
		if (character === ' ') continue;
		if (character >= 'A' && character <= 'Z') {
			keys.add(character.toLowerCase());
			keys.add('shift');
			continue;
		}
		keys.add(character);
	}
	return keys;
}

export function isPlayable(entry: CorpusEntry, cumulativeKeySet: ReadonlySet<string>): boolean {
	for (const key of deriveKeySet(entry.text)) {
		if (!cumulativeKeySet.has(key)) return false;
	}
	return true;
}

export function validateEntry(entry: CorpusEntry): void {
	if (entry.text.trim().length === 0) {
		throw new Error(`Corpus entry has empty text (kind: ${entry.kind})`);
	}
	for (const key of deriveKeySet(entry.text)) {
		if (!curriculumKeyUniverse.has(key)) {
			throw new Error(
				`Corpus entry "${entry.text}" derives key "${key}", which is outside the curriculum key universe`
			);
		}
	}
}

// --- Stage 1: {f, j} ---
const stage1: CorpusEntry[] = [
	{ text: 'fj fj fj fj', kind: 'letters' },
	{ text: 'ff jj ff jj', kind: 'letters' },
	{ text: 'jf fj jf fj', kind: 'letters' },
	{ text: 'ffj jfj ffj jfj', kind: 'letters' }
];

// --- Stage 2 adds {g, h} ---
const stage2: CorpusEntry[] = [
	{ text: 'fg gh hg gf', kind: 'letters' },
	{ text: 'fj gh fj gh', kind: 'letters' },
	{ text: 'gg hh fg gh', kind: 'letters' },
	{ text: 'ghj ghj jhg jhg', kind: 'letters' }
];

// --- Stage 3 adds {d, k} ---
const stage3: CorpusEntry[] = [
	{ text: 'fj gh dk fj', kind: 'letters' },
	{ text: 'dd kk dk kd', kind: 'letters' },
	{ text: 'jdk kdf jdk kdf', kind: 'letters' },
	{ text: 'fjdk fjdk dkgh dkgh', kind: 'letters' }
];

// --- Stage 4 adds {s, l} ---
const stage4: CorpusEntry[] = [
	{ text: 'fjgh dk sl fjgh', kind: 'letters' },
	{ text: 'ss ll sl ls', kind: 'letters' },
	{ text: 'dsl lsd dsl lsd', kind: 'letters' },
	{ text: 'sl fj dk gh sl fj', kind: 'letters' }
];

// --- Stage 5 adds {a, ;} — the first vowel; sentences begin here ---
const stage5: CorpusEntry[] = [
	{ text: 'dad has a flag', kind: 'sentences' },
	{ text: 'a lad has a flag', kind: 'sentences' },
	{ text: 'a lass has a flag', kind: 'sentences' },
	{ text: 'dad has a glass flask', kind: 'sentences' },
	{ text: 'a glad lad has a flag', kind: 'sentences' },
	{ text: 'a sad lass asks dad', kind: 'sentences' },
	{ text: 'dad asks a glad lad', kind: 'sentences' },
	{ text: 'a lass has a salad', kind: 'sentences' },
	{ text: 'dad has a salad', kind: 'sentences' },
	{ text: 'a sad dad has a flask', kind: 'sentences' },
	{ text: 'a glad gal has a flag', kind: 'sentences' },
	{ text: 'a lass has half a salad', kind: 'sentences' }
];

// --- Stage 6 adds {r, u} ---
const stage6: CorpusEntry[] = [
	{ text: 'a lad has a jug', kind: 'sentences' },
	{ text: 'dad has a rug', kind: 'sentences' },
	{ text: 'a lass hugs dad', kind: 'sentences' },
	{ text: 'a lad drags a rug', kind: 'sentences' }
];

// --- Stage 7 adds {t, y} ---
const stage7: CorpusEntry[] = [
	{ text: 'a rat has a flag', kind: 'sentences' },
	{ text: 'dad has a dusty rug', kind: 'sentences' },
	{ text: 'a lass has a salty salad', kind: 'sentences' },
	{ text: 'a lad has a gray rat', kind: 'sentences' }
];

// --- Stage 8 adds {e, i} ---
const stage8: CorpusEntry[] = [
	{ text: 'a kid has a kite', kind: 'sentences' },
	{ text: 'dad likes a red kite', kind: 'sentences' },
	{ text: 'a girl feeds a deer', kind: 'sentences' },
	{ text: 'a girl has a fish', kind: 'sentences' },
	{ text: 'a lad hides a red gift', kind: 'sentences' },
	{ text: 'a kid feels tired', kind: 'sentences' }
];

// --- Stage 9 adds {w, o} ---
const stage9: CorpusEntry[] = [
	{ text: 'a dog digs a hole', kind: 'sentences' },
	{ text: 'a wolf rests at a tree', kind: 'sentences' },
	{ text: 'a dog is old', kind: 'sentences' },
	{ text: 'a girl took a slow walk', kind: 'sentences' }
];

// --- Stage 10 adds {q, p} ---
const stage10: CorpusEntry[] = [
	{ text: 'a pig has a pet dog', kind: 'sentences' },
	{ text: 'a puppy likes to hop', kind: 'sentences' },
	{ text: 'dad helps a tired girl', kind: 'sentences' },
	{ text: 'a girl keeps a quiet pet', kind: 'sentences' }
];

// --- Stage 11 adds {v, n} ---
const stage11: CorpusEntry[] = [
	{ text: 'a dog runs in the rain', kind: 'sentences' },
	{ text: 'a girl plants a garden', kind: 'sentences' },
	{ text: 'dad drives a van', kind: 'sentences' },
	{ text: 'a hen sits on a nest', kind: 'sentences' },
	{ text: 'the sun is hot', kind: 'sentences' }
];

// --- Stage 12 adds {b, m} ---
const stage12: CorpusEntry[] = [
	{ text: 'mom bakes a berry pie', kind: 'sentences' },
	{ text: 'a bear digs in the mud', kind: 'sentences' },
	{ text: 'a bird sits on a barn', kind: 'sentences' },
	{ text: 'the family rests on a warm farm', kind: 'sentences' },
	{ text: 'a boy and a girl jump in mud', kind: 'sentences' }
];

// --- Stage 13 adds {z, x, c} — full lowercase alphabet from here ---
const stage13: CorpusEntry[] = [
	{ text: 'a cat naps by a warm fire', kind: 'sentences' },
	{ text: 'a fox digs by a barn', kind: 'sentences' },
	{ text: 'a zebra runs at the zoo', kind: 'sentences' },
	{ text: 'a duck naps in a box', kind: 'sentences' },
	{ text: 'the bee buzzes near a hive', kind: 'sentences' }
];

// --- Stage 14 adds {shift} — capitalization ---
const stage14: CorpusEntry[] = [
	{ text: 'Dad has a big red van', kind: 'sentences' },
	{ text: 'Ben digs a hole in the yard', kind: 'sentences' },
	{ text: 'Sam and Kim jump in the mud', kind: 'sentences' },
	{ text: 'The dog naps by the warm fire', kind: 'sentences' },
	{ text: 'A big bear rests near the barn', kind: 'sentences' },
	{ text: 'Gus the cat sleeps all day', kind: 'sentences' },
	{ text: 'Jill likes a soft blue rug', kind: 'sentences' }
];

// --- Stage 15 adds {',', '.'} ---
const stage15: CorpusEntry[] = [
	{ text: 'The cat sat on the mat.', kind: 'sentences' },
	{ text: 'A bird flew over the barn.', kind: 'sentences' },
	{ text: 'Dad naps, but Mom works.', kind: 'sentences' },
	{ text: 'The sun set behind the hill.', kind: 'sentences' },
	{ text: 'A fox hid under the porch.', kind: 'sentences' }
];

// --- Stage 16 adds {"'", '?', '!'} ---
const stage16: CorpusEntry[] = [
	{ text: 'Can we go to the park?', kind: 'sentences' },
	{ text: 'What a big frog!', kind: 'sentences' },
	{ text: "It's a sunny day.", kind: 'sentences' },
	{ text: "Don't wake the baby!", kind: 'sentences' },
	{ text: 'Where did the dog go?', kind: 'sentences' }
];

// --- Stage 17 adds {1, 0} ---
const stage17: CorpusEntry[] = [
	{ text: 'The farm has 10 hens.', kind: 'sentences' },
	{ text: 'Dad counted 1 red bird.', kind: 'sentences' },
	{ text: 'We saw 10 ducks at the pond.', kind: 'sentences' },
	{ text: "It is 10 o'clock now.", kind: 'sentences' }
];

// --- Stage 18 adds {2, 9} ---
const stage18: CorpusEntry[] = [
	{ text: 'Mom baked 2 warm pies.', kind: 'sentences' },
	{ text: 'The bus holds 29 kids.', kind: 'sentences' },
	{ text: 'I saw 9 geese by the pond.', kind: 'sentences' },
	{ text: 'Gus is 2 years old today.', kind: 'sentences' }
];

// --- Stage 19 adds {3, 8} ---
const stage19: CorpusEntry[] = [
	{ text: 'We fed 3 hungry goats.', kind: 'sentences' },
	{ text: 'The bird laid 8 tiny eggs.', kind: 'sentences' },
	{ text: 'Dad planted 38 small seeds.', kind: 'sentences' },
	{ text: 'Kim is 8 years old.', kind: 'sentences' }
];

// --- Stage 20 adds {4, 7} ---
const stage20: CorpusEntry[] = [
	{ text: 'The barn had 4 gray cats.', kind: 'sentences' },
	{ text: 'We walked 7 miles today.', kind: 'sentences' },
	{ text: 'Mom bought 47 fresh apples.', kind: 'sentences' },
	{ text: 'The clock struck 7 at last.', kind: 'sentences' }
];

// --- Stage 21 adds {5, 6} ---
const stage21: CorpusEntry[] = [
	{ text: 'The pond had 6 white ducks.', kind: 'sentences' },
	{ text: 'Ben found 5 shiny rocks.', kind: 'sentences' },
	{ text: 'We baked 56 tiny muffins.', kind: 'sentences' },
	{ text: 'Gus napped for 6 long hours.', kind: 'sentences' }
];

export const corpus: readonly CorpusEntry[] = [
	...stage1,
	...stage2,
	...stage3,
	...stage4,
	...stage5,
	...stage6,
	...stage7,
	...stage8,
	...stage9,
	...stage10,
	...stage11,
	...stage12,
	...stage13,
	...stage14,
	...stage15,
	...stage16,
	...stage17,
	...stage18,
	...stage19,
	...stage20,
	...stage21
];

for (const entry of corpus) validateEntry(entry);
