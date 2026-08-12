<!--
  PROTOTYPE — Variant C: Zone-ranked list
  "Weak keys by zone" — weak keys ranked within keyboard zones (home row,
  top row, bottom row, numbers/punctuation). A small zone diagram shows
  which zone is which. This argues that grouping by zone reveals patterns
  (e.g., "my whole right-hand top row is weak") that a pure weakness-sorted
  list hides.
-->
<script lang="ts">
	import { mockWeaknessMap, getMaxWeakness } from './heat-map-mock';

	interface Zone {
		id: string;
		name: string;
		keys: string[];
	}

	const zones: Zone[] = [
		{ id: 'home', name: 'Home row', keys: 'asdfghjkl;\''.split('') },
		{ id: 'top', name: 'Top row', keys: 'qwertyuiop'.split('') },
		{ id: 'bottom', name: 'Bottom row', keys: 'zxcvbnm,./'.split('') },
		{ id: 'numbers', name: 'Numbers & symbols', keys: '1234567890'.split('') }
	];

	interface WeakKeyInZone {
		key: string;
		weakness: number;
		isHot: boolean;
	}

	interface ZoneWithKeys {
		zone: Zone;
		weakKeys: WeakKeyInZone[];
	}

	let zonesWithData: ZoneWithKeys[] = $derived.by(() => {
		const max = getMaxWeakness();
		const threshold = max * 0.5;
		return zones.map((zone) => ({
			zone,
			weakKeys: zone.keys
				.map((key) => {
					const weakness = mockWeaknessMap.get(key);
					return weakness !== undefined && weakness > 0
						? { key, weakness, isHot: weakness >= threshold }
						: null;
				})
				.filter((k): k is WeakKeyInZone => k !== null)
				.sort((a, b) => b.weakness - a.weakness)
		}));
	});

	let activeZone: string = $state(zones[0].id);

	function cellBg(key: string): string {
		const weakness = mockWeaknessMap.get(key);
		if (weakness === undefined || weakness === 0) return 'var(--card)';
		const max = getMaxWeakness();
		const intensity = max === 0 ? 0 : weakness / max;
		const r = Math.round(255 - (255 - 255) * intensity);
		const g = Math.round(255 - (255 - 118) * intensity);
		const b = Math.round(255 - (255 - 87) * intensity);
		return `rgb(${r} ${g} ${b})`;
	}

	function cellEdge(key: string): string {
		const weakness = mockWeaknessMap.get(key);
		if (weakness === undefined || weakness === 0) return 'var(--key-edge)';
		const max = getMaxWeakness();
		const intensity = max === 0 ? 0 : weakness / max;
		const r = Math.round(201 - (201 - 216) * intensity);
		const g = Math.round(195 - (195 - 74) * intensity);
		const b = Math.round(236 - (236 - 53) * intensity);
		return `rgb(${r} ${g} ${b})`;
	}

	function isZoneActive(zoneId: string): boolean {
		return zoneId === activeZone;
	}
</script>

