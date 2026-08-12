import { eq, inArray } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { curatedNicknames } from '$lib/nicknames';
import { getDatabase } from '$lib/server/database';
import { players } from '$lib/server/database/schema';
import { readIdentity, writeIdentity, type IdentityCookie } from '$lib/server/identity';
import { acceptedNicknameChoice } from '$lib/server/nickname-policy';
import { generateTransferCode } from '$lib/server/transfer-codes';
import type { Actions, PageServerLoad } from './$types';

type PlayerLookup = { player: { id: string; nickname: string } } | { error: string };

function resolvePlayerOnDevice(
	identity: IdentityCookie,
	playerId: FormDataEntryValue | null
): PlayerLookup {
	if (typeof playerId !== 'string' || !identity.players.includes(playerId)) {
		return { error: 'That Player is not available on this device.' };
	}

	const player = getDatabase()
		.select({ id: players.id, nickname: players.nickname })
		.from(players)
		.where(eq(players.id, playerId))
		.get();
	if (!player) return { error: 'That Player is no longer available.' };

	return { player };
}

export const load: PageServerLoad = ({ cookies, url }) => {
	const identity = readIdentity(cookies);
	if (!identity) redirect(303, '/');

	const playersById = new Map(
		getDatabase()
			.select({ id: players.id, nickname: players.nickname })
			.from(players)
			.where(inArray(players.id, identity.players))
			.all()
			.map((player) => [player.id, player])
	);

	return {
		activePlayerId: identity.active,
		candidates: curatedNicknames.slice(0, 6),
		nicknameUnavailable: url.searchParams.get('notice') === 'unavailable',
		nicknameRenamed: url.searchParams.get('notice') === 'renamed',
		players: identity.players.flatMap((playerId) => {
			const player = playersById.get(playerId);
			return player ? [player] : [];
		})
	};
};

export const actions: Actions = {
	switch: async ({ cookies, request, url }) => {
		const identity = readIdentity(cookies);
		if (!identity) redirect(303, '/');

		const data = await request.formData();
		const lookup = resolvePlayerOnDevice(identity, data.get('playerId'));
		if ('error' in lookup) return fail(400, { message: lookup.error });

		writeIdentity(cookies, { ...identity, active: lookup.player.id }, url.protocol === 'https:');
		redirect(303, '/');
	},
	rename: async ({ cookies, request }) => {
		const identity = readIdentity(cookies);
		if (!identity) redirect(303, '/');

		const data = await request.formData();
		const nickname = acceptedNicknameChoice(data.get('source'), data.get('nickname'));
		if (nickname === undefined) {
			redirect(303, '/players?notice=unavailable');
		}

		const updated = getDatabase()
			.update(players)
			.set({ nickname })
			.where(eq(players.id, identity.active))
			.returning({ id: players.id })
			.get();
		if (!updated) redirect(303, '/');
		redirect(303, '/players?notice=renamed');
	},
	generate: async ({ cookies, request }) => {
		const identity = readIdentity(cookies);
		if (!identity) redirect(303, '/');

		const data = await request.formData();
		const lookup = resolvePlayerOnDevice(identity, data.get('playerId'));
		if ('error' in lookup) return fail(400, { message: lookup.error });

		const code = generateTransferCode(lookup.player.id);
		return { code, nickname: lookup.player.nickname };
	}
};
