import { fail, redirect } from '@sveltejs/kit';
import {
	adminLoginRateLimitStatus,
	isValidAdminToken,
	recordFailedAdminLogin,
	recordSuccessfulAdminLogin,
	writeAdminSession
} from '$lib/server/admin-auth';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies, url, getClientAddress, setHeaders }) => {
		const ip = getClientAddress();

		const retryAfterSeconds = adminLoginRateLimitStatus(ip);
		if (retryAfterSeconds !== null) {
			setHeaders({ 'retry-after': String(retryAfterSeconds) });
			return fail(429, {
				message: `Too many attempts. Try again in ${Math.ceil(retryAfterSeconds / 60)} minute(s).`
			});
		}

		const data = await request.formData();
		const token = data.get('token')?.toString() ?? '';

		if (!isValidAdminToken(token)) {
			recordFailedAdminLogin(ip);
			return fail(401, { message: 'That token is not valid.' });
		}

		recordSuccessfulAdminLogin(ip);
		writeAdminSession(cookies, token, url.protocol === 'https:');
		redirect(303, '/admin');
	}
};
