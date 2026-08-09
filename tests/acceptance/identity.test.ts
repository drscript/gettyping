import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import Database from 'better-sqlite3';
import { startTestServer, type TestServer } from './server';

describe('Player identity', () => {
	let server: TestServer;

	beforeAll(async () => {
		server = await startTestServer();
	});

	afterAll(async () => {
		await server?.stop();
	});

	test('a first-time visitor chooses a Track by intent before choosing a Nickname', async () => {
		const response = await fetch(server.baseUrl);
		const page = await response.text();

		expect(response.status).toBe(200);
		expect(page).toContain('What would you like to do?');
		expect(page).toContain('I want to learn to type');
		expect(page).toContain('I want to get faster');
		expect(page).toContain('href="/nickname?track=learn"');
		expect(page).toContain('href="/nickname?track=speed-test-practice"');
		expect(page).not.toContain('Choose a nickname');
		expect(page).not.toMatch(/for kids|beginner or expert/i);
	});

	test('each Track gets the Nickname step suited to its Player', async () => {
		const [learnResponse, speedResponse] = await Promise.all([
			fetch(`${server.baseUrl}/nickname?track=learn`),
			fetch(`${server.baseUrl}/nickname?track=speed-test-practice`)
		]);
		const learnPage = await learnResponse.text();
		const speedPage = await speedResponse.text();

		expect(learnResponse.status).toBe(200);
		expect(learnPage).toContain('Pick a Nickname');
		expect(learnPage).toContain('data-testid="nickname-card"');
		expect(learnPage).toContain('Different ones');
		expect(learnPage).toContain('Type your own instead');

		expect(speedResponse.status).toBe(200);
		expect(speedPage).toContain('Choose a Nickname');
		expect(speedPage).toContain('name="nickname"');
		expect(speedPage).toContain('public on Leaderboards');
		expect(speedPage).toContain('isn\'t your real name');
		expect(speedPage).not.toContain('Type your own instead');
	});

	test('a curated Nickname creates a Player, long-lived identity cookie, and returning home', async () => {
		const response = await fetch(`${server.baseUrl}/nickname?/create`, {
			method: 'POST',
			headers: {
				accept: 'text/html',
				'content-type': 'application/x-www-form-urlencoded',
				origin: server.baseUrl
			},
			body: new URLSearchParams({
				track: 'learn',
				source: 'curated',
				nickname: 'BraveOtter'
			}),
			redirect: 'manual'
		});
		const setCookie = response.headers.get('set-cookie') ?? '';
		expect(response.status, await response.clone().text()).toBe(303);
		const cookie = setCookie.split(';', 1)[0];
		const encodedCookie = cookie.slice(cookie.indexOf('=') + 1);
		const identity = JSON.parse(decodeURIComponent(encodedCookie));

		expect(response.headers.get('location')).toBe('/?track=learn');
		expect(identity).toEqual({
			active: expect.stringMatching(/^[0-9a-f-]{36}$/),
			players: [expect.stringMatching(/^[0-9a-f-]{36}$/)]
		});
		expect(identity.players[0]).toBe(identity.active);
		expect(setCookie).toMatch(/Max-Age=\d+/i);
		expect(setCookie).toMatch(/HttpOnly/i);
		expect(setCookie).toMatch(/SameSite=Lax/i);

		const database = new Database(server.databasePath, { readonly: true });
		const player = database
			.prepare('SELECT id, nickname FROM players WHERE id = ?')
			.get(identity.active);
		database.close();
		expect(player).toEqual({ id: identity.active, nickname: 'BraveOtter' });

		const homeResponse = await fetch(`${server.baseUrl}/`, {
			headers: { cookie }
		});
		const home = await homeResponse.text();
		expect(homeResponse.status).toBe(200);
		expect(home).toContain('Welcome back');
		expect(home).toContain('BraveOtter');
		expect(home).toContain('>Continue<');
		expect(home).not.toContain('What would you like to do?');
	});

	test('a rejected typed Nickname is neutrally redirected to safe choices', async () => {
		const database = new Database(server.databasePath, { readonly: true });
		const countBefore = (
			database.prepare('SELECT COUNT(*) AS count FROM players').get() as { count: number }
		).count;
		database.close();

		const response = await fetch(`${server.baseUrl}/nickname?/create`, {
			method: 'POST',
			headers: {
				accept: 'text/html',
				'content-type': 'application/x-www-form-urlencoded',
				origin: server.baseUrl
			},
			body: new URLSearchParams({
				track: 'speed-test-practice',
				source: 'typed',
				nickname: 'DamnFox'
			}),
			redirect: 'manual'
		});

		expect(response.status).toBe(303);
		expect(response.headers.get('location')).toBe(
			'/nickname?track=speed-test-practice&notice=unavailable'
		);
		expect(response.headers.get('set-cookie')).toBeNull();

		const redirectedResponse = await fetch(
			`${server.baseUrl}${response.headers.get('location')}`
		);
		const redirectedPage = await redirectedResponse.text();
		expect(redirectedPage).toContain("Let's use a different Nickname");
		expect(redirectedPage).toContain('data-testid="nickname-card"');
		expect(redirectedPage).not.toMatch(/profan|blocked|offen|damn/i);

		const databaseAfter = new Database(server.databasePath, { readonly: true });
		const countAfter = (
			databaseAfter.prepare('SELECT COUNT(*) AS count FROM players').get() as { count: number }
		).count;
		databaseAfter.close();
		expect(countAfter).toBe(countBefore);
	});

	test('the persistent grown-ups route explains identity without blocking the first visit', async () => {
		const [firstVisitResponse, nicknameResponse, grownUpsResponse] = await Promise.all([
			fetch(server.baseUrl),
			fetch(`${server.baseUrl}/nickname?track=learn`),
			fetch(`${server.baseUrl}/grown-ups`)
		]);
		const firstVisit = await firstVisitResponse.text();
		const nicknamePage = await nicknameResponse.text();
		const grownUpsPage = (await grownUpsResponse.text()).replace(/\s+/g, ' ');

		expect(grownUpsResponse.status).toBe(200);
		expect(grownUpsPage).toContain("There's no account");
		expect(grownUpsPage).toContain('no personal information');
		expect(grownUpsPage).toContain('Progress lives in this browser');
		expect(grownUpsPage).toContain('no way to recover progress');
		expect(grownUpsPage).toContain('Nicknames are public');
		expect(grownUpsPage).toContain('public Leaderboards');

		for (const page of [firstVisit, nicknamePage, grownUpsPage]) {
			expect(page).toContain('href="/grown-ups"');
		}
		expect(firstVisit).not.toContain("There's no account");
		expect(firstVisit).not.toContain('no way to recover progress');
	});
});
