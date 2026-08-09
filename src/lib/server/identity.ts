import type { Cookies } from '@sveltejs/kit';

export const identityCookieName = 'gettyping_identity';

export interface IdentityCookie {
	active: string;
	players: string[];
	muted?: boolean;
}

const fiveYearsInSeconds = 60 * 60 * 24 * 365 * 5;

function isIdentityCookie(value: unknown): value is IdentityCookie {
	if (!value || typeof value !== 'object') return false;

	const candidate = value as Partial<IdentityCookie>;
	return (
		typeof candidate.active === 'string' &&
		Array.isArray(candidate.players) &&
		candidate.players.length > 0 &&
		candidate.players.every((playerId) => typeof playerId === 'string') &&
		candidate.players.includes(candidate.active) &&
		(candidate.muted === undefined || typeof candidate.muted === 'boolean')
	);
}

function readCookieValue(cookies: Cookies): unknown {
	const value = cookies.get(identityCookieName);
	if (!value) return undefined;

	try {
		return JSON.parse(value);
	} catch {
		return undefined;
	}
}

export function readIdentity(cookies: Cookies): IdentityCookie | undefined {
	const value = readCookieValue(cookies);
	return isIdentityCookie(value) ? value : undefined;
}

export function readMutedPreference(cookies: Cookies): boolean {
	const value = readCookieValue(cookies);
	return Boolean(value && typeof value === 'object' && (value as { muted?: unknown }).muted === true);
}

function cookieOptions(secure: boolean) {
	return {
		path: '/' as const,
		httpOnly: true,
		sameSite: 'lax' as const,
		secure,
		maxAge: fiveYearsInSeconds
	};
}

export function writeIdentity(cookies: Cookies, identity: IdentityCookie, secure: boolean): void {
	cookies.set(identityCookieName, JSON.stringify(identity), cookieOptions(secure));
}

export function writeMutedPreference(cookies: Cookies, muted: boolean, secure: boolean): void {
	const identity = readIdentity(cookies);
	cookies.set(
		identityCookieName,
		JSON.stringify(identity ? { ...identity, muted } : { muted }),
		cookieOptions(secure)
	);
}
