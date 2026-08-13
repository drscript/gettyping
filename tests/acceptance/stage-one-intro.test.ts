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

async function createLearnPlayer(server: TestServer, nickname: string, existingCookie?: string) {
	return createPlayerCookie(server, nickname, {
		track: 'learn',
		existingCookie
	});
}

async function acknowledgeStageOneIntro(server: TestServer, cookie: string): Promise<Response> {
	return fetch(`${server.baseUrl}/api/attempts/learn/1`, {
		method: 'POST',
		headers: { cookie, 'content-type': 'application/json' },
		body: JSON.stringify({ stageOneIntroSeen: true })
	});
}

function playerRow(server: TestServer, nickname: string) {
	const database = new Database(server.databasePath, { readonly: true });
	const row = database
		.prepare(
			`SELECT id, stage_one_intro_seen_at AS stageOneIntroSeenAt FROM players WHERE nickname = ?`
		)
		.get(nickname) as { id: string; stageOneIntroSeenAt: number | null };
	database.close();
	return row;
}

function tokenCount(server: TestServer, playerId: string): number {
	const database = new Database(server.databasePath, { readonly: true });
	const row = database
		.prepare('SELECT COUNT(*) AS count FROM attempt_tokens WHERE player_id = ?')
		.get(playerId) as { count: number };
	database.close();
	return row.count;
}

function scoreCount(server: TestServer, playerId: string): number {
	const database = new Database(server.databasePath, { readonly: true });
	const row = database
		.prepare('SELECT COUNT(*) AS count FROM scores WHERE player_id = ?')
		.get(playerId) as { count: number };
	database.close();
	return row.count;
}

