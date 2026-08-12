<!--
  PROTOTYPE — Variant A: Full Keyboard Grid
  "Literal heat map" — every drawn key tinted by weakness. The whole keyboard
  is the Profile. Hot keys (>= 50% of max) carry their absolute weakness stacked
  under the letter. Unsamped keys stay neutral white.
-->
<script lang="ts">
	import { getWeakness, getMaxWeakness, isHotKey } from './heat-map-mock';

	interface KeyboardKey {
		label: string;
		recordedKeys: string[]; // the raw key(s) this physical cap covers
		wide?: boolean;
		shiftLike?: boolean; // shift never has stats
	}

	const k = (label: string, recordedKeys: string[], wide = false, shiftLike = false): KeyboardKey => ({
		label,
		recordedKeys,
		wide,
		shiftLike
	});

	// The cap table — recorded key(s) each physical cap pools from.
	const rows: KeyboardKey[][] = [
		[
			k('1 !', ['1', '!']),
			k('2', ['2']),
			k('3', ['3']),
			k('4', ['4']),
			k('5', ['5']),
			k('6', ['6']),
			k('7', ['7']),
			k('8', ['8']),
			k('9', ['9']),
			k('0', ['0'])
		],
		'qwertyuiop'.split('').map((l) => k(l, [l])),
		[
			...'asdfghjkl'.split('').map((l) => k(l, [l])),
			k('; :', [';', ':']),
			k("'", ["'"])
		],
		[
			k('shift', [], true, true),
			...'zxcvbnm'.split('').map((l) => k(l, [l])),
			k(',', [',']),
			k('.', ['.']),
			k('/ ?', ['/', '?'])
		],
		[k('space', [' '], true)]
	];

	function capWeakness(recordedKeys: string[]): number | null {
		const values = recordedKeys.map((key) => getWeakness(key)).filter((v): v is number => v !== undefined);
		if (values.length === 0) return null;
		// Pooling is already applied in the mock; we take the max to stand in for
		// the real pooled weakness the server will emit.
		return Math.max(...values);
	}

	function coralBg(weakness: number | null): string {
		if (weakness === null) return 'var(--card)';
		const max = getMaxWeakness();
		const intensity = max === 0 ? 0 : weakness / max;
		// Neutral (white #fff) → full coral (#ff7657). Interpolate RGB.
		const r = Math.round(255 - (255 - 255) * intensity);
		const g = Math.round(255 - (255 - 118) * intensity);
		const b = Math.round(255 - (255 - 87) * intensity);
		return `rgb(${r} ${g} ${b})`;
	}

	function coralEdge(weakness: number | null): string {
		if (weakness === null) return 'var(--key-edge)';
		const max = getMaxWeakness();
		const intensity = max === 0 ? 0 : weakness / max;
		// Neutral edge (#c9c3ec) → coral-deep (#d84a35)
		const r = Math.round(201 - (201 - 216) * intensity);
		const g = Math.round(195 - (195 - 74) * intensity);
		const b = Math.round(236 - (236 - 53) * intensity);
		return `rgb(${r} ${g} ${b})`;
	}
</script>

<div class="heatmap-a" role="img" aria-label={`Weak-key heat map. Hottest key: p at 72%. ${getMaxWeakness() > 0 ? 'Hotter cap = weaker key.' : ''}`}>
	<div class="heatmap-legend">
		<span class="legend-swatch legend-neutral"></span>
		<span class="legend-label">strong</span>
		<span class="legend-bar"></span>
		<span class="legend-swatch legend-hot"></span>
		<span class="legend-label">weak</span>
	</div>

	<div class="keyboard">
		{#each rows as row}
			<div class="keyboard-row">
				{#each row as cap}
					{@const weakness = cap.shiftLike ? null : capWeakness(cap.recordedKeys)}
					{@const hot = weakness !== null && isHotKey(cap.recordedKeys[0]) && (weakness / getMaxWeakness()) >= 0.5}
					<kbd
						class:is-wide={cap.wide}
						class:is-shift={cap.shiftLike}
						style="background: {coralBg(weakness)}; box-shadow: 0 4px 0 {coralEdge(weakness)}, 0 7px 10px rgb(33 24 95 / 13%);"
						aria-label={
							cap.shiftLike
								? `${cap.label} (no data)`
								: weakness === null
									? `${cap.label} (not yet measured)`
									: `${cap.label}: ${Math.round(weakness * 100)}% weak`
						}
					>
						<span class="cap-letter">{cap.label}</span>
						{#if hot}
							<span class="cap-percent">{Math.round(weakness * 100)}%</span>
						{/if}
					</kbd>
				{/each}
			</div>
		{/each}
	</div>
</div>

<style>
	.heatmap-a {
		display: grid;
		gap: 0.7rem;
		margin-top: 1rem;
	}

	.heatmap-legend {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		justify-content: flex-end;
		font: 700 0.68rem var(--font-sans);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.legend-swatch {
		width: 0.85rem;
		height: 0.85rem;
		border-radius: 0.25rem;
	}

	.legend-neutral { background: var(--card); box-shadow: inset 0 0 0 1px var(--line); }
	.legend-hot { background: var(--coral); }

	.legend-bar {
		flex: 1;
		max-width: 6rem;
		height: 0.45rem;
		border-radius: 999px;
		background: linear-gradient(to right, var(--card), var(--coral));
		box-shadow: inset 0 0 0 1px var(--line);
	}

	.legend-label { color: var(--muted); }

	.keyboard {
		display: grid;
		container-type: inline-size;
		gap: clamp(0.28rem, 1vw, 0.48rem);
		padding: clamp(0.75rem, 2vw, 1.2rem);
		border-radius: 1.4rem;
		background: #d9d5f2;
		box-shadow: inset 0 4px 0 rgb(255 255 255 / 58%), 0 10px 0 var(--key-edge-deep), 0 18px 28px rgb(33 24 95 / 14%);
	}

	.keyboard-row {
		display: flex;
		justify-content: center;
		gap: min(0.42rem, 0.85cqw);
	}

	kbd {
		display: grid;
		place-items: center;
		width: min(2.25rem, 8cqw);
		height: min(2.25rem, 8cqw);
		border: 0;
		border-radius: 0.72rem;
		color: var(--ink);
		font-family: var(--font-mono);
		font-weight: 600;
		line-height: 1;
		transition: transform 120ms ease;
	}

	kbd:hover { transform: translateY(-2px); }

	kbd.is-wide {
		width: min(12.5rem, 42cqw);
		color: var(--muted);
		font-size: min(0.6rem, max(0.55rem, 2.6cqw));
		letter-spacing: 0.06em;
	}

	kbd.is-shift {
		width: min(4.75rem, 11cqw);
	}

	.cap-letter {
		font-size: min(0.78rem, max(0.62rem, 3.2cqw));
		text-transform: uppercase;
		font-weight: 700;
	}

	.cap-percent {
		font-size: min(0.58rem, max(0.46rem, 2.4cqw));
		font-weight: 800;
		margin-top: -0.1rem;
		opacity: 0.82;
	}

	kbd.is-shift .cap-letter,
	kbd.is-wide .cap-letter {
		font-size: min(0.6rem, max(0.5rem, 2.6cqw));
	}
</style>
