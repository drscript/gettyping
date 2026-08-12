import Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createPlayerCookie } from './player';
import { startTestServer, type TestServer } from './server';

function activePlayerIdFrom(cookie: string): string {
	const identity = JSON.parse(decodeURIComponent(cookie.split('=', 2)[1])) as { active: string };
	return identity.active;
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
