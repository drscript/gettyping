import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createFixedWindowRateLimiter } from '../../src/lib/server/rate-limiter';

const windowMs = 15 * 60 * 1000;
const maxAttempts = 5;

describe('createFixedWindowRateLimiter', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	test('status is null for a key with no recorded attempts', () => {
		const limiter = createFixedWindowRateLimiter({ windowMs, maxAttempts });
		expect(limiter.status('1.2.3.4')).toBeNull();
	});

	test('status stays null until the max attempt count is reached', () => {
		const limiter = createFixedWindowRateLimiter({ windowMs, maxAttempts });
		const key = '1.2.3.4';

		for (let i = 0; i < maxAttempts - 1; i += 1) {
			limiter.recordFailure(key);
			expect(limiter.status(key)).toBeNull();
		}
	});

	test('status returns seconds remaining once max attempts is reached within the window', () => {
		const limiter = createFixedWindowRateLimiter({ windowMs, maxAttempts });
		const key = '1.2.3.4';

		for (let i = 0; i < maxAttempts; i += 1) {
			limiter.recordFailure(key);
		}

		const remaining = limiter.status(key);
		expect(remaining).toBe(windowMs / 1000);
	});

	test('status counts down as time passes within the window', () => {
		const limiter = createFixedWindowRateLimiter({ windowMs, maxAttempts });
		const key = '1.2.3.4';

		for (let i = 0; i < maxAttempts; i += 1) {
			limiter.recordFailure(key);
		}

		vi.advanceTimersByTime(60 * 1000);

		expect(limiter.status(key)).toBe((windowMs - 60 * 1000) / 1000);
	});

	test('status returns null again once the window has fully elapsed', () => {
		const limiter = createFixedWindowRateLimiter({ windowMs, maxAttempts });
		const key = '1.2.3.4';

		for (let i = 0; i < maxAttempts; i += 1) {
			limiter.recordFailure(key);
		}

		vi.advanceTimersByTime(windowMs);

		expect(limiter.status(key)).toBeNull();
	});

	test('a failure after the window has elapsed starts a fresh window instead of accumulating', () => {
		const limiter = createFixedWindowRateLimiter({ windowMs, maxAttempts });
		const key = '1.2.3.4';

		for (let i = 0; i < maxAttempts; i += 1) {
			limiter.recordFailure(key);
		}

		vi.advanceTimersByTime(windowMs);
		limiter.recordFailure(key);

		expect(limiter.status(key)).toBeNull();
	});

	test('recordSuccess clears any recorded failures for that key', () => {
		const limiter = createFixedWindowRateLimiter({ windowMs, maxAttempts });
		const key = '1.2.3.4';

		for (let i = 0; i < maxAttempts; i += 1) {
			limiter.recordFailure(key);
		}
		limiter.recordSuccess(key);

		expect(limiter.status(key)).toBeNull();

		for (let i = 0; i < maxAttempts - 1; i += 1) {
			limiter.recordFailure(key);
		}
		expect(limiter.status(key)).toBeNull();
	});

	test('keys are tracked independently', () => {
		const limiter = createFixedWindowRateLimiter({ windowMs, maxAttempts });

		for (let i = 0; i < maxAttempts; i += 1) {
			limiter.recordFailure('exhausted-key');
		}

		expect(limiter.status('exhausted-key')).not.toBeNull();
		expect(limiter.status('fresh-key')).toBeNull();
	});

	test('two independently constructed limiters do not share state', () => {
		const limiterA = createFixedWindowRateLimiter({ windowMs, maxAttempts });
		const limiterB = createFixedWindowRateLimiter({ windowMs, maxAttempts });
		const key = 'shared-key-name';

		for (let i = 0; i < maxAttempts; i += 1) {
			limiterA.recordFailure(key);
		}

		expect(limiterA.status(key)).not.toBeNull();
		expect(limiterB.status(key)).toBeNull();
	});
});
