import { randomInt } from 'node:crypto';
import { eq, lt } from 'drizzle-orm';
import { transferCodeAlphabet, transferCodeLength } from '$lib/transfer-code';
import { getDatabase } from './database';
import { transferCodes } from './database/schema';

export const transferCodeTtlMs = 10 * 60 * 1000;

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
		transaction
			.delete(transferCodes)
			.where(lt(transferCodes.createdAt, createdAt - transferCodeTtlMs))
			.run();
		transaction.delete(transferCodes).where(eq(transferCodes.playerId, playerId)).run();
		transaction.insert(transferCodes).values({ code, playerId, createdAt }).run();
	});

	return code;
}
