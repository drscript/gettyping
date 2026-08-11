import type { Handle } from '@sveltejs/kit';
import { adminLoginPath, hasValidAdminSession } from '$lib/server/admin-auth';

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;
	const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');

	if (isAdminRoute && pathname !== adminLoginPath && !hasValidAdminSession(event.cookies)) {
		return new Response(null, { status: 303, headers: { location: adminLoginPath } });
	}

	return resolve(event);
};
