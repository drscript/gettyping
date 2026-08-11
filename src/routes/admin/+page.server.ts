import { readAdminStats } from '$lib/server/admin-stats';
import { getDatabase } from '$lib/server/database';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { stats: readAdminStats(getDatabase()) };
};
