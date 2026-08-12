<!--
  PROTOTYPE — Variant B: Compact Heat Strip
  "Only the weak ones" — a horizontal strip of tiles for floored weak keys,
  sorted hottest first. The rest of the keyboard is implied as neutral.
  Each tile shows the key letter large with the percentage stacked below.
  This variant argues that the heat map should be a diagnostic list,
  not a spatial map — the keyboard shape is redundant when you only care
  about 6-8 keys.
-->
<script lang="ts">
	import { mockWeaknessMap, getMaxWeakness } from './heat-map-mock';

	// Only floored keys (weakness > 0), sorted by weakness descending
	interface WeakKeyTile {
		key: string;
		weakness: number;
		isHot: boolean;
	}

	let tiles: WeakKeyTile[] = $derived.by(() => {
		const max = getMaxWeakness();
		const threshold = max * 0.5;
		return Array.from(mockWeaknessMap.entries())
			.filter(([, weakness]) => weakness > 0)
			.sort(([, a], [, b]) => b - a)
			.map(([key, weakness]) => ({
				key,
				weakness,
				isHot: weakness >= threshold
			}));
	});

	function tileBg(weakness: number): string {
		const max = getMaxWeakness();
		const intensity = max === 0 ? 0 : weakness / max;
		// Coral ramp from white to #ff7657
		const r = Math.round(255 - (255 - 255) * intensity);
		const g = Math.round(255 - (255 - 118) * intensity);
		const b = Math.round(255 - (255 - 87) * intensity);
		return `rgb(${r} ${g} ${b})`;
	}

	function tileEdge(weakness: number): string {
		const max = getMaxWeakness();
		const intensity = max === 0 ? 0 : weakness / max;
		// Neutral edge (#c9c3ec) → coral-deep (#d84a35)
		const r = Math.round(201 - (201 - 216) * intensity);
		const g = Math.round(195 - (195 - 74) * intensity);
		const b = Math.round(236 - (236 - 53) * intensity);
		return `rgb(${r} ${g} ${b})`;
	}
</script>

<div class="heatstrip-b" role="img" aria-label={`Weak-key heat map showing ${tiles.length} measured keys. Hottest: ${tiles[0]?.key.toUpperCase()} at ${Math.round((tiles[0]?.weakness ?? 0) * 100)}%.`}>
	<div class="heatstrip-header">
		<div>
			<h4 class="heatstrip-title">Your weak keys</h4>
			<p class="heatstrip-subtitle">{tiles.length} measured · hottest first</p>
		</div>
		<div class="heatstrip-legend">
			<span class="legend-label">strong</span>
			<span class="legend-bar"></span>
			<span class="legend-label">weak</span>
		</div>
	</div>

	{#if tiles.length === 0}
		<p class="heatstrip-empty">The Profile is still gathering enough samples to identify a weak key.</p>
	{:else}
		<div class="heatstrip-tiles">
			{#each tiles as tile}
				<div
					class="tile"
					class:is-hot={tile.isHot}
					style="background: {tileBg(tile.weakness)}; box-shadow: 0 5px 0 {tileEdge(tile.weakness)}, 0 8px 14px rgb(33 24 95 / 12%);"
					aria-label={`${tile.key}: ${Math.round(tile.weakness * 100)}% weak`}
				>
					<span class="tile-letter">{tile.key.toUpperCase()}</span>
					<span class="tile-percent">{Math.round(tile.weakness * 100)}%</span>
				</div>
			{/each}
		</div>
		<p class="heatstrip-context">
			Keys not shown are either strong or not yet measured.
		</p>
	{/if}
</div>

<style>
	.heatstrip-b {
		display: grid;
		gap: 1rem;
		margin-top: 1rem;
		padding: 1.2rem;
		border-radius: 1.4rem;
		background: var(--paper-deep);
		box-shadow: inset 0 0 0 2px var(--line);
	}

	.heatstrip-header {
		display: flex;
		justify-content: space-between;
		align-items: start;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.heatstrip-title {
		margin: 0;
		font: 800 0.85rem var(--font-sans);
		letter-spacing: -0.01em;
		color: var(--ink);
	}

	.heatstrip-subtitle {
		margin: 0.2rem 0 0;
		font: 600 0.72rem var(--font-sans);
		color: var(--muted);
	}

	.heatstrip-legend {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font: 700 0.62rem var(--font-sans);
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.legend-bar {
		width: 3.5rem;
		height: 0.35rem;
		border-radius: 999px;
		background: linear-gradient(to right, var(--card), var(--coral));
		box-shadow: inset 0 0 0 1px var(--line);
	}

	.legend-label { color: var(--muted); }

	.heatstrip-tiles {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
	}

	.tile {
		display: grid;
		place-items: center;
		min-width: 4.2rem;
		padding: 0.75rem 0.6rem;
		border-radius: 1rem;
		border: 0;
		transition: transform 120ms ease;
	}

	.tile:hover { transform: translateY(-3px); }

	.tile-letter {
		font: 800 1.1rem var(--font-mono);
		color: var(--ink);
		line-height: 1;
	}

	.tile-percent {
		font: 700 0.68rem var(--font-mono);
		margin-top: 0.25rem;
		opacity: 0.85;
		color: var(--ink);
	}

	.tile.is-hot {
		outline: 2px solid var(--coral-deep);
		outline-offset: 2px;
	}

	.heatstrip-empty {
		margin: 0;
		padding: 1.5rem;
		text-align: center;
		color: var(--muted);
		font-size: 0.86rem;
		line-height: 1.5;
		background: var(--card);
		border-radius: 0.8rem;
	}

	.heatstrip-context {
		margin: 0;
		font: 600 0.72rem var(--font-sans);
		color: var(--muted);
		text-align: center;
	}
</style>
