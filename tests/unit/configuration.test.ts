import { afterEach, describe, expect, test } from 'vitest';
import { getRuntimeConfiguration } from '../../src/lib/server/runtime/configuration';

const stretchEnvKeys = ['STRETCH_OFFER_COUNT', 'STRETCH_LENGTH_FACTOR', 'CONSECUTIVE_FAILURE_COUNT'];

afterEach(() => {
	for (const key of stretchEnvKeys) delete process.env[key];
});

describe('getRuntimeConfiguration — Finger-stretch thresholds', () => {
	test('defaults stretchOfferCount to 2 and stretchLengthFactor to 0.5', () => {
		const configuration = getRuntimeConfiguration();
		expect(configuration.stretchOfferCount).toBe(2);
		expect(configuration.stretchLengthFactor).toBe(0.5);
	});

	test('STRETCH_OFFER_COUNT overrides the default', () => {
		process.env.STRETCH_OFFER_COUNT = '1';
		expect(getRuntimeConfiguration().stretchOfferCount).toBe(1);
	});

	test('STRETCH_OFFER_COUNT rejects a non-positive-integer value', () => {
		process.env.STRETCH_OFFER_COUNT = '0';
		expect(() => getRuntimeConfiguration()).toThrow(/STRETCH_OFFER_COUNT/);
	});

	test('STRETCH_LENGTH_FACTOR overrides the default', () => {
		process.env.STRETCH_LENGTH_FACTOR = '0.75';
		expect(getRuntimeConfiguration().stretchLengthFactor).toBe(0.75);
	});

	test('STRETCH_LENGTH_FACTOR rejects a value outside (0, 1]', () => {
		process.env.STRETCH_LENGTH_FACTOR = '0';
		expect(() => getRuntimeConfiguration()).toThrow(/STRETCH_LENGTH_FACTOR/);

		process.env.STRETCH_LENGTH_FACTOR = '1.5';
		expect(() => getRuntimeConfiguration()).toThrow(/STRETCH_LENGTH_FACTOR/);
	});

	test('STRETCH_LENGTH_FACTOR of exactly 1 is valid', () => {
		process.env.STRETCH_LENGTH_FACTOR = '1';
		expect(getRuntimeConfiguration().stretchLengthFactor).toBe(1);
	});

	test('throws, naming both constants, when stretchOfferCount >= consecutiveFailureCount by default', () => {
		process.env.STRETCH_OFFER_COUNT = '3'; // equals the default consecutiveFailureCount of 3
		expect(() => getRuntimeConfiguration()).toThrow(/stretchOfferCount/);
		expect(() => getRuntimeConfiguration()).toThrow(/consecutiveFailureCount/);
	});

	test('throws when an overridden consecutiveFailureCount drops below the default stretchOfferCount', () => {
		process.env.CONSECUTIVE_FAILURE_COUNT = '2'; // equals the default stretchOfferCount of 2
		expect(() => getRuntimeConfiguration()).toThrow(/stretchOfferCount/);
	});

	test('does not throw when stretchOfferCount is strictly below consecutiveFailureCount', () => {
		process.env.STRETCH_OFFER_COUNT = '1';
		process.env.CONSECUTIVE_FAILURE_COUNT = '2';
		expect(() => getRuntimeConfiguration()).not.toThrow();
	});

	test('leaves consecutiveFailureCount behavior unchanged', () => {
		expect(getRuntimeConfiguration().consecutiveFailureCount).toBe(3);
		process.env.CONSECUTIVE_FAILURE_COUNT = '5';
		expect(getRuntimeConfiguration().consecutiveFailureCount).toBe(5);
	});
});
