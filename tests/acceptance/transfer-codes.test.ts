import { randomUUID } from 'node:crypto';
import Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createPlayerCookie } from './player';
import { startTestServer, type TestServer } from './server';

interface Identity {
	active: string;
	players: string[];
}

function identityFrom(cookie: string): Identity {
	return JSON.parse(decodeURIComponent(cookie.split('=', 2)[1])) as Identity;
}

function activePlayerIdFrom(cookie: string): string {
	return identityFrom(cookie).active;
}

function cookieFor(identity: Identity): string {
	return `gettyping_identity=${encodeURIComponent(JSON.stringify(identity))}`;
}

interface TransferCodeRow {
	code: string;
	player_id: string;
	created_at: number;
}

function transferCodesForPlayer(server: TestServer, playerId: string): TransferCodeRow[] {
	const database = new Database(server.databasePath);
	const rows = database
		.prepare('SELECT code, player_id, created_at FROM transfer_codes WHERE player_id = ?')
		.all(playerId) as TransferCodeRow[];
	database.close();
	return rows;
}

function insertPlayer(server: TestServer, nickname: string): string {
	const id = randomUUID();
	const database = new Database(server.databasePath);
	database
		.prepare('INSERT INTO players (id, nickname, created_at) VALUES (?, ?, ?)')
		.run(id, nickname, Date.now());
	database.close();
	return id;
}

function insertTransferCode(server: TestServer, code: string, playerId: string, createdAt: number): void {
	const database = new Database(server.databasePath);
	database
		.prepare('INSERT INTO transfer_codes (code, player_id, created_at) VALUES (?, ?, ?)')
		.run(code, playerId, createdAt);
	database.close();
}

