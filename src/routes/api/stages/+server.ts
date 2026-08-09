import { stages } from '$lib/server/database/schema';
import { getDatabase } from '$lib/server/database';
import { asc } from 'drizzle-orm';
import { json } from '@sveltejs/kit';

export function GET() {
	const curriculum = getDatabase().select().from(stages).orderBy(asc(stages.id)).all();

	return json({ stages: curriculum });
}
