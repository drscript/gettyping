import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { startTestServer, type TestServer } from './server';

const adminToken = 'a-very-long-test-admin-token';

async function attemptLogin(server: TestServer, token: string, ip: string): Promise<Response> {
	return fetch(`${server.baseUrl}/admin/login`, {
		method: 'POST',
		headers: {
			accept: 'text/html',
			'content-type': 'application/x-www-form-urlencoded',
			origin: server.baseUrl,
			'fly-client-ip': ip
		},
		body: new URLSearchParams({ token }),
		redirect: 'manual'
	});
}

describe('Admin login rate limiting', () => {
	let server: TestServer;

	beforeAll(async () => {
		server = await startTestServer({ ADMIN_TOKEN: adminToken, ADDRESS_HEADER: 'Fly-Client-IP' });
	});

	afterAll(async () => {
		await server?.stop();
	});

	test('a sixth failed attempt from the same IP within the window is rate limited', async () => {
		const ip = '203.0.113.10';

		for (let attempt = 0; attempt < 5; attempt += 1) {
			const response = await attemptLogin(server, 'wrong-token', ip);
			expect(response.status).toBe(401);
		}

		const limited = await attemptLogin(server, 'wrong-token', ip);
		expect(limited.status).toBe(429);
		expect(limited.headers.get('retry-after')).toMatch(/^\d+$/);
	});

	test('the correct token is also rejected once an IP is rate limited', async () => {
		const ip = '203.0.113.11';

		for (let attempt = 0; attempt < 5; attempt += 1) {
			await attemptLogin(server, 'wrong-token', ip);
		}

		const limited = await attemptLogin(server, adminToken, ip);
		expect(limited.status).toBe(429);
	});

	test('a different IP is unaffected by another IP exhausting its attempts', async () => {
		const exhaustedIp = '203.0.113.12';
		const freshIp = '203.0.113.13';

		for (let attempt = 0; attempt < 6; attempt += 1) {
			await attemptLogin(server, 'wrong-token', exhaustedIp);
		}

		const stillWorks = await attemptLogin(server, adminToken, freshIp);
		expect(stillWorks.status).toBe(303);
	});

	test('a successful login resets the failed-attempt count for that IP', async () => {
		const ip = '203.0.113.14';

		for (let attempt = 0; attempt < 4; attempt += 1) {
			await attemptLogin(server, 'wrong-token', ip);
		}

		const success = await attemptLogin(server, adminToken, ip);
		expect(success.status).toBe(303);

		for (let attempt = 0; attempt < 4; attempt += 1) {
			const response = await attemptLogin(server, 'wrong-token', ip);
			expect(response.status).toBe(401);
		}
	});
});
