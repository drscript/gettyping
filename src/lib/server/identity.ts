import type { Cookies } from '@sveltejs/kit';

export const identityCookieName = 'gettyping_identity';

export interface IdentityCookie {
	active: string;
	players: string[];
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
		candidate.players.includes(candidate.active)
	);
}

export function readIdentity(cookies: Cookies): IdentityCookie | undefined {
	const value = cookies.get(identityCookieName);
	if (!value) return undefined;

	try {
		const parsed: unknown = JSON.parse(value);
		return isIdentityCookie(parsed) ? parsed : undefined;
	} catch {
		return undefined;
	}
}

export function writeIdentity(cookies: Cookies, identity: IdentityCookie, secure: boolean): void {
	cookies.set(identityCookieName, JSON.stringify(identity), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure,
		maxAge: fiveYearsInSeconds
	});
}
