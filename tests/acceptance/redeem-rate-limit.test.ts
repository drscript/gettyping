import { randomUUID } from 'node:crypto';
import Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createPlayerCookie } from './player';
import { startTestServer, type TestServer } from './server';

interface Identity {
	active: string;
	players: string[];
}

function activePlayerIdFrom(cookie: string): string {
	const identity = JSON.parse(decodeURIComponent(cookie.split('=', 2)[1])) as Identity;
	return identity.active;
}

function cookieFor(identity: Identity): string {
	return `gettyping_identity=${encodeURIComponent(JSON.stringify(identity))}`;
}

function codeForPlayer(server: TestServer, playerId: string): string {
	const database = new Database(server.databasePath);
	const row = database
		.prepare('SELECT code FROM transfer_codes WHERE player_id = ?')
		.get(playerId) as { code: string } | undefined;
	database.close();
	if (!row) throw new Error(`No transfer code found for Player ${playerId}`);
	return row.code;
}

async function generateCode(server: TestServer, cookie: string, playerId: string): Promise<void> {
	const response = await fetch(`${server.baseUrl}/players?/generate`, {
		method: 'POST',
		headers: {
			accept: 'text/html',
			'content-type': 'application/x-www-form-urlencoded',
			cookie,
			origin: server.baseUrl
		},
		body: new URLSearchParams({ playerId }),
		redirect: 'manual'
	});
	if (response.status !== 200) {
		throw new Error(`Could not generate a transfer code: ${response.status}`);
	}
}

async function redeemCode(server: TestServer, cookie: string, code: string, ip: string): Promise<Response> {
	return fetch(`${server.baseUrl}/players?/redeem`, {
		method: 'POST',
		headers: {
			accept: 'text/html',
			'content-type': 'application/x-www-form-urlencoded',
			cookie,
			origin: server.baseUrl,
			'fly-client-ip': ip
		},
		body: new URLSearchParams({ code }),
		redirect: 'manual'
	});
}

describe('Redeem rate limiting', () => {
	let server: TestServer;

	beforeAll(async () => {
		server = await startTestServer({ ADDRESS_HEADER: 'Fly-Client-IP' });
	});

	afterAll(async () => {
		await server?.stop();
	});

	test('an 11th failed attempt from the same IP within the window is rate limited', async () => {
		const ip = '203.0.113.20';
		const cookie = await createPlayerCookie(server, 'RedeemLimitTarget');

		for (let attempt = 0; attempt < 10; attempt += 1) {
			const response = await redeemCode(server, cookie, 'ZZZZZZZZ', ip);
			expect(response.status).toBe(400);
		}

		const limited = await redeemCode(server, cookie, 'ZZZZZZZZ', ip);
		expect(limited.status).toBe(429);
		expect(limited.headers.get('retry-after')).toMatch(/^\d+$/);
	});

	test('a valid code is also rejected once an IP is rate limited', async () => {
		const ip = '203.0.113.21';
		const sourceCookie = await createPlayerCookie(server, 'RedeemLimitSource');
		const sourcePlayerId = activePlayerIdFrom(sourceCookie);
		await generateCode(server, sourceCookie, sourcePlayerId);
		const code = codeForPlayer(server, sourcePlayerId);

		const targetCookie = await createPlayerCookie(server, 'RedeemLimitTarget2');

		for (let attempt = 0; attempt < 10; attempt += 1) {
			await redeemCode(server, targetCookie, 'ZZZZZZZZ', ip);
		}

		const limited = await redeemCode(server, targetCookie, code, ip);
		expect(limited.status).toBe(429);
	});

	test('a different IP is unaffected by another IP exhausting its attempts', async () => {
		const exhaustedIp = '203.0.113.22';
		const freshIp = '203.0.113.23';

		const exhaustedTargetCookie = await createPlayerCookie(server, 'RedeemLimitExhausted');
		for (let attempt = 0; attempt < 11; attempt += 1) {
			await redeemCode(server, exhaustedTargetCookie, 'ZZZZZZZZ', exhaustedIp);
		}

		const sourceCookie = await createPlayerCookie(server, 'RedeemLimitFreshSource');
		const sourcePlayerId = activePlayerIdFrom(sourceCookie);
		await generateCode(server, sourceCookie, sourcePlayerId);
		const code = codeForPlayer(server, sourcePlayerId);

		const freshTargetCookie = await createPlayerCookie(server, 'RedeemLimitFreshTarget');
		const stillWorks = await redeemCode(server, freshTargetCookie, code, freshIp);
		expect(stillWorks.status).toBe(303);
	});

	test('a successful redemption resets the failed-attempt count for that IP', async () => {
		const ip = '203.0.113.24';

		const sourceCookie = await createPlayerCookie(server, 'RedeemLimitResetSource');
		const sourcePlayerId = activePlayerIdFrom(sourceCookie);
		await generateCode(server, sourceCookie, sourcePlayerId);
		const code = codeForPlayer(server, sourcePlayerId);

		const targetCookie = await createPlayerCookie(server, 'RedeemLimitResetTarget');

		for (let attempt = 0; attempt < 9; attempt += 1) {
			const response = await redeemCode(server, targetCookie, 'ZZZZZZZZ', ip);
			expect(response.status).toBe(400);
		}

		const success = await redeemCode(server, targetCookie, code, ip);
		expect(success.status).toBe(303);

		for (let attempt = 0; attempt < 9; attempt += 1) {
			const response = await redeemCode(server, targetCookie, 'ZZZZZZZZ', ip);
			expect(response.status).toBe(400);
		}
	});

	test('a device-at-capacity rejection does not count against the failed-attempt window', async () => {
		const ip = '203.0.113.25';

		const sourceCookie = await createPlayerCookie(server, 'RedeemLimitCapSource');
		const sourcePlayerId = activePlayerIdFrom(sourceCookie);
		await generateCode(server, sourceCookie, sourcePlayerId);
		const code = codeForPlayer(server, sourcePlayerId);

		const fullPlayerIds = Array.from({ length: 20 }, () => randomUUID());
		const fullCookie = cookieFor({ active: fullPlayerIds[0], players: fullPlayerIds });

		for (let attempt = 0; attempt < 10; attempt += 1) {
			const response = await redeemCode(server, fullCookie, code, ip);
			expect(response.status).toBe(400);
		}

		const stillNotLimited = await redeemCode(server, fullCookie, code, ip);
		expect(stillNotLimited.status).toBe(400);
		expect(stillNotLimited.headers.get('retry-after')).toBeNull();
	});
});
