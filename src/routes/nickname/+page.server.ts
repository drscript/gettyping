import { randomUUID } from 'node:crypto';
import { error, redirect } from '@sveltejs/kit';
import { getDatabase } from '$lib/server/database';
import { players } from '$lib/server/database/schema';
import { readIdentity, readMutedPreference, writeIdentity } from '$lib/server/identity';
import { acceptedNicknameChoice } from '$lib/server/nickname-policy';
import { curatedNicknames } from '$lib/nicknames';
import type { TrackFlex } from '$lib/ui/types';
import type { Actions, PageServerLoad } from './$types';

function selectedTrack(value: string | null): TrackFlex {
	if (value === 'learn' || value === 'speed-test-practice') return value;
	redirect(303, '/');
}

export const load: PageServerLoad = ({ url }) => {
	const track = selectedTrack(url.searchParams.get('track'));

	if (curatedNicknames.length < 6) {
		error(500, 'Not enough curated Nicknames are configured');
	}

	return {
		track,
		candidates: curatedNicknames,
		nicknameUnavailable: url.searchParams.get('notice') === 'unavailable'
	};
};

export const actions: Actions = {
	create: async ({ request, cookies, url }) => {
		const data = await request.formData();
		const track = selectedTrack(data.get('track')?.toString() ?? null);
		const nickname = acceptedNicknameChoice(data.get('source'), data.get('nickname'));
		if (nickname === undefined) {
			redirect(303, `/nickname?track=${track}&notice=unavailable`);
		}

		const playerId = randomUUID();
		getDatabase()
			.insert(players)
			.values({ id: playerId, nickname, createdAt: Date.now() })
			.run();

		const previousIdentity = readIdentity(cookies);
		writeIdentity(
			cookies,
			{
				active: playerId,
				players: [...(previousIdentity?.players ?? []), playerId],
				...(readMutedPreference(cookies) ? { muted: true } : {})
			},
			url.protocol === 'https:'
		);

		redirect(303, `/?track=${track}`);
	}
};
