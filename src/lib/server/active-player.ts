import { eq } from 'drizzle-orm';
import { error, type Cookies } from '@sveltejs/kit';
import { getDatabase } from './database';
import { players } from './database/schema';
import { readIdentity } from './identity';

export function requireActivePlayer(cookies: Cookies, unauthenticatedMessage: string): { id: string } {
	const identity = readIdentity(cookies);
	if (!identity) error(401, unauthenticatedMessage);

	const player = getDatabase()
		.select({ id: players.id })
		.from(players)
		.where(eq(players.id, identity.active))
		.get();
	if (!player) error(401, unauthenticatedMessage);
	return player;
}