async function generateCode(server: TestServer, cookie: string, playerId: string): Promise<Response> {
	return fetch(`${server.baseUrl}/players?/generate`, {
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
}

async function redeemCode(server: TestServer, cookie: string, code: string): Promise<Response> {
	return fetch(`${server.baseUrl}/players?/redeem`, {
		method: 'POST',
		headers: {
			accept: 'text/html',
			'content-type': 'application/x-www-form-urlencoded',
			cookie,
			origin: server.baseUrl
		},
		body: new URLSearchParams({ code }),
		redirect: 'manual'
	});
}

describe('Transfer codes', () => {
	let server: TestServer;

	beforeAll(async () => {
		server = await startTestServer();
	});

	afterAll(async () => {
		await server?.stop();
	});

	test('generating a code produces a well-formed code tied to the right Player', async () => {
		const cookie = await createPlayerCookie(server, 'TransferTern');
		const playerId = activePlayerIdFrom(cookie);

		const response = await generateCode(server, cookie, playerId);
		expect(response.status).toBe(200);

		const page = await response.text();
		expect(page).toMatch(/[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}/);

		const rows = transferCodesForPlayer(server, playerId);
		expect(rows).toHaveLength(1);
		expect(rows[0].code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/);
		expect(rows[0].player_id).toBe(playerId);
		expect(rows[0].created_at).toBeGreaterThan(Date.now() - 5000);
		expect(rows[0].created_at).toBeLessThanOrEqual(Date.now());
	});

	test('generating a second code for the same Player replaces the first', async () => {
		const cookie = await createPlayerCookie(server, 'TransferToucan');
		const playerId = activePlayerIdFrom(cookie);

		const firstResponse = await generateCode(server, cookie, playerId);
		const firstRows = transferCodesForPlayer(server, playerId);
		expect(firstRows).toHaveLength(1);
		const firstCode = firstRows[0].code;
		expect(firstResponse.status).toBe(200);

		const secondResponse = await generateCode(server, cookie, playerId);
		expect(secondResponse.status).toBe(200);

		const rows = transferCodesForPlayer(server, playerId);
		expect(rows).toHaveLength(1);
		expect(rows[0].code).not.toBe(firstCode);

		const database = new Database(server.databasePath);
		const stillThere = database.prepare('SELECT 1 FROM transfer_codes WHERE code = ?').get(firstCode);
		database.close();
		expect(stillThere).toBeUndefined();
	});

	test('a Player cannot generate a code for a Player not on this device', async () => {
		const ownerCookie = await createPlayerCookie(server, 'TransferOwner');
		const strangerCookie = await createPlayerCookie(server, 'TransferStranger');
		const ownerPlayerId = activePlayerIdFrom(ownerCookie);

		const response = await generateCode(server, strangerCookie, ownerPlayerId);
		expect(response.status).toBe(400);
		expect(transferCodesForPlayer(server, ownerPlayerId)).toHaveLength(0);
	});
});

describe('Redeeming a transfer code', () => {
	let server: TestServer;

	beforeAll(async () => {
		server = await startTestServer();
	});

	afterAll(async () => {
		await server?.stop();
	});

	test('a valid code links the Player, auto-switches to them, and preserves the target device\'s existing Players', async () => {
		const sourceCookie = await createPlayerCookie(server, 'RedeemSource');
		const sourcePlayerId = activePlayerIdFrom(sourceCookie);
		await generateCode(server, sourceCookie, sourcePlayerId);
		const code = transferCodesForPlayer(server, sourcePlayerId)[0].code;

		const targetCookie = await createPlayerCookie(server, 'RedeemTarget');
		const targetPlayerId = activePlayerIdFrom(targetCookie);

		const response = await redeemCode(server, targetCookie, code);
		expect(response.status).toBe(303);
		expect(response.headers.get('location')).toBe('/');

		const newCookie = response.headers.get('set-cookie')?.split(';', 1)[0];
		expect(newCookie).toBeDefined();
		const newIdentity = identityFrom(newCookie as string);
		expect(newIdentity.active).toBe(sourcePlayerId);
		expect(newIdentity.players.sort()).toEqual([sourcePlayerId, targetPlayerId].sort());

		expect(transferCodesForPlayer(server, sourcePlayerId)).toHaveLength(0);

		const sourceStillWorks = await fetch(`${server.baseUrl}/players`, {
			headers: { cookie: sourceCookie }
		});
		const sourcePage = await sourceStillWorks.text();
		expect(sourceStillWorks.status).toBe(200);
		expect(sourcePage).toContain('RedeemSource');
	});

	test('a nonexistent, expired, or already-redeemed code all produce the same generic error', async () => {
		const targetCookie = await createPlayerCookie(server, 'RedeemGenericTarget');

		const badResponse = await redeemCode(server, targetCookie, 'ZZZZZZZZ');
		expect(badResponse.status).toBe(400);
		expect(await badResponse.text()).toContain('That code is invalid or has expired.');

		const expiredOwnerId = insertPlayer(server, 'ExpiredOwner');
		insertTransferCode(server, 'EXPRD222', expiredOwnerId, Date.now() - 11 * 60 * 1000);
		const expiredResponse = await redeemCode(server, targetCookie, 'EXPRD222');
		expect(expiredResponse.status).toBe(400);
		expect(await expiredResponse.text()).toContain('That code is invalid or has expired.');

		const reuseSourceCookie = await createPlayerCookie(server, 'ReuseSource');
		const reuseSourceId = activePlayerIdFrom(reuseSourceCookie);
		await generateCode(server, reuseSourceCookie, reuseSourceId);
		const reuseCode = transferCodesForPlayer(server, reuseSourceId)[0].code;

		const firstRedeem = await redeemCode(server, targetCookie, reuseCode);
		expect(firstRedeem.status).toBe(303);

		const secondRedeem = await redeemCode(server, targetCookie, reuseCode);
		expect(secondRedeem.status).toBe(400);
		expect(await secondRedeem.text()).toContain('That code is invalid or has expired.');
	});

	test('redeeming against a device at the Player cap fails, leaving the code redeemable elsewhere', async () => {
		const sourceCookie = await createPlayerCookie(server, 'CapSource');
		const sourcePlayerId = activePlayerIdFrom(sourceCookie);
		await generateCode(server, sourceCookie, sourcePlayerId);
		const code = transferCodesForPlayer(server, sourcePlayerId)[0].code;

		const fullPlayerIds = Array.from({ length: 20 }, (_, index) => insertPlayer(server, `CapPlayer${index}`));
		const fullCookie = cookieFor({ active: fullPlayerIds[0], players: fullPlayerIds });

		const response = await redeemCode(server, fullCookie, code);
		expect(response.status).toBe(400);
		const page = await response.text();
		expect(page).not.toContain('invalid or has expired');
		expect(page).toContain('maximum number of Players');

		const rows = transferCodesForPlayer(server, sourcePlayerId);
		expect(rows).toHaveLength(1);
		expect(rows[0].code).toBe(code);
	});
});
