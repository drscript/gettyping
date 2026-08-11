import { timingSafeEqual } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';

export const adminSessionCookieName = 'gettyping_admin_session';
export const adminLoginPath = '/admin/login';

const sevenDaysInSeconds = 60 * 60 * 24 * 7;

export function isValidAdminToken(candidate: string | undefined | null): boolean {
	const expected = process.env.ADMIN_TOKEN;
	if (!expected || !candidate) return false;

	const expectedBuffer = Buffer.from(expected);
	const candidateBuffer = Buffer.from(candidate);
	if (expectedBuffer.length !== candidateBuffer.length) return false;

	return timingSafeEqual(expectedBuffer, candidateBuffer);
}

export function hasValidAdminSession(cookies: Cookies): boolean {
	return isValidAdminToken(cookies.get(adminSessionCookieName));
}

export function writeAdminSession(cookies: Cookies, token: string, secure: boolean): void {
	cookies.set(adminSessionCookieName, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure,
		maxAge: sevenDaysInSeconds
	});
}
