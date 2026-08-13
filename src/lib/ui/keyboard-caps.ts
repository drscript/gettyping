import type { TypingKey } from './types';

/**
 * One scored entry of the Weak-key heat map on `/history`: the cap's canonical
 * recorded key and its pooled weakness. The server pools, scores and floors per
 * cap; the render only looks heat up. Shared by both sides.
 */
export interface WeakKeyHeatEntry {
	key: TypingKey;
	weakness: number;
}

export type FingerKind = 'pinky' | 'ring' | 'middle' | 'index' | 'thumb';
export type HandSide = 'left' | 'right' | 'both';

/**
 * One physical keycap of the on-screen keyboard. The cap layout is the keyboard's
 * own fact, and both the live keyboard render and the Weak-key heat map (plus the
 * server that pools Profile stats per cap) read it from this single table.
 */
export interface KeyboardCap {
	label: string;
	/** The TypingKey values that highlight this cap as the next key mid-Attempt. */
	values: TypingKey[];
	/**
	 * The raw `weak_key_stats` keys this physical cap pools from. Dual-value caps
	 * cover two recorded keys; shift covers none — it is never an expected
	 * character, so it can never carry Profile data.
	 */
	recordedKeys: TypingKey[];
	finger: FingerKind;
	hand: HandSide;
	/** F and J carry the tactile bump ridge. */
	home?: boolean;
	wide?: boolean;
	shift?: boolean;
}

const cap = (
	label: string,
	keys: TypingKey[],
	finger: FingerKind,
	hand: HandSide,
	wide = false
): KeyboardCap => ({
	label,
	values: keys,
	recordedKeys: keys,
	finger,
	hand,
	wide
});

const letterCap = (letter: string, finger: FingerKind, hand: HandSide, home = false): KeyboardCap => ({
	...cap(letter, [letter as TypingKey], finger, hand),
	...(home ? { home: true } : {})
});

export const keyboardCapRows: KeyboardCap[][] = [
	[
		cap('1 !', ['1', '!'], 'pinky', 'left'),
		letterCap('2', 'ring', 'left'),
		letterCap('3', 'middle', 'left'),
		letterCap('4', 'index', 'left'),
		letterCap('5', 'index', 'left'),
		letterCap('6', 'index', 'right'),
		letterCap('7', 'index', 'right'),
		letterCap('8', 'middle', 'right'),
		letterCap('9', 'ring', 'right'),
		letterCap('0', 'pinky', 'right')
	],
	[
		letterCap('q', 'pinky', 'left'),
		letterCap('w', 'ring', 'left'),
		letterCap('e', 'middle', 'left'),
		letterCap('r', 'index', 'left'),
		letterCap('t', 'index', 'left'),
		letterCap('y', 'index', 'right'),
		letterCap('u', 'index', 'right'),
		letterCap('i', 'middle', 'right'),
		letterCap('o', 'ring', 'right'),
		letterCap('p', 'pinky', 'right')
	],
	[
		letterCap('a', 'pinky', 'left'),
		letterCap('s', 'ring', 'left'),
		letterCap('d', 'middle', 'left'),
		letterCap('f', 'index', 'left', true),
		letterCap('g', 'index', 'left'),
		letterCap('h', 'index', 'right'),
		letterCap('j', 'index', 'right', true),
		letterCap('k', 'middle', 'right'),
		letterCap('l', 'ring', 'right'),
		cap('; :', [';', ':'], 'pinky', 'right'),
		cap("'", ["'"], 'pinky', 'right')
	],
	[
		{
			label: 'shift',
			values: ['shift'],
			recordedKeys: [],
			finger: 'pinky',
			hand: 'left',
			wide: true,
			shift: true
		},
		letterCap('z', 'pinky', 'left'),
		letterCap('x', 'ring', 'left'),
		letterCap('c', 'middle', 'left'),
		letterCap('v', 'index', 'left'),
		letterCap('b', 'index', 'left'),
		letterCap('n', 'index', 'right'),
		letterCap('m', 'index', 'right'),
		cap(',', [','], 'middle', 'right'),
		cap('.', ['.'], 'ring', 'right'),
		cap('/ ?', ['/', '?'], 'pinky', 'right')
	],
	[cap('space', [' '], 'thumb', 'both', true)]
];

export const keyboardCaps: readonly KeyboardCap[] = keyboardCapRows.flat();

/** Spoken finger for a highlighted cap: "left index", "thumbs". */
export function fingerPhrase(cap: KeyboardCap): string {
	if (cap.finger === 'thumb') return 'thumbs';
	return `${cap.hand} ${cap.finger}`;
}

const pipCountByFinger: Record<FingerKind, number> = {
	pinky: 1,
	ring: 2,
	middle: 3,
	index: 4,
	thumb: 0
};

export function pipCountFor(finger: FingerKind): number {
	return pipCountByFinger[finger];
}

/** The recorded key that stands for a cap in pooled Profile data (`1` stands for `1 !`). */
export function canonicalKeyFor(cap: KeyboardCap): TypingKey | undefined {
	return cap.recordedKeys[0];
}

/** Every recorded key mapped onto the physical cap that pools it. */
export const capByRecordedKey: ReadonlyMap<TypingKey, KeyboardCap> = new Map(
	keyboardCaps.flatMap((keyboardCap) =>
		keyboardCap.recordedKeys.map((key) => [key, keyboardCap] as const)
	)
);
