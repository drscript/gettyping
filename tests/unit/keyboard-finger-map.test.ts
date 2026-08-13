import { describe, expect, test } from 'vitest';
import { keyboardCaps, type FingerKind, type HandSide } from '../../src/lib/ui/keyboard-caps';

/** Spec table: finger assignment per cap label. Independent of how the table is stored. */
const expectedFingerByLabel: Record<string, { finger: FingerKind; hand: HandSide }> = {
	'1 !': { finger: 'pinky', hand: 'left' },
	'2': { finger: 'ring', hand: 'left' },
	'3': { finger: 'middle', hand: 'left' },
	'4': { finger: 'index', hand: 'left' },
	'5': { finger: 'index', hand: 'left' },
	'6': { finger: 'index', hand: 'right' },
	'7': { finger: 'index', hand: 'right' },
	'8': { finger: 'middle', hand: 'right' },
	'9': { finger: 'ring', hand: 'right' },
	'0': { finger: 'pinky', hand: 'right' },
	q: { finger: 'pinky', hand: 'left' },
	w: { finger: 'ring', hand: 'left' },
	e: { finger: 'middle', hand: 'left' },
	r: { finger: 'index', hand: 'left' },
	t: { finger: 'index', hand: 'left' },
	y: { finger: 'index', hand: 'right' },
	u: { finger: 'index', hand: 'right' },
	i: { finger: 'middle', hand: 'right' },
	o: { finger: 'ring', hand: 'right' },
	p: { finger: 'pinky', hand: 'right' },
	a: { finger: 'pinky', hand: 'left' },
	s: { finger: 'ring', hand: 'left' },
	d: { finger: 'middle', hand: 'left' },
	f: { finger: 'index', hand: 'left' },
	g: { finger: 'index', hand: 'left' },
	h: { finger: 'index', hand: 'right' },
	j: { finger: 'index', hand: 'right' },
	k: { finger: 'middle', hand: 'right' },
	l: { finger: 'ring', hand: 'right' },
	'; :': { finger: 'pinky', hand: 'right' },
	"'": { finger: 'pinky', hand: 'right' },
	shift: { finger: 'pinky', hand: 'left' },
	z: { finger: 'pinky', hand: 'left' },
	x: { finger: 'ring', hand: 'left' },
	c: { finger: 'middle', hand: 'left' },
	v: { finger: 'index', hand: 'left' },
	b: { finger: 'index', hand: 'left' },
	n: { finger: 'index', hand: 'right' },
	m: { finger: 'index', hand: 'right' },
	',': { finger: 'middle', hand: 'right' },
	'.': { finger: 'ring', hand: 'right' },
	'/ ?': { finger: 'pinky', hand: 'right' },
	space: { finger: 'thumb', hand: 'both' }
};

describe('QWERTY finger-to-cap map', () => {
	test('assigns every on-screen cap the spec finger, and no extra caps', () => {
		expect(keyboardCaps.map((cap) => cap.label).sort()).toEqual(
			Object.keys(expectedFingerByLabel).sort()
		);
		for (const cap of keyboardCaps) {
			expect(cap, cap.label).toMatchObject(expectedFingerByLabel[cap.label]);
		}
	});

	test('marks F and J as the home-row bump caps', () => {
		expect(keyboardCaps.find((cap) => cap.label === 'f')?.home).toBe(true);
		expect(keyboardCaps.find((cap) => cap.label === 'j')?.home).toBe(true);
		expect(keyboardCaps.filter((cap) => cap.home).map((cap) => cap.label).sort()).toEqual(['f', 'j']);
	});
});
