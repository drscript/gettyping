import { randomInt } from 'node:crypto';
import { eq, lt } from 'drizzle-orm';
import { transferCodeAlphabet, transferCodeLength } from '$lib/transfer-code';
import { getDatabase } from './database';
import { transferCodes } from './database/schema';
import { createFixedWindowRateLimiter } from './rate-limiter';

export const transferCodeTtlMs = 10 * 60 * 1000;

const redeemRateLimiter = createFixedWindowRateLimiter({
	windowMs: 60 * 1000,
	maxAttempts: 10
});

/** Seconds until the caller's failed-attempt window resets, or null if they're not currently limited. */
export function redeemRateLimitStatus(ip: string): number | null {
	return redeemRateLimiter.status(ip);
}

export function recordFailedRedeem(ip: string): void {
	redeemRateLimiter.recordFailure(ip);
}

export function recordSuccessfulRedeem(ip: string): void {
	redeemRateLimiter.recordSuccess(ip);
}

type Transaction = Parameters<Parameters<ReturnType<typeof getDatabase>['transaction']>[0]>[0];

function sweepExpiredTransferCodes(transaction: Transaction, now: number): void {
	transaction
		.delete(transferCodes)
		.where(lt(transferCodes.createdAt, now - transferCodeTtlMs))
		.run();
}

function randomTransferCode(): string {
	let code = '';
	for (let index = 0; index < transferCodeLength; index += 1) {
		code += transferCodeAlphabet[randomInt(transferCodeAlphabet.length)];
	}
	return code;
}

/** Generates a fresh transfer code for a Player, replacing any code they already hold. */
export function generateTransferCode(playerId: string): string {
	const database = getDatabase();
	const createdAt = Date.now();
	const code = randomTransferCode();

	database.transaction((transaction) => {
		sweepExpiredTransferCodes(transaction, createdAt);
		transaction.delete(transferCodes).where(eq(transferCodes.playerId, playerId)).run();
		transaction.insert(transferCodes).values({ code, playerId, createdAt }).run();
	});

	return code;
}

/** Sweeps expired codes, then looks up the owning Player for a code. Does not consume it. */
export function findTransferCode(code: string): { playerId: string } | undefined {
	const database = getDatabase();
	const now = Date.now();

	return database.transaction((transaction) => {
		sweepExpiredTransferCodes(transaction, now);

		return transaction
			.select({ playerId: transferCodes.playerId })
			.from(transferCodes)
			.where(eq(transferCodes.code, code))
			.get();
	});
}

/**
 * Consumes a code so it can never be redeemed again. A separate call from
 * findTransferCode because whether to consume depends on the caller's own
 * cap check against the redeeming device's identity cookie, which lives
 * outside this module and can't be folded into a SQL transaction.
 */
export function consumeTransferCode(code: string): void {
	getDatabase().delete(transferCodes).where(eq(transferCodes.code, code)).run();
}
