import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import Database from 'better-sqlite3';
import { createPlayerCookie } from './player';
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

	test('a shared device keeps every Player while switching the active Player', async () => {
		const firstCookie = await createPlayerCookie(server, 'SunnyFox', {
			track: 'learn',
			source: 'curated'
		});
		const secondCookie = await createPlayerCookie(server, 'SecondSwift', {
			existingCookie: firstCookie
		});
		const secondIdentity = JSON.parse(decodeURIComponent(secondCookie.split('=', 2)[1])) as {
			active: string;
			players: string[];
		};

		const homeResponse = await fetch(server.baseUrl, { headers: { cookie: secondCookie } });
		const home = await homeResponse.text();
		expect(home).toContain('SecondSwift');
		expect(home).toContain('href="/players"');
		expect(home).toContain('Not you?');

		const pickerResponse = await fetch(`${server.baseUrl}/players`, {
			headers: { cookie: secondCookie }
		});
		const picker = await pickerResponse.text();
		expect(pickerResponse.status).toBe(200);
		expect(picker).toContain('SunnyFox');
		expect(picker).toContain('SecondSwift');
		expect(picker).toContain('Add another Player');

		const switchResponse = await fetch(`${server.baseUrl}/players?/switch`, {
			method: 'POST',
			headers: {
				accept: 'text/html',
				'content-type': 'application/x-www-form-urlencoded',
				cookie: secondCookie,
				origin: server.baseUrl
			},
			body: new URLSearchParams({ playerId: secondIdentity.players[0] }),
			redirect: 'manual'
		});
		const switchedCookie = switchResponse.headers.get('set-cookie')!.split(';', 1)[0];
		const switchedIdentity = JSON.parse(decodeURIComponent(switchedCookie.split('=', 2)[1]));

		expect(switchResponse.status).toBe(303);
		expect(switchResponse.headers.get('location')).toBe('/');
		expect(switchedIdentity).toEqual({
			active: secondIdentity.players[0],
			players: secondIdentity.players
		});

		const switchedHome = await fetch(server.baseUrl, { headers: { cookie: switchedCookie } });
		expect(await switchedHome.text()).toContain('SunnyFox');
	});

	test('renaming applies the Nickname policy and never rewrites earlier Scores', async () => {
		const cookie = await createPlayerCookie(server, 'OriginalOrca');
		const identity = JSON.parse(decodeURIComponent(cookie.split('=', 2)[1])) as {
			active: string;
		};
		const database = new Database(server.databasePath);
		database
			.prepare(
				`INSERT INTO scores
				 (player_id, exercise_id, nickname, net_wpm, gross_wpm, accuracy, elapsed_ms,
				  char_count, error_count, leaderboard_eligible, created_at)
				 VALUES (?, 22, 'OriginalOrca', 10, 10, 1, 60000, 50, 0, 1, ?)`
			)
			.run(identity.active, Date.now() - 1_000);
		database.close();

		const rejectedResponse = await fetch(`${server.baseUrl}/players?/rename`, {
			method: 'POST',
			headers: {
				accept: 'text/html',
				'content-type': 'application/x-www-form-urlencoded',
				cookie,
				origin: server.baseUrl
			},
			body: new URLSearchParams({ source: 'typed', nickname: 'DamnFox' }),
			redirect: 'manual'
		});
		expect(rejectedResponse.status).toBe(303);
		expect(rejectedResponse.headers.get('location')).toBe('/players?notice=unavailable');

		const curatedResponse = await fetch(`${server.baseUrl}/players?/rename`, {
			method: 'POST',
			headers: {
				accept: 'text/html',
				'content-type': 'application/x-www-form-urlencoded',
				cookie,
				origin: server.baseUrl
			},
			body: new URLSearchParams({ source: 'curated', nickname: 'BraveOtter' }),
			redirect: 'manual'
		});
		expect(curatedResponse.status).toBe(303);
		expect(curatedResponse.headers.get('location')).toBe('/players?notice=renamed');

		const startedResponse = await fetch(`${server.baseUrl}/api/attempts/speed-test`, {
			headers: { cookie }
		});
		const started = (await startedResponse.json()) as {
			token: string;
			exercise: { content: string };
		};
		const submitResponse = await fetch(`${server.baseUrl}/api/attempts/speed-test`, {
			method: 'POST',
			headers: { cookie, 'content-type': 'application/json' },
			body: JSON.stringify({
				token: started.token,
				events: [...started.exercise.content].map((character, index) => ({
					expected: character,
					received: character,
					timestampOffsetMs: Math.round(
						((index + 1) / started.exercise.content.length) * 60_000
					)
				}))
			})
		});
		const completed = (await submitResponse.json()) as {
			leaderboard: { personal: { nickname: string } };
		};
		expect(submitResponse.status).toBe(200);
		expect(completed.leaderboard.personal.nickname).toBe('BraveOtter');

		const databaseAfter = new Database(server.databasePath, { readonly: true });
		const player = databaseAfter
			.prepare('SELECT nickname FROM players WHERE id = ?')
			.get(identity.active);
		const scoreNicknames = databaseAfter
			.prepare('SELECT nickname FROM scores WHERE player_id = ? ORDER BY id')
			.all(identity.active);
		databaseAfter.close();
		expect(player).toEqual({ nickname: 'BraveOtter' });
		expect(scoreNicknames).toEqual([
			{ nickname: 'OriginalOrca' },
			{ nickname: 'BraveOtter' }
		]);
	});

	test('Players sharing one cookie keep separate Stage progress and Weak-key Profiles', async () => {
		const firstCookie = await createPlayerCookie(server, 'FirstFinch', {
			track: 'learn'
		});
		const firstIdentity = JSON.parse(decodeURIComponent(firstCookie.split('=', 2)[1])) as {
			active: string;
		};
		const database = new Database(server.databasePath);
		database
			.prepare(
				`INSERT INTO scores
				 (player_id, exercise_id, nickname, net_wpm, gross_wpm, accuracy, elapsed_ms,
				  char_count, error_count, leaderboard_eligible, created_at)
				 VALUES (?, 1, 'FirstFinch', 12, 12, 1, 60000, 60, 0, 1, ?)`
			)
			.run(firstIdentity.active, Date.now());
		database
			.prepare(
				`INSERT INTO weak_key_stats (player_id, key, attempts, errors, total_latency_ms)
				 VALUES (?, 'q', 5, 3, 5000)`
			)
			.run(firstIdentity.active);
		database.close();

		const secondCookie = await createPlayerCookie(server, 'SecondSwan', {
			existingCookie: firstCookie,
			track: 'learn'
		});

		const secondHomeResponse = await fetch(server.baseUrl, { headers: { cookie: secondCookie } });
		const secondHome = await secondHomeResponse.text();
		expect(secondHome).not.toContain('data-stage-state="cleared"');
		const secondProfile = await fetch(`${server.baseUrl}/api/weak-key-profile`, {
			headers: { cookie: secondCookie }
		});
		expect(await secondProfile.json()).toEqual({ keys: [] });

		const switchResponse = await fetch(`${server.baseUrl}/players?/switch`, {
			method: 'POST',
			headers: {
				accept: 'text/html',
				'content-type': 'application/x-www-form-urlencoded',
				cookie: secondCookie,
				origin: server.baseUrl
			},
			body: new URLSearchParams({ playerId: firstIdentity.active }),
			redirect: 'manual'
		});
		const switchedCookie = switchResponse.headers.get('set-cookie')!.split(';', 1)[0];
		const firstHomeResponse = await fetch(server.baseUrl, { headers: { cookie: switchedCookie } });
		expect(await firstHomeResponse.text()).toContain('data-stage-state="cleared"');
		const firstProfile = await fetch(`${server.baseUrl}/api/weak-key-profile`, {
			headers: { cookie: switchedCookie }
		});
		expect(await firstProfile.json()).toMatchObject({ keys: [{ key: 'q' }] });
	});
});
