import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createPlayerCookie } from './player';
import { startTestServer, type TestServer } from './server';

describe('device audio preference', () => {
	let server: TestServer;

	beforeAll(async () => {
		server = await startTestServer();
	});

	afterAll(async () => {
		await server?.stop();
	});

	test('sound defaults on and mute persists while Players change', async () => {
		const firstCookie = await createPlayerCookie(server, 'QuietQuail');
		const secondCookie = await createPlayerCookie(server, 'SharedShrike', {
			existingCookie: firstCookie
		});
		const identity = JSON.parse(decodeURIComponent(secondCookie.split('=', 2)[1])) as {
			active: string;
			players: string[];
		};

		const initialPage = await fetch(server.baseUrl, { headers: { cookie: secondCookie } });
		expect(await initialPage.text()).toContain('aria-label="Sound on. Mute sound"');

		const muteResponse = await fetch(`${server.baseUrl}/api/preferences/mute`, {
			method: 'POST',
			headers: { cookie: secondCookie, 'content-type': 'application/json' },
			body: JSON.stringify({ muted: true })
		});
		expect(muteResponse.status).toBe(204);
		const mutedCookie = muteResponse.headers.get('set-cookie')!.split(';', 1)[0];
		const mutedIdentity = JSON.parse(decodeURIComponent(mutedCookie.split('=', 2)[1]));
		expect(mutedIdentity).toEqual({ ...identity, muted: true });

		const mutedPage = await fetch(server.baseUrl, { headers: { cookie: mutedCookie } });
		expect(await mutedPage.text()).toContain('aria-label="Sound muted. Turn sound on"');

		const switchResponse = await fetch(`${server.baseUrl}/players?/switch`, {
			method: 'POST',
			headers: {
				accept: 'text/html',
				'content-type': 'application/x-www-form-urlencoded',
				cookie: mutedCookie,
				origin: server.baseUrl
			},
			body: new URLSearchParams({ playerId: identity.players[0] }),
			redirect: 'manual'
		});
		const switchedCookie = switchResponse.headers.get('set-cookie')!.split(';', 1)[0];
		const switchedIdentity = JSON.parse(decodeURIComponent(switchedCookie.split('=', 2)[1]));
		expect(switchedIdentity).toEqual({
			active: identity.players[0],
			players: identity.players,
			muted: true
		});

		const switchedPage = await fetch(server.baseUrl, { headers: { cookie: switchedCookie } });
		expect(await switchedPage.text()).toContain('aria-label="Sound muted. Turn sound on"');
	});
});
