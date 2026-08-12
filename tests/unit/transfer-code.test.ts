import { describe, expect, test } from 'vitest';
import {
	formatTransferCodeForDisplay,
	isWellFormedTransferCode,
	transferCodeAlphabet
} from '../../src/lib/transfer-code';

describe('isWellFormedTransferCode', () => {
	test('accepts an 8-character code drawn from the transfer code alphabet', () => {
		expect(isWellFormedTransferCode('ABCD2345')).toBe(true);
	});

	test('rejects codes that are too short or too long', () => {
		expect(isWellFormedTransferCode('ABCD234')).toBe(false);
		expect(isWellFormedTransferCode('ABCD23456')).toBe(false);
	});

	test('rejects codes containing characters outside the alphabet', () => {
		expect(isWellFormedTransferCode('ABCD023I')).toBe(false);
		expect(isWellFormedTransferCode('abcd2345')).toBe(false);
	});

	test('the alphabet excludes the ambiguous glyphs 0, O, 1, I, L', () => {
		for (const excluded of ['0', 'O', '1', 'I', 'L']) {
			expect(transferCodeAlphabet).not.toContain(excluded);
		}
	});

	test('the alphabet is exactly 31 characters, all uppercase letters or digits', () => {
		expect(transferCodeAlphabet).toHaveLength(31);
		expect(transferCodeAlphabet).toMatch(/^[A-Z0-9]+$/);
	});
});

describe('formatTransferCodeForDisplay', () => {
	test('groups an 8-character code into two hyphen-separated halves', () => {
		expect(formatTransferCodeForDisplay('ABCD2345')).toBe('ABCD-2345');
	});
});
