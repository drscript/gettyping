import { describe, expect, test } from 'vitest';
import { generateFingerStretchContent } from '../../src/lib/server/finger-stretch-generation';
import { createSeededRandom, type RandomSource } from '../../src/lib/server/runtime/random';

const curriculum = new Map<number, string[]>([
	[1, ['f', 'j']],
	[2, ['g', 'h']],
	[3, ['d', 'k']],
	[4, ['s', 'l']],
	[5, ['a', ';']],
	[6, ['r', 'u']],
	[7, ['t', 'y']],
	[8, ['e', 'i']],
	[9, ['w', 'o']],
	[10, ['q', 'p']],
	[11, ['v', 'n']],
	[12, ['b', 'm']],
	[13, ['z', 'x', 'c']],
	[14, ['shift']]
]);

function randomFor(seed: string): RandomSource {
	return createSeededRandom(seed);
}

describe('generateFingerStretchContent — key pool and anchor', () => {
	test('Stage 3: runs and pairs draw only from {d, k}, anchor is stages 1-2', () => {
		const content = generateFingerStretchContent(3, curriculum, 1, randomFor('stage-3'));
		expect(content).not.toMatch(/[^dk fjgh]/);
		expect(content).toContain('fjgh');
		expect(content).toContain('dddddddd');
		expect(content).toContain('kkkkkkkk');
	});

	test('Stage 13: three run-blocks and a zxc-cycled pair block', () => {
		const content = generateFingerStretchContent(13, curriculum, 1, randomFor('stage-13'));
		expect(content).not.toMatch(/[^zxc fjghdksla;rutyeiwoqpvnbm]/);
		expect(content).toContain('zzzzzzzz');
		expect(content).toContain('xxxxxxxx');
		expect(content).toContain('cccccccc');
		expect(content).toContain('fjghdksla;rutyeiwoqpvnbm');
	});

	test('Stage 14: pool falls back to Stage 13 keys, capitalized; anchor stays lowercase', () => {
		const content = generateFingerStretchContent(14, curriculum, 1, randomFor('stage-14'));
		const [runsAndPairs, anchorAndTrailer] = content.split('fjghdksla;rutyeiwoqpvnbmzxc');
		expect(anchorAndTrailer).toBeDefined();
		expect(runsAndPairs).toMatch(/^[ZXC ]+$/);
		expect(content).toContain('fjghdksla;rutyeiwoqpvnbmzxc');
	});

	test('Stage 1: no anchor segment, but both pair-blocks survive', () => {
		const content = generateFingerStretchContent(1, curriculum, 1, randomFor('stage-1'));
		expect(content).not.toMatch(/[^fj ]/);
		expect(content).not.toContain('  ');
		expect(content.startsWith(' ')).toBe(false);
		expect(content.endsWith(' ')).toBe(false);
		// runs + pairs + pairs (anchor and one of its two surrounding spaces
		// dropped) — the pair-block content itself is never dropped.
		expect(content.split(' ')).toHaveLength(4);
	});
});

describe('generateFingerStretchContent — length factor', () => {
	test('lengthFactor 1 matches the authored run(8)/pair(16) scale', () => {
		const content = generateFingerStretchContent(3, curriculum, 1, randomFor('full-length'));
		expect(content).toMatch(/d{8}|k{8}/);
	});

	test('lengthFactor 0.5 roughly halves run and pair lengths', () => {
		const content = generateFingerStretchContent(3, curriculum, 0.5, randomFor('half-length'));
		expect(content).not.toMatch(/d{5}|k{5}/); // no 8-run survives at half scale
		expect(content).toMatch(/d{4}|k{4}/);
	});

	test('an extreme small lengthFactor floors at 2 repeats, never collapses to nothing', () => {
		const content = generateFingerStretchContent(3, curriculum, 0.01, randomFor('floor'));
		expect(content).toMatch(/d{2}|k{2}/);
		expect(content.length).toBeGreaterThan(0);
	});
});

describe('generateFingerStretchContent — freshness', () => {
	test('different seeds are not guaranteed to produce identical content', () => {
		const first = generateFingerStretchContent(13, curriculum, 1, randomFor('seed-a'));
		const second = generateFingerStretchContent(13, curriculum, 1, randomFor('seed-b'));
		expect(first).not.toBe(second);
	});

	test('both remain structurally valid regardless of seed', () => {
		for (const seed of ['seed-a', 'seed-b', 'seed-c']) {
			const content = generateFingerStretchContent(13, curriculum, 1, randomFor(seed));
			expect(content).not.toMatch(/[^zxc fjghdksla;rutyeiwoqpvnbm]/);
		}
	});
});