<div class="zone-c" role="img" aria-label="Weak-key heat map grouped by keyboard zone">
	<div class="zone-header">
		<h4 class="zone-title">Weak keys by zone</h4>
		<p class="zone-subtitle">Patterns emerge when you group by hand position</p>
	</div>

	<!-- Small keyboard diagram showing zones -->
	<div class="zone-diagram">
		<div class="mini-keyboard">
			<!-- Top row -->
			<div class="mini-row">
				{#each 'qwertyuiop'.split('') as key}
					<button
						type="button"
						class="mini-key"
						class:is-active={activeZone === 'top'}
						class:is-hot={mockWeaknessMap.has(key) && (mockWeaknessMap.get(key) ?? 0) >= getMaxWeakness() * 0.5}
						style="background: {cellBg(key)}; box-shadow: 0 3px 0 {cellEdge(key)};"
						onclick={() => (activeZone = 'top')}
						aria-label={`Top row zone. Click to view.`}
					>
						{key.toUpperCase()}
					</button>
				{/each}
			</div>
			<!-- Home row -->
			<div class="mini-row">
				{#each 'asdfghjkl;\''.split('') as key}
					<button
						type="button"
						class="mini-key"
						class:is-active={activeZone === 'home'}
						class:is-hot={mockWeaknessMap.has(key) && (mockWeaknessMap.get(key) ?? 0) >= getMaxWeakness() * 0.5}
						style="background: {cellBg(key)}; box-shadow: 0 3px 0 {cellEdge(key)};"
						onclick={() => (activeZone = 'home')}
						aria-label={`Home row zone. Click to view.`}
					>
						{key === ';' ? ';' : key === "'" ? "'" : key.toUpperCase()}
					</button>
				{/each}
			</div>
			<!-- Bottom row -->
			<div class="mini-row">
				{#each 'zxcvbnm,./'.split('') as key}
					<button
						type="button"
						class="mini-key"
						class:is-active={activeZone === 'bottom'}
						class:is-hot={mockWeaknessMap.has(key) && (mockWeaknessMap.get(key) ?? 0) >= getMaxWeakness() * 0.5}
						style="background: {cellBg(key)}; box-shadow: 0 3px 0 {cellEdge(key)};"
						onclick={() => (activeZone = 'bottom')}
						aria-label={`Bottom row zone. Click to view.`}
					>
						{key === ',' ? ',' : key === '.' ? '.' : key === '/' ? '/' : key.toUpperCase()}
					</button>
				{/each}
			</div>
		</div>
		<div class="zone-tabs">
			{#each zonesWithData as { zone, weakKeys }}
				<button
					type="button"
					class="zone-tab"
					class:is-active={isZoneActive(zone.id)}
					onclick={() => (activeZone = zone.id)}
				>
					<span class="zone-tab-name">{zone.name}</span>
					<span class="zone-tab-count">{weakKeys.length}</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- Ranked list for active zone -->
	<div class="zone-list-container">
		{#each zonesWithData as { zone, weakKeys }}
			{#if isZoneActive(zone.id)}
				<div class="zone-list" role="list">
					{#if weakKeys.length === 0}
						<p class="zone-empty">No weak keys in this zone yet.</p>
					{:else}
						{#each weakKeys as entry, i}
							<div class="zone-entry" role="listitem" aria-label={`${entry.key}: ${Math.round(entry.weakness * 100)}% weak, rank ${i + 1}`}>
								<span class="zone-rank">#{i + 1}</span>
								<div
									class="zone-key"
									class:is-hot={entry.isHot}
									style="background: {cellBg(entry.key)}; box-shadow: 0 4px 0 {cellEdge(entry.key)};"
								>
									<span class="zone-key-letter">{entry.key.toUpperCase()}</span>
								</div>
								<div class="zone-bar-container">
									<div class="zone-bar" style="width: {(entry.weakness / getMaxWeakness()) * 100}%; background: var(--coral);"></div>
								</div>
								<span class="zone-percent">{Math.round(entry.weakness * 100)}%</span>
							</div>
						{/each}
					{/if}
				</div>
			{/if}
		{/each}
	</div>

	<div class="zone-legend">
		<span class="legend-swatch legend-neutral"></span>
		<span class="legend-label">strong</span>
		<span class="legend-bar"></span>
		<span class="legend-swatch legend-hot"></span>
		<span class="legend-label">weak</span>
	</div>
</div>

<style>
	.zone-c {
		display: grid;
		gap: 1.2rem;
		margin-top: 1rem;
		padding: 1.4rem;
		border-radius: 1.4rem;
		background: var(--paper-deep);
		box-shadow: inset 0 0 0 2px var(--line);
	}

	.zone-header {
		display: grid;
		gap: 0.2rem;
	}

	.zone-title {
		margin: 0;
		font: 800 0.95rem var(--font-sans);
		letter-spacing: -0.01em;
		color: var(--ink);
	}

	.zone-subtitle {
		margin: 0;
		font: 600 0.72rem var(--font-sans);
		color: var(--muted);
	}

	.zone-diagram {
		display: grid;
		gap: 1rem;
	}

	.mini-keyboard {
		display: grid;
		gap: 0.35rem;
		padding: 0.8rem;
		border-radius: 1rem;
		background: #d9d5f2;
		box-shadow: inset 0 3px 0 rgb(255 255 255 / 58%);
	}

	.mini-row {
		display: flex;
		justify-content: center;
		gap: 0.25rem;
	}

	.mini-key {
		display: grid;
		place-items: center;
		width: 1.8rem;
		height: 1.8rem;
		border: 0;
		border-radius: 0.4rem;
		font: 700 0.6rem var(--font-mono);
		color: var(--ink);
		cursor: pointer;
		transition: transform 80ms ease, outline-color 80ms ease;
		outline: 2px solid transparent;
		outline-offset: 1px;
	}

	.mini-key:hover { transform: scale(1.08); }

	.mini-key.is-active {
		outline-color: var(--indigo);
		transform: scale(1.05);
	}

	.mini-key.is-hot {
		font-weight: 800;
	}

	.zone-tabs {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.5rem;
	}

	.zone-tab {
		display: grid;
		gap: 0.25rem;
		padding: 0.6rem 0.5rem;
		border: 2px solid var(--line);
		border-radius: 0.8rem;
		background: var(--card);
		cursor: pointer;
		transition: border-color 120ms ease, background 120ms ease;
	}

	.zone-tab:hover { border-color: var(--indigo); }

	.zone-tab.is-active {
		border-color: var(--indigo);
		background: var(--indigo);
		color: #fff;
	}

	.zone-tab-name {
		font: 700 0.68rem var(--font-sans);
		text-align: center;
	}

	.zone-tab.is-active .zone-tab-name { color: #fff; }

	.zone-tab-count {
		font: 800 1.1rem var(--font-mono);
		text-align: center;
		color: var(--muted);
	}

	.zone-tab.is-active .zone-tab-count { color: #fff; }

	.zone-list-container {
		min-height: 12rem;
	}

	.zone-list {
		display: grid;
		gap: 0.5rem;
	}

	.zone-entry {
		display: grid;
		grid-template-columns: 2rem 2.8rem 1fr 3rem;
		align-items: center;
		gap: 0.6rem;
		padding: 0.5rem;
		border-radius: 0.7rem;
		background: var(--card);
	}

	.zone-rank {
		font: 700 0.72rem var(--font-mono);
		color: var(--muted);
		text-align: center;
	}

	.zone-key {
		display: grid;
		place-items: center;
		width: 2.4rem;
		height: 2.4rem;
		border-radius: 0.6rem;
		border: 0;
	}

	.zone-key-letter {
		font: 800 1rem var(--font-mono);
		color: var(--ink);
	}

	.zone-key.is-hot {
		outline: 2px solid var(--coral-deep);
		outline-offset: 2px;
	}

	.zone-bar-container {
		height: 0.5rem;
		border-radius: 999px;
		background: var(--line);
		overflow: hidden;
	}

	.zone-bar {
		height: 100%;
		border-radius: 999px;
		transition: width 200ms ease;
	}

	.zone-percent {
		font: 700 0.78rem var(--font-mono);
		color: var(--ink);
		text-align: right;
	}

	.zone-empty {
		margin: 0;
		padding: 2rem;
		text-align: center;
		color: var(--muted);
		font-size: 0.86rem;
		background: var(--card);
		border-radius: 0.8rem;
	}

	.zone-legend {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		justify-content: center;
		font: 700 0.62rem var(--font-sans);
		letter-spacing: 0.04em;
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
		width: 4rem;
		height: 0.35rem;
		border-radius: 999px;
		background: linear-gradient(to right, var(--card), var(--coral));
		box-shadow: inset 0 0 0 1px var(--line);
	}
</style>
