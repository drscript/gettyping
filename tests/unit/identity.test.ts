import { describe, expect, test } from 'vitest';
import { deviceHasRoomForAnotherPlayer, identityPlayerCap, type IdentityCookie } from '../../src/lib/server/identity';

function identityWithPlayers(count: number): IdentityCookie {
	const players = Array.from({ length: count }, (_, index) => `player-${index}`);
	return { active: players[0], players };
}

describe('deviceHasRoomForAnotherPlayer', () => {
	test('has room when well under the cap', () => {
		expect(deviceHasRoomForAnotherPlayer(identityWithPlayers(1))).toBe(true);
	});

	test('has room at one below the cap', () => {
		expect(deviceHasRoomForAnotherPlayer(identityWithPlayers(identityPlayerCap - 1))).toBe(true);
	});

	test('has no room once at the cap', () => {
		expect(deviceHasRoomForAnotherPlayer(identityWithPlayers(identityPlayerCap))).toBe(false);
	});

	test('has no room past the cap', () => {
		expect(deviceHasRoomForAnotherPlayer(identityWithPlayers(identityPlayerCap + 5))).toBe(false);
	});
});
