import Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { startTestServer, type TestServer } from './server';

interface StartedAttempt {
	token: string;
	exercise: { id: number; content: string };
}

interface KeystrokeEvent {
	expected: string;
	received: string;
	timestampOffsetMs: number;
}

async function createPlayer(server: TestServer, nickname: string): Promise<string> {
	const response = await fetch(`${server.baseUrl}/nickname?/create`, {
		method: 'POST',
		headers: {
			accept: 'text/html',
			'content-type': 'application/x-www-form-urlencoded',
			origin: server.baseUrl
		},
		body: new URLSearchParams({
			track: 'speed-test-practice',
			source: 'typed',
			nickname
		}),
		redirect: 'manual'
	});

	return response.headers.get('set-cookie')!.split(';', 1)[0];
}

function eventsFor(content: string, elapsedMs: number): KeystrokeEvent[] {
	return [...content].map((character, index) => ({
		expected: character,
		received: character,
		timestampOffsetMs: Math.round(((index + 1) / content.length) * elapsedMs)
	}));
}

function eventsAfterLongPause(content: string): KeystrokeEvent[] {
	return [...content].map((character, index) => ({
		expected: character,
		received: character,
		timestampOffsetMs: 30_000 + Math.round(((index + 1) / content.length) * 30_000)
	}));
}

async function startAttempt(server: TestServer, cookie: string): Promise<StartedAttempt> {
	const response = await fetch(`${server.baseUrl}/api/attempts/speed-test`, { headers: { cookie } });
	return (await response.json()) as StartedAttempt;
}

async function submitAttempt(
	server: TestServer,
	cookie: string,
	started: StartedAttempt,
	events: KeystrokeEvent[]
): Promise<void> {
	const response = await fetch(`${server.baseUrl}/api/attempts/speed-test`, {
		method: 'POST',
		headers: { cookie, 'content-type': 'application/json' },
		body: JSON.stringify({ token: started.token, events })
	});
	expect(response.status).toBe(200);
}

describe('Weak-key Profile', () => {
	let server: TestServer;

	beforeAll(async () => {
		server = await startTestServer({
			NET_WPM_CEILING: '1',
			LATENCY_CLAMP_MS: '250',
			WEAK_KEY_DECAY_FACTOR: '0.9'
		});
	});

	afterAll(async () => {
		await server?.stop();
	});

	test('folds an accepted but ineligible Speed Test stream into the Player Weak-key Profile', async () => {
		const cookie = await createPlayer(server, 'ProfilePuffin');
		const startedResponse = await fetch(`${server.baseUrl}/api/attempts/speed-test`, {
			headers: { cookie }
		});
		const started = (await startedResponse.json()) as StartedAttempt;
		const response = await fetch(`${server.baseUrl}/api/attempts/speed-test`, {
			method: 'POST',
			headers: { cookie, 'content-type': 'application/json' },
			body: JSON.stringify({
				token: started.token,
				events: eventsAfterLongPause(started.exercise.content)
			})
		});

		expect(response.status).toBe(200);

		const database = new Database(server.databasePath, { readonly: true });
		const player = database
			.prepare('SELECT id FROM players WHERE nickname = ?')
			.get('ProfilePuffin') as { id: string };
		const profile = database
			.prepare(
				`SELECT attempts, errors, total_latency_ms AS totalLatencyMs
				 FROM weak_key_stats
				 WHERE player_id = ? AND key = 's'`
			)
			.get(player.id);
		const eligibility = database
			.prepare('SELECT leaderboard_eligible AS eligible FROM scores WHERE player_id = ?')
			.get(player.id);
		database.close();

		expect(eligibility).toEqual({ eligible: 0 });
		expect(profile).toMatchObject({ attempts: 6.12579511, errors: 0 });
		expect((profile as { attempts: number; totalLatencyMs: number }).totalLatencyMs).toBeLessThanOrEqual(
			(profile as { attempts: number }).attempts * 250
		);
	});

	test('withholds weakness below the weighted floor and lets sustained clean typing repair a weak key', async () => {
		const cookie = await createPlayer(server, 'DecayDingo');
		const weakAttempt = await startAttempt(server, cookie);
		const weakEvents = eventsFor(weakAttempt.exercise.content, 60_000).map((event) =>
			event.expected === 's' ? { ...event, received: 'x' } : event
		);
		await submitAttempt(server, cookie, weakAttempt, weakEvents);

		const weakProfileResponse = await fetch(`${server.baseUrl}/api/weak-key-profile`, {
			headers: { cookie }
		});
		const weakKeyProfile = (await weakProfileResponse.json()) as {
			keys: Array<{ key: string; weakness: number }>;
		};
		const initialS = weakKeyProfile.keys.find(({ key }) => key === 's');
		const initialX = weakKeyProfile.keys.find(({ key }) => key === 'x');

		expect(initialS?.weakness).toBeGreaterThan(0.7);
		expect(initialX).toBeUndefined();

		for (let attemptNumber = 0; attemptNumber < 5; attemptNumber += 1) {
			const cleanAttempt = await startAttempt(server, cookie);
			await submitAttempt(server, cookie, cleanAttempt, eventsFor(cleanAttempt.exercise.content, 60_000));
		}

		const repairedProfileResponse = await fetch(`${server.baseUrl}/api/weak-key-profile`, {
			headers: { cookie }
		});
		const repairedWeakKeyProfile = (await repairedProfileResponse.json()) as {
			keys: Array<{ key: string; weakness: number }>;
		};
		const repairedS = repairedWeakKeyProfile.keys.find(({ key }) => key === 's');
		expect(repairedS?.weakness).toBeLessThan(initialS!.weakness! / 2);
	});
});
