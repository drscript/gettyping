import { readMutedPreference } from '$lib/server/identity';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ cookies }) => ({
	muted: readMutedPreference(cookies)
});
