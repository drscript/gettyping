// PROTOTYPE: Mock weakness data for heat map keyboard variants
// This simulates a player with realistic typing patterns

export interface MockWeakKey {
	key: string;
	weakness: number; // 0.0 to 1.0
}

// Mock player data: realistic distribution of weaknesses
// Max weakness is 0.72 (the 'p' key in this example)
// Keys at >= 50% of max (>= 0.36) show percentages
export const mockWeaknessMap: Map<string, number> = new Map([
	// Letters - some weak, some strong, many neutral
	['a', 0.08],
	['s', 0.12],
	['d', 0.05],
	['f', 0.15],
	['g', 0.22],
	['h', 0.18],
	['j', 0.35],
	['k', 0.28],
	['l', 0.09],
	['q', 0.42],
	['w', 0.11],
	['e', 0.07],
	['r', 0.25],
	['t', 0.14],
	['y', 0.48],
	['u', 0.31],
	['i', 0.16],
	['o', 0.38],
	['p', 0.72], // The weakest key - full coral
	['z', 0.44],
	['x', 0.29],
	['c', 0.06],
	['v', 0.13],
	['b', 0.51],
	['n', 0.21],
	['m', 0.17],
	// Numbers - moderate weaknesses
	['1', 0.33],
	['2', 0.19],
	['3', 0.27],
	['4', 0.41],
	['5', 0.23],
	['6', 0.36],
	['7', 0.15],
	['8', 0.29],
	['9', 0.47],
	['0', 0.34],
	// Punctuation
	[';', 0.18],
	[',', 0.22],
	['.', 0.14],
	['/', 0.31],
	["'", 0.26],
	[' ', 0.04] // Space is strong
]);

// Helper to get weakness for a key (returns undefined if no data)
export function getWeakness(key: string): number | undefined {
	return mockWeaknessMap.get(key);
}

// Get the max weakness in the profile (for relative scaling)
export function getMaxWeakness(): number {
	return Math.max(...Array.from(mockWeaknessMap.values()));
}

// Check if a key should show its percentage (>= 50% of max)
export function isHotKey(key: string): boolean {
	const weakness = getWeakness(key);
	if (weakness === undefined) return false;
	return weakness >= getMaxWeakness() * 0.5;
}

// Convert weakness to coral color intensity (0-100%)
export function weaknessToCoralIntensity(weakness: number): number {
	const max = getMaxWeakness();
	return Math.min(100, (weakness / max) * 100);
}
