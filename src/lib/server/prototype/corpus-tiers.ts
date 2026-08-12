// PROTOTYPE — throwaway corpus for wayfinder ticket #39 (map #36).
//
// Question being answered: before quality rules are written, do the earliest
// corpus tiers read as intentional? The pre-vowel era ({f,j} through the first
// adjacent-key tiers) has no real words — do drill lines feel deliberate rather
// than broken? And once vowels land (~Stage 5-9), do the first real sentences
// feel readable for young beginners?
//
// The shape mirrors the locked decisions: a typed TS module exporting sentence
// entries (no stored key-set field); coverage derived from the characters —
// a capital contributes letter + `shift`, digits/punctuation contribute
// themselves, spaces contribute nothing; an entry is playable iff its derived
// key set is a subset of the Player's cumulative key set.
//
// NOTE surfaced while authoring: every sentence-final period or internal comma
// is a taught key (Stage 15), so early entries carry NO punctuation at all.
// That consequence is deliberate here — it's a reaction point for the ticket.

export interface CorpusEntry {
	text: string;
}

export const earlyTierCorpus: CorpusEntry[] = [
	// --- Pre-vowel era: Stage 1 {f, j} — pure home-position drills ---
	{ text: 'fj fj fj fj' },
	{ text: 'ff jj ff jj' },
	{ text: 'jf fj jf fj' },
	{ text: 'ffj jfj ffj jfj' },
	{ text: 'fjf fjf jfj jfj' },

	// --- Stage 2 adds {g, h} — first adjacent pairs ---
	{ text: 'fg gh hg gf' },
	{ text: 'fj gh fj gh' },
	{ text: 'gg hh fg gh' },
	{ text: 'ghj ghj jhg jhg' },

	// --- Stage 3 adds {d, k} ---
	{ text: 'fj gh dk fj' },
	{ text: 'dd kk dk kd' },
	{ text: 'jdk kdf jdk kdf' },
	{ text: 'fjdk fjdk dkgh dkgh' },

	// --- Stage 4 adds {s, l} ---
	{ text: 'fjgh dk sl fjgh' },
	{ text: 'ss ll sl ls' },
	{ text: 'dsl lsd dsl lsd' },
	{ text: 'sl fj dk gh sl fj' },

	// --- Stage 5 adds {a, ;} — the first vowel; drills give way to words ---
	{ text: 'dad dad dad dad' },
	{ text: 'a glad lass' },
	{ text: 'dad has a flag' },
	{ text: 'ask a lad' },
	{ text: 'a sad lad' },
	{ text: 'glass ash salad' },
	{ text: 'lad ask dad' },

	// --- Stage 6 adds {r, u} ---
	{ text: 'a guru drags a rug' },
	{ text: 'dad has a jar' },
	{ text: 'a dark dusk' },
	{ text: 'lads rush' },
	{ text: 'rural lads' },
	{ text: 'fur rug jar' },

	// --- Stage 7 adds {t, y} ---
	{ text: 'a gray day' },
	{ text: 'dad stays' },
	{ text: 'a dusty rug' },
	{ text: 'a rusty jar' },
	{ text: 'tasty salad' },
	{ text: 'stray lads' },

	// --- Stage 8 adds {e, i} ---
	{ text: 'a tired lad' },
	{ text: 'she sees fire' },
	{ text: 'free fries' },
	{ text: 'the red jar' },
	{ text: 'the field is red' },
	{ text: 'she tried' },

	// --- Stage 9 adds {w, o} — just past vowels ---
	{ text: 'we saw a frog' },
	{ text: 'the owl flew' },
	{ text: 'a slow glow' },
	{ text: 'the wood is wet' },
	{ text: 'we saw two frogs' },
	{ text: 'the tower glows' },

	// --- Stage 14 adds {shift} — capitals gate on here ---
	{ text: 'The owl flew at dusk' },
	{ text: 'She saw a red jar' },
	{ text: 'Dad tried a rusty salad' }
];

export function derivedKeySet(text: string): Set<string> {
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

export function playablePool(
	corpus: CorpusEntry[],
	cumulativeKeys: ReadonlySet<string>
): CorpusEntry[] {
	return corpus.filter((entry) => {
		for (const key of derivedKeySet(entry.text)) {
			if (!cumulativeKeys.has(key)) return false;
		}
		return true;
	});
}

export function assembleExercise(
	pool: CorpusEntry[],
	count: number,
	random: { next: () => number }
): string {
	if (pool.length === 0) throw new Error('empty pool — corpus does not cover this Player');
	const remaining = pool.map((entry) => entry.text);
	const picks: string[] = [];
	for (let i = 0; i < count; i++) {
		if (remaining.length === 0) remaining.push(...pool.map((entry) => entry.text));
		const index = Math.floor(random.next() * remaining.length);
		picks.push(remaining.splice(index, 1)[0]);
	}
	return picks.join(' ');
}

// Cumulative key sets for the Player cases this prototype drives.
// Mirrors readStageList's cleared+current fold for Stages 1..N.
export const playerCases = [
	{
		name: 'Stage 1 — just {f, j}',
		keys: new Set(['f', 'j'])
	},
	{
		name: 'Stage 3 — {f, j, g, h, d, k}',
		keys: new Set(['f', 'j', 'g', 'h', 'd', 'k'])
	},
	{
		name: 'Stage 9 — just past vowels',
		keys: new Set([
			'f', 'j', 'g', 'h', 'd', 'k', 's', 'l',
			'a', ';', 'r', 'u', 't', 'y', 'e', 'i', 'w', 'o'
		])
	},
	{
		name: 'Stage 14 — all letters + shift',
		keys: new Set([...'abcdefghijklmnopqrstuvwxyz', 'shift'])
	}
];
