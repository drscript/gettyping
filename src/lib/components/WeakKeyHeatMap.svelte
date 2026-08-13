<script lang="ts">
	import {
		keyboardCapRows,
		canonicalKeyFor,
		type KeyboardCap,
		type WeakKeyHeatEntry
	} from '$lib/ui/keyboard-caps';

	let { entries }: { entries: WeakKeyHeatEntry[] } = $props();

	// The server already pooled, scored and floored the Profile per physical cap;
	// the render only looks heat up by the cap's canonical recorded key.
	const weaknessByKey = $derived(new Map(entries.map((entry) => [entry.key, entry.weakness])));
	const maxWeakness = $derived(
		entries.length === 0 ? 0 : Math.max(...entries.map((entry) => entry.weakness))
	);

	function capWeakness(cap: KeyboardCap): number | undefined {
		const canonical = canonicalKeyFor(cap);
		return canonical === undefined ? undefined : weaknessByKey.get(canonical);
	}

	// Hot keys (≥ 0.5 × the Player's own max weakness) earn their printed
	// percentage — the absolute weakness value, the map's non-color channel.
	function hotPercent(cap: KeyboardCap): number | undefined {
		const weakness = capWeakness(cap);
		if (weakness === undefined || maxWeakness === 0 || weakness < maxWeakness * 0.5) {
			return undefined;
		}
		return Math.round(weakness * 100);
	}

	// Neutral (white) → full coral, scaled to the Player's own max weakness.
	function coralBg(weakness: number | undefined): string {
		if (weakness === undefined || maxWeakness === 0) return 'var(--card)';
		const intensity = weakness / maxWeakness;
		const green = Math.round(255 - (255 - 118) * intensity);
		const blue = Math.round(255 - (255 - 87) * intensity);
		return `rgb(255 ${green} ${blue})`;
	}

	// Neutral edge → coral-deep, matching the face ramp.
	function coralEdge(weakness: number | undefined): string {
		if (weakness === undefined || maxWeakness === 0) return 'var(--key-edge)';
		const intensity = weakness / maxWeakness;
		const red = Math.round(201 + (216 - 201) * intensity);
		const green = Math.round(195 - (195 - 74) * intensity);
		const blue = Math.round(236 - (236 - 53) * intensity);
		return `rgb(${red} ${green} ${blue})`;
	}

	function capAriaLabel(cap: KeyboardCap): string {
		const weakness = capWeakness(cap);
		if (cap.shift) return `${cap.label} (no data)`;
		if (weakness === undefined) return `${cap.label} (not yet measured)`;
		return `${cap.label}: ${Math.round(weakness * 100)}% weak`;
	}

	const hottestEntry = $derived(
		entries.length === 0
			? undefined
			: entries.reduce((best, entry) => (entry.weakness > best.weakness ? entry : best))
	);
</script>

<!--
  role="group" (not role="img"): the map's accessible contract is the per-cap
  labels (#28 — every sampled key announces its weakness), and role="img" would
  flatten the whole subtree into a single presentational image, silencing them.
-->
<div
	class="heat-map"
	role="group"
	aria-label={`Weak-key heat map.${
		hottestEntry
			? ` Hottest key: ${hottestEntry.key === ' ' ? 'space' : hottestEntry.key} at ${Math.round(hottestEntry.weakness * 100)}%. Hotter cap = weaker key.`
			: ''
	}`}
>
	<div class="heat-map-legend" aria-hidden="true">
		<span class="legend-swatch legend-neutral"></span>
		<span class="legend-label">strong</span>
		<span class="legend-bar"></span>
		<span class="legend-swatch legend-hot"></span>
		<span class="legend-label">weak</span>
	</div>

	<div class="keyboard">
		{#each keyboardCapRows as row}
			<div class="keyboard-row">
				{#each row as cap}
					{@const weakness = capWeakness(cap)}
					{@const percent = hotPercent(cap)}
					<kbd
						class:is-wide={cap.wide}
						class:is-shift={cap.shift}
						data-heat-cap={weakness === undefined ? undefined : canonicalKeyFor(cap)}
						style="background: {coralBg(weakness)}; box-shadow: 0 4px 0 {coralEdge(weakness)}, 0 7px 10px rgb(33 24 95 / 13%);"
						aria-label={capAriaLabel(cap)}
					>
						<span class="cap-letter">{cap.label}</span>
						{#if percent !== undefined}
							<span class="cap-percent">{percent}%</span>
						{/if}
					</kbd>
				{/each}
			</div>
		{/each}
	</div>
</div>

<style>
	.heat-map {
		display: grid;
		gap: 0.7rem;
		margin-top: 1rem;
	}

	.heat-map-legend {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.45rem;
		color: var(--muted);
		font: 700 0.68rem var(--font-sans);
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.legend-swatch {
		width: 0.85rem;
		height: 0.85rem;
		border-radius: 0.25rem;
	}

	.legend-neutral { background: var(--card); box-shadow: inset 0 0 0 1px var(--line); }
	.legend-hot { background: var(--coral); }

	.legend-bar {
		width: 100%;
		max-width: 6rem;
		height: 0.45rem;
		border-radius: 999px;
		background: linear-gradient(to right, var(--card), var(--coral));
		box-shadow: inset 0 0 0 1px var(--line);
	}

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
		width: min(2.25rem, 8cqw);
		height: min(2.25rem, 8cqw);
		place-items: center;
		border: 0;
		border-radius: 0.72rem;
		color: var(--ink);
		font-family: var(--font-mono);
		font-weight: 600;
		line-height: 1;
		white-space: nowrap;
	}

	kbd.is-wide {
		width: min(12.5rem, 42cqw);
		color: var(--muted);
		font-size: min(0.6rem, max(0.55rem, 2.6cqw));
		letter-spacing: 0.06em;
	}

	kbd.is-shift { width: min(4.75rem, 11cqw); }

	.cap-letter {
		font-size: min(0.78rem, max(0.62rem, 3.2cqw));
		font-weight: 700;
		text-transform: uppercase;
	}

	.cap-percent {
		margin-top: -0.1rem;
		font-size: min(0.58rem, max(0.46rem, 2.4cqw));
		font-weight: 800;
		opacity: 0.82;
	}

	kbd.is-shift .cap-letter,
	kbd.is-wide .cap-letter { font-size: min(0.6rem, max(0.5rem, 2.6cqw)); }

	@media (max-width: 560px) {
		.keyboard { padding: 0.6rem 0.45rem; border-radius: 1rem; }
		kbd { border-radius: 0.5rem; }
	}
</style>
