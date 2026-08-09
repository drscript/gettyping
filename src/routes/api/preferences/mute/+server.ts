import { json } from '@sveltejs/kit';
import { writeMutedPreference } from '$lib/server/identity';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies, request, url }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ message: 'The sound preference could not be saved.' }, { status: 400 });
	}
	if (!body || typeof body !== 'object' || typeof (body as { muted?: unknown }).muted !== 'boolean') {
		return json({ message: 'The sound preference could not be saved.' }, { status: 400 });
	}

	writeMutedPreference(
		cookies,
		(body as { muted: boolean }).muted,
		url.protocol === 'https:'
	);
	return new Response(null, { status: 204 });
};