describe('Stage 1 intro on the Learn Attempt seam', () => {
	let server: TestServer;

	beforeAll(async () => {
		server = await startTestServer();
	});

	afterAll(async () => {
		await server?.stop();
	});

	test('a fresh Player has a null intro timestamp and is served the intro, not a token', async () => {
		const nickname = 'IntroIbis';
		const cookie = await createLearnPlayer(server, nickname);
		const player = playerRow(server, nickname);
		expect(player.stageOneIntroSeenAt).toBeNull();

		const response = await fetch(`${server.baseUrl}/api/attempts/learn/1`, { headers: { cookie } });
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ stageOneIntro: true });
		expect(tokenCount(server, player.id)).toBe(0);
		expect(scoreCount(server, player.id)).toBe(0);
	});

	test('acknowledging the intro is 204, sets the timestamp once, and writes no Score or token', async () => {
		const nickname = 'AckAvocet';
		const cookie = await createLearnPlayer(server, nickname);
		const player = playerRow(server, nickname);

		const first = await acknowledgeStageOneIntro(server, cookie);
		expect(first.status).toBe(204);
		expect(await first.text()).toBe('');

		const afterFirst = playerRow(server, nickname);
		expect(afterFirst.stageOneIntroSeenAt).toEqual(expect.any(Number));
		expect(tokenCount(server, player.id)).toBe(0);
		expect(scoreCount(server, player.id)).toBe(0);

		const database = new Database(server.databasePath);
		database
			.prepare('UPDATE players SET stage_one_intro_seen_at = ? WHERE id = ?')
			.run(1_700_000_000_000, player.id);
		database.close();

		const second = await acknowledgeStageOneIntro(server, cookie);
		expect(second.status).toBe(204);
		expect(playerRow(server, nickname).stageOneIntroSeenAt).toBe(1_700_000_000_000);
		expect(tokenCount(server, player.id)).toBe(0);
		expect(scoreCount(server, player.id)).toBe(0);
	});

	test('after acknowledge, GET Stage 1 returns today\'s token payload and inserts one handshake', async () => {
		const nickname = 'ReadyRail';
		const cookie = await createLearnPlayer(server, nickname);
		await acknowledgeStageOneIntro(server, cookie);

		const response = await fetch(`${server.baseUrl}/api/attempts/learn/1`, { headers: { cookie } });
		expect(response.status).toBe(200);
		const body = (await response.json()) as { token?: string; stageOneIntro?: boolean };
		expect(body.token).toEqual(expect.any(String));
		expect(body).not.toHaveProperty('stageOneIntro');
		expect(tokenCount(server, playerRow(server, nickname).id)).toBe(1);
	});

	test('intro is Stage 1 only: an open Stage 2 still mints a token, and acknowledging it is 404', async () => {
		const nickname = 'StageTwoStork';
		const cookie = await createLearnPlayer(server, nickname);
		const player = playerRow(server, nickname);
		const database = new Database(server.databasePath);
		database
			.prepare('INSERT INTO stage_unlocks (player_id, stage_id, granted_at) VALUES (?, 1, ?)')
			.run(player.id, Date.now());
		database.close();

		const getTwo = await fetch(`${server.baseUrl}/api/attempts/learn/2`, { headers: { cookie } });
		expect(getTwo.status).toBe(200);
		const body = (await getTwo.json()) as { token?: string; stageOneIntro?: boolean };
		expect(body.token).toEqual(expect.any(String));
		expect(body).not.toHaveProperty('stageOneIntro');

		const tokensBefore = tokenCount(server, player.id);
		const seenBefore = playerRow(server, nickname).stageOneIntroSeenAt;
		const postTwo = await fetch(`${server.baseUrl}/api/attempts/learn/2`, {
			method: 'POST',
			headers: { cookie, 'content-type': 'application/json' },
			body: JSON.stringify({ stageOneIntroSeen: true })
		});
		expect(postTwo.status).toBe(404);
		expect(playerRow(server, nickname).stageOneIntroSeenAt).toBe(seenBefore);
		expect(tokenCount(server, player.id)).toBe(tokensBefore);
		expect(scoreCount(server, player.id)).toBe(0);
	});

	test('transfer carries the acknowledgement; a second Player on the same device still sees the intro', async () => {
		const sourceCookie = await createLearnPlayer(server, 'SeenSandpiper');
		const sourceId = activePlayerIdFrom(sourceCookie);
		await acknowledgeStageOneIntro(server, sourceCookie);

		const generate = await fetch(`${server.baseUrl}/players?/generate`, {
			method: 'POST',
			headers: {
				accept: 'text/html',
				'content-type': 'application/x-www-form-urlencoded',
				cookie: sourceCookie,
				origin: server.baseUrl
			},
			body: new URLSearchParams({ playerId: sourceId }),
			redirect: 'manual'
		});
		expect(generate.status).toBe(200);
		const codes = new Database(server.databasePath, { readonly: true });
		const codeRow = codes
			.prepare('SELECT code FROM transfer_codes WHERE player_id = ?')
			.get(sourceId) as { code: string };
		codes.close();
		const targetCookie = await createLearnPlayer(server, 'NewNightjar');
		const redeem = await fetch(`${server.baseUrl}/players?/redeem`, {
			method: 'POST',
			headers: {
				accept: 'text/html',
				'content-type': 'application/x-www-form-urlencoded',
				cookie: targetCookie,
				origin: server.baseUrl
			},
			body: new URLSearchParams({ code: codeRow.code }),
			redirect: 'manual'
		});
		expect(redeem.status).toBe(303);
		const transferredCookie = redeem.headers.get('set-cookie')!.split(';', 1)[0];
		expect(identityFrom(transferredCookie).active).toBe(sourceId);

		const transferred = await fetch(`${server.baseUrl}/api/attempts/learn/1`, {
			headers: { cookie: transferredCookie }
		});
		expect(transferred.status).toBe(200);
		const transferredBody = (await transferred.json()) as { token?: string; stageOneIntro?: boolean };
		expect(transferredBody.token).toEqual(expect.any(String));
		expect(transferredBody).not.toHaveProperty('stageOneIntro');

		const roommateCookie = await createLearnPlayer(server, 'UnseenUria', sourceCookie);
		const roommate = await fetch(`${server.baseUrl}/api/attempts/learn/1`, {
			headers: { cookie: roommateCookie }
		});
		expect(roommate.status).toBe(200);
		expect(await roommate.json()).toEqual({ stageOneIntro: true });
	});
});
