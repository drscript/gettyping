interface RateLimiterOptions {
	windowMs: number;
	maxAttempts: number;
}

interface AttemptWindow {
	count: number;
	windowStart: number;
}

export interface FixedWindowRateLimiter {
	/** Seconds until the key's failure window resets, or null if the key is not currently limited. */
	status(key: string): number | null;
	recordFailure(key: string): void;
	recordSuccess(key: string): void;
}

/** A fixed-window rate limiter that tracks failure counts per key (e.g. per IP). */
export function createFixedWindowRateLimiter({
	windowMs,
	maxAttempts
}: RateLimiterOptions): FixedWindowRateLimiter {
	const attemptsByKey = new Map<string, AttemptWindow>();

	return {
		status(key: string): number | null {
			const attempt = attemptsByKey.get(key);
			if (!attempt) return null;

			const elapsedMs = Date.now() - attempt.windowStart;
			if (elapsedMs >= windowMs) return null;
			if (attempt.count < maxAttempts) return null;

			return Math.ceil((windowMs - elapsedMs) / 1000);
		},

		recordFailure(key: string): void {
			const now = Date.now();
			const attempt = attemptsByKey.get(key);

			if (!attempt || now - attempt.windowStart >= windowMs) {
				attemptsByKey.set(key, { count: 1, windowStart: now });
				return;
			}

			attempt.count += 1;
		},

		recordSuccess(key: string): void {
			attemptsByKey.delete(key);
		}
	};
}
