import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { startTestServer, type TestServer } from './server';

const adminToken = 'a-very-long-test-admin-token';

describe('Admin access gate', () => {
	let server: TestServer;

	beforeAll(async () => {
		server = await startTestServer({ ADMIN_TOKEN: adminToken });
	});

	afterAll(async () => {
		await server?.stop();
	});

	test('an unauthenticated visitor to /admin is redirected to the login page', async () => {
		const response = await fetch(`${server.baseUrl}/admin`, { redirect: 'manual' });

		expect(response.status).toBe(303);
		expect(response.headers.get('location')).toBe('/admin/login');
	});

	test('an unauthenticated visitor to a nested /admin route is also redirected', async () => {
		const response = await fetch(`${server.baseUrl}/admin/anything`, { redirect: 'manual' });

		expect(response.status).toBe(303);
		expect(response.headers.get('location')).toBe('/admin/login');
	});

	test('the login page itself is reachable without a session', async () => {
		const response = await fetch(`${server.baseUrl}/admin/login`);
		expect(response.status).toBe(200);
	});

	test('an incorrect token is rejected and no session is granted', async () => {
		const response = await fetch(`${server.baseUrl}/admin/login`, {
			method: 'POST',
			headers: {
				accept: 'text/html',
				'content-type': 'application/x-www-form-urlencoded',
				origin: server.baseUrl
			},
			body: new URLSearchParams({ token: 'wrong-token' })
		});

		expect(response.status).toBe(401);
		expect(response.headers.get('set-cookie')).toBeNull();
	});

	test('the correct token grants a long-lived, httpOnly session and reaches /admin', async () => {
		const loginResponse = await fetch(`${server.baseUrl}/admin/login`, {
			method: 'POST',
			headers: {
				accept: 'text/html',
				'content-type': 'application/x-www-form-urlencoded',
				origin: server.baseUrl
			},
			body: new URLSearchParams({ token: adminToken }),
			redirect: 'manual'
		});
		const setCookie = loginResponse.headers.get('set-cookie') ?? '';

		expect(loginResponse.status).toBe(303);
		expect(loginResponse.headers.get('location')).toBe('/admin');
		expect(setCookie).toMatch(/HttpOnly/i);
		expect(setCookie).toMatch(/SameSite=Lax/i);
		expect(setCookie).toMatch(/Max-Age=\d+/i);

		const cookie = setCookie.split(';', 1)[0];
		const adminResponse = await fetch(`${server.baseUrl}/admin`, { headers: { cookie } });
		expect(adminResponse.status).toBe(200);
		expect(await adminResponse.text()).toContain('Admin');
	});
});
