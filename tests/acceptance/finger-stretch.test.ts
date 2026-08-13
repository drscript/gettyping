import Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { startTestServer, type TestServer } from './server';
import { createPlayerCookie } from './player';

interface StartedStretch {
	token: string;
	exercise: { content: string };
}

interface KeystrokeEvent {
	expected: string;
	received: string;
	timestampOffsetMs: number;
}

function correctEvents(content: string): KeystrokeEvent[] {
	return [...content].map((character, index) => ({
		expected: character,
		received: character,
		timestampOffsetMs: Math.round(((index + 1) / content.length) * 30_000)
	}));
}

async function startStretch(server: TestServer, cookie: string, stageId = 1): Promise<StartedStretch> {
	const response = await fetch(`${server.baseUrl}/api/attempts/stretch/${stageId}`, {
		headers: { cookie }
	});
	expect(response.status).toBe(200);
	return (await response.json()) as StartedStretch;
}

describe('Finger stretch', () => {
	let server: TestServer;

	beforeAll(async () => {
		server = await startTestServer();
	});

	afterAll(async () => {
		await server?.stop();
	});

	test('serves Stage 1 content drawn only from f and j', async () => {
		const cookie = await createPlayerCookie(server, 'StretchStarling', { track: 'learn' });
		const started = await startStretch(server, cookie);

		expect(started.token).toEqual(expect.any(String));
		expect(started.exercise.content).toMatch(/^[fj ]+$/);
	});

	test('403s when the Stage is not open yet', async () => {
		const cookie = await createPlayerCookie(server, 'StretchSparrow', { track: 'learn' });
		const response = await fetch(`${server.baseUrl}/api/attempts/stretch/2`, { headers: { cookie } });
		expect(response.status).toBe(403);
	});

	test('completing a stretch writes no Score but folds the Weak-key Profile, and returns only accuracy', async () => {
		const nickname = 'StretchSwift';
		const cookie = await createPlayerCookie(server, nickname, { track: 'learn' });
		const started = await startStretch(server, cookie);

		const response = await fetch(`${server.baseUrl}/api/attempts/stretch/1`, {
			method: 'POST',
			headers: { cookie, 'content-type': 'application/json' },
			body: JSON.stringify({ token: started.token, events: correctEvents(started.exercise.content) })
		});
		expect(response.status).toBe(200);
		const body = (await response.json()) as Record<string, unknown>;
		expect(body).toEqual({ accuracy: 1 });

		const database = new Database(server.databasePath, { readonly: true });
		const player = database
			.prepare('SELECT id FROM players WHERE nickname = ?')
			.get(nickname) as { id: string };
		const scoreCount = database
			.prepare('SELECT COUNT(*) AS count FROM scores WHERE player_id = ?')
			.get(player.id) as { count: number };
		const weakKeyRow = database
			.prepare("SELECT attempts FROM weak_key_stats WHERE player_id = ? AND key = 'f'")
			.get(player.id) as { attempts: number } | undefined;
		database.close();

		expect(scoreCount.count).toBe(0);
		expect(weakKeyRow?.attempts).toBeGreaterThan(0);
	});

	test('rejects a structurally invalid submission and folds nothing', async () => {
		const nickname = 'StretchStork';
		const cookie = await createPlayerCookie(server, nickname, { track: 'learn' });
		const started = await startStretch(server, cookie);

		const response = await fetch(`${server.baseUrl}/api/attempts/stretch/1`, {
			method: 'POST',
			headers: { cookie, 'content-type': 'application/json' },
			body: JSON.stringify({
				token: started.token,
				// A single event can never advance the cursor to the full
				// content length, so this is structurally incomplete.
				events: [{ expected: 'f', received: 'z', timestampOffsetMs: 1 }]
			})
		});
		expect(response.status).toBe(400);

		const database = new Database(server.databasePath, { readonly: true });
		const player = database
			.prepare('SELECT id FROM players WHERE nickname = ?')
			.get(nickname) as { id: string };
		const weakKeyRow = database
			.prepare("SELECT attempts FROM weak_key_stats WHERE player_id = ? AND key = 'f'")
			.get(player.id) as { attempts: number } | undefined;
		database.close();

		expect(weakKeyRow).toBeUndefined();
	});
});
