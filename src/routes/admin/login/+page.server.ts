import { fail, redirect } from '@sveltejs/kit';
import { isValidAdminToken, writeAdminSession } from '$lib/server/admin-auth';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const data = await request.formData();
		const token = data.get('token')?.toString() ?? '';

		if (!isValidAdminToken(token)) {
			return fail(401, { message: 'That token is not valid.' });
		}

		writeAdminSession(cookies, token, url.protocol === 'https:');
		redirect(303, '/admin');
	}
};
