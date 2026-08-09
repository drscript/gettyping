import { getRuntimeConfiguration } from '$lib/server/runtime/configuration';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	speedTestFloorWpm: getRuntimeConfiguration().speedTestFloorWpm
});
