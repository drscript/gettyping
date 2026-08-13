import { describe, expect, test } from 'vitest';
import { characterKeys, qwertyNeighbours } from '../../src/lib/server/keyboard-adjacency';

function neighboursOf(key: string): readonly string[] {
	return qwertyNeighbours.get(key) ?? [];
}

describe('qwertyNeighbours', () => {
	test('includes every character key the curriculum can teach', () => {
		expect(characterKeys).toContain('a');
		expect(characterKeys).toContain('0');
		expect(characterKeys).toEqual(expect.arrayContaining([';', ',', '.', "'", '?', '!']));
		expect(characterKeys).not.toContain('shift');
		for (const key of characterKeys) expect(qwertyNeighbours.has(key)).toBe(true);
	});

	test('horizontally adjacent home-row keys are neighbours', () => {
		expect(neighboursOf('g')).toContain('h');
		expect(neighboursOf('h')).toContain('g');
	});

	test('f and j are not adjacent — they sit three keys apart on the home row', () => {
		expect(neighboursOf('f')).not.toContain('j');
		expect(neighboursOf('j')).not.toContain('f');
	});

	test('a key is never its own neighbour', () => {
		for (const key of characterKeys) expect(neighboursOf(key)).not.toContain(key);
	});

	test('neighbours are symmetric', () => {
		for (const key of characterKeys) {
			for (const neighbour of neighboursOf(key)) {
				expect(neighboursOf(neighbour)).toContain(key);
			}
		}
	});

	test('cross-row neighbours follow the QWERTY stagger', () => {
		// '2' sits above the gap between q and w.
		expect(neighboursOf('2')).toEqual(expect.arrayContaining(['q', 'w']));
		// 'w' sits above the gap between a and s.
		expect(neighboursOf('w')).toEqual(expect.arrayContaining(['a', 's']));
		// 's' sits above the gap between z and x.
		expect(neighboursOf('s')).toEqual(expect.arrayContaining(['z', 'x']));
	});

	test('shifted punctuation shares its unshifted key\'s physical neighbours', () => {
		expect(neighboursOf('!')).toEqual(neighboursOf('1'));
		expect(neighboursOf('?')).not.toHaveLength(0);
		expect(neighboursOf('?')).toContain('.');
	});

	test('edge keys have fewer neighbours than interior keys', () => {
		expect(neighboursOf('1').length).toBeLessThan(neighboursOf('5').length);
	});
});
