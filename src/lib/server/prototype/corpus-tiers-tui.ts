// PROTOTYPE — throwaway TUI shell for wayfinder ticket #39 (map #36).
// Run: npm run prototype:corpus-tiers
// The logic module (corpus-tiers.ts) is the portable bit; this shell is bin-ware.

import {
	earlyTierCorpus,
	playerCases,
	playablePool,
	assembleExercise,
	derivedKeySet
} from './corpus-tiers.ts';

const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

const state = {
	caseIndex: 0,
	seed: 1,
	showPool: false
};

function mulberry32(seed: number) {
	let a = seed >>> 0;
	return {
		next: () => {
			a += 0x6d2b79f5;
			let t = a;
			t = Math.imul(t ^ (t >>> 15), t | 1);
			t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		}
	};
}

function render(): void {
	console.clear();
	const playerCase = playerCases[state.caseIndex]!;
	const pool = playablePool(earlyTierCorpus, playerCase.keys);

	const lines: string[] = [];
	lines.push(`${BOLD}PROTOTYPE — earliest corpus tiers${RESET} ${DIM}(wayfinder #39)${RESET}`);
	lines.push(`${DIM}Do the drill tiers read as intentional? Do the first words feel readable?${RESET}`);
	lines.push('');
	lines.push(`${BOLD}Player case${RESET}  ${state.caseIndex + 1}/${playerCases.length}: ${BOLD}${playerCase.name}${RESET}`);
	lines.push(`${DIM}cumulative keys:${RESET} ${[...playerCase.keys].sort().join(' ')}`);
	lines.push(`${DIM}playable pool:${RESET}   ${pool.length} of ${earlyTierCorpus.length} corpus entries`);
	lines.push('');

	if (state.showPool) {
		lines.push(`${BOLD}Playable entries at this tier${RESET}`);
		for (const entry of pool) {
			const keys = [...derivedKeySet(entry.text)].sort().join(' ');
			lines.push(`  ${entry.text}  ${DIM}[${keys}]${RESET}`);
		}
		lines.push('');
	} else {
		lines.push(`${BOLD}Generated Sentence-mode Exercises${RESET} ${DIM}(8 entries each, seeded ${state.seed}, ${state.seed + 1}, ${state.seed + 2})${RESET}`);
		for (let i = 0; i < 3; i++) {
			const content = assembleExercise(pool, 8, mulberry32(state.seed + i));
			lines.push(`  ${DIM}${i + 1}.${RESET} ${content}`);
		}
		lines.push('');
		lines.push(`${DIM}Note: a thin pool repeats within an exercise — that is the fog question, on purpose.${RESET}`);
		lines.push('');
	}

	lines.push(`${BOLD}[n]${RESET} next case   ${BOLD}[p]${RESET} prev case   ${BOLD}[r]${RESET} regenerate   ${BOLD}[l]${RESET} list pool   ${BOLD}[q]${RESET} quit`);
	console.log(lines.join('\n'));
}

function onKey(chunk: Buffer): void {
	const key = chunk.toString('utf8');
	if (key === 'q' || key === '\x03') {
		process.stdin.setRawMode(false);
		process.stdin.pause();
		console.clear();
		process.exit(0);
	}
	if (key === 'n') state.caseIndex = (state.caseIndex + 1) % playerCases.length;
	if (key === 'p') state.caseIndex = (state.caseIndex + playerCases.length - 1) % playerCases.length;
	if (key === 'r') state.seed += 3;
	if (key === 'l') state.showPool = !state.showPool;
	render();
}

if (process.stdin.isTTY) {
	process.stdin.setRawMode(true);
	process.stdin.on('data', onKey);
}
render();
