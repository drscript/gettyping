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

const loginRateLimitWindowMs = 15 * 60 * 1000;
const loginRateLimitMaxAttempts = 5;

interface LoginAttemptWindow {
	count: number;
	windowStart: number;
}

const failedLoginAttemptsByIp = new Map<string, LoginAttemptWindow>();

/** Seconds until the caller's failed-attempt window resets, or null if they're not currently limited. */
export function adminLoginRateLimitStatus(ip: string): number | null {
	const attempt = failedLoginAttemptsByIp.get(ip);
	if (!attempt) return null;

	const elapsedMs = Date.now() - attempt.windowStart;
	if (elapsedMs >= loginRateLimitWindowMs) return null;
	if (attempt.count < loginRateLimitMaxAttempts) return null;

	return Math.ceil((loginRateLimitWindowMs - elapsedMs) / 1000);
}

export function recordFailedAdminLogin(ip: string): void {
	const now = Date.now();
	const attempt = failedLoginAttemptsByIp.get(ip);

	if (!attempt || now - attempt.windowStart >= loginRateLimitWindowMs) {
		failedLoginAttemptsByIp.set(ip, { count: 1, windowStart: now });
		return;
	}

	attempt.count += 1;
}

export function recordSuccessfulAdminLogin(ip: string): void {
	failedLoginAttemptsByIp.delete(ip);
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
