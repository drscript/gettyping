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
	wide?: boolean;
	shift?: boolean;
}

const cap = (label: string, keys: TypingKey[], wide = false): KeyboardCap => ({
	label,
	values: keys,
	recordedKeys: keys,
	wide
});

const letterCap = (letter: string): KeyboardCap => cap(letter, [letter as TypingKey]);

export const keyboardCapRows: KeyboardCap[][] = [
	[cap('1 !', ['1', '!']), ...'234567890'.split('').map(letterCap)],
	'qwertyuiop'.split('').map(letterCap),
	[...'asdfghjkl'.split('').map(letterCap), cap('; :', [';', ':']), cap("'", ["'"])],
	[
		{ label: 'shift', values: ['shift'], recordedKeys: [], wide: true, shift: true },
		...'zxcvbnm'.split('').map(letterCap),
		cap(',', [',']),
		cap('.', ['.']),
		cap('/ ?', ['/', '?'])
	],
	[cap('space', [' '], true)]
];

export const keyboardCaps: readonly KeyboardCap[] = keyboardCapRows.flat();

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
