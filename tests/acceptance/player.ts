import type { TestServer } from './server';

export async function createPlayerCookie(
	server: TestServer,
	nickname: string,
	options: {
		existingCookie?: string;
		track?: 'learn' | 'speed-test-practice';
		source?: 'curated' | 'typed';
	} = {}
): Promise<string> {
	const response = await fetch(`${server.baseUrl}/nickname?/create`, {
		method: 'POST',
		headers: {
			accept: 'text/html',
			'content-type': 'application/x-www-form-urlencoded',
			...(options.existingCookie ? { cookie: options.existingCookie } : {}),
			origin: server.baseUrl
		},
		body: new URLSearchParams({
			track: options.track ?? 'speed-test-practice',
			source: options.source ?? 'typed',
			nickname
		}),
		redirect: 'manual'
	});
	const cookie = response.headers.get('set-cookie')?.split(';', 1)[0];
	if (response.status !== 303 || !cookie) {
		throw new Error(`Could not create test Player ${nickname}: ${response.status}`);
	}
	return cookie;
}
