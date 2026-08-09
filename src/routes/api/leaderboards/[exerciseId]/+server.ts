import { error, json } from '@sveltejs/kit';
import { requireActivePlayer } from '$lib/server/active-player';
import { readLeaderboard } from '$lib/server/leaderboards';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ cookies, params }) => {
	const exerciseId = Number(params.exerciseId);
	if (!Number.isInteger(exerciseId) || exerciseId < 1) error(404, 'Exercise not found');
	const player = requireActivePlayer(cookies, 'Choose a Nickname before viewing a Leaderboard');
	const leaderboard = readLeaderboard(exerciseId, player.id);
	if (!leaderboard) error(404, 'Exercise not found');
	return json(leaderboard);
};
