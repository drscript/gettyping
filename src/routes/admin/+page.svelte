<script lang="ts">
	let { data } = $props();
	let stats = $derived(data.stats);

	function formatWpm(value: number | null): string {
		return value === null ? '—' : value.toFixed(1);
	}

	function formatPercent(value: number | null): string {
		return value === null ? '—' : `${(value * 100).toFixed(1)}%`;
	}

	function exerciseLabel(row: { track: 'learn' | 'speed_test'; stageName: string | null }): string {
		return row.stageName ?? (row.track === 'speed_test' ? 'Speed Test' : row.track);
	}
</script>

<svelte:head>
	<title>Admin · GetTyping</title>
</svelte:head>

<main>
	<header>
		<p class="kicker">GetTyping — Admin</p>
		<h1>Statistics</h1>
		<p class="generated-at">Generated {new Date(stats.generatedAt).toLocaleString()}</p>
	</header>

	<div class="tiles">
		<section class="tile">
			<h2>Growth</h2>
			<dl class="stats"><div class="stat-row"><dt>Total Players</dt><dd>{stats.growth.totalPlayers}</dd></div><div class="stat-row"><dt>New Players, last 7 days</dt><dd>{stats.growth.newPlayersLast7Days}</dd></div></dl>
		</section>

		<section class="tile">
			<h2>Engagement</h2>
			<dl class="stats"><div class="stat-row"><dt>Total Attempts</dt><dd>{stats.engagement.totalAttempts}</dd></div><div class="stat-row"><dt>Attempts, last 7 days</dt><dd>{stats.engagement.attemptsLast7Days}</dd></div><div class="stat-row"><dt>Average Attempts per Player</dt><dd>{stats.engagement.averageAttemptsPerPlayer.toFixed(2)}</dd></div></dl>
		</section>

		<section class="tile">
			<h2>Speed Test &amp; Practice</h2>
			<dl class="stats"><div class="stat-row"><dt>Attempts</dt><dd>{stats.practicePerformance.attempts}</dd></div><div class="stat-row"><dt>Average net WPM</dt><dd>{formatWpm(stats.practicePerformance.averageNetWpm)}</dd></div><div class="stat-row"><dt>Average accuracy</dt><dd>{formatPercent(stats.practicePerformance.averageAccuracy)}</dd></div></dl>
		</section>
	</div>

	<section>
		<h2>Learn funnel</h2>
		<table>
			<thead><tr><th scope="col">Stage</th><th scope="col" class="numeric">Players cleared</th></tr></thead>
			<tbody>{#each stats.learnFunnel as stage (stage.stageId)}<tr><td>{stage.stageId}. {stage.name}</td><td class="numeric">{stage.playersCleared}</td></tr>{/each}</tbody>
		</table>
	</section>

	<section>
		<h2>Weakest keys</h2>
		{#if stats.practicePerformance.weakestKeys.length === 0}
			<p class="empty">No weak-key data yet.</p>
		{:else}
			<table>
				<thead><tr><th scope="col">Key</th><th scope="col" class="numeric">Error rate</th><th scope="col" class="numeric">Weighted Attempts</th></tr></thead>
				<tbody>{#each stats.practicePerformance.weakestKeys as row (row.key)}<tr><td>{row.key === ' ' ? '(space)' : row.key === '' ? '(unrecognized)' : row.key}</td><td class="numeric">{formatPercent(row.errorRate)}</td><td class="numeric">{row.totalAttempts.toFixed(1)}</td></tr>{/each}</tbody>
			</table>
		{/if}
	</section>

	<section>
		<h2>Content popularity</h2>
		<table>
			<thead><tr><th scope="col">Exercise</th><th scope="col" class="numeric">Attempts</th><th scope="col" class="numeric">Distinct Players</th></tr></thead>
			<tbody>{#each stats.contentPopularity as row (row.exerciseId)}<tr><td>{exerciseLabel(row)}</td><td class="numeric">{row.attempts}</td><td class="numeric">{row.distinctPlayers}</td></tr>{/each}</tbody>
		</table>
	</section>
</main>

<style>
	main {
		max-width: 56rem;
		margin: 0 auto;
		padding: 2.5rem 1.5rem 4rem;
	}

	header {
		margin-bottom: 2rem;
	}

	.kicker {
		margin: 0 0 0.4rem;
		color: var(--muted);
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0;
		color: var(--ink);
		font-size: 1.5rem;
	}

	.generated-at {
		margin: 0.35rem 0 0;
		color: var(--muted);
		font-size: 0.875rem;
	}

	h2 {
		margin: 0 0 0.75rem;
		color: var(--ink);
		font-size: 1.05rem;
	}

	section {
		margin-bottom: 2.25rem;
	}

	.tiles {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 2.25rem;
	}

	.tile {
		flex: 1 1 14rem;
		margin-bottom: 0;
		padding: 1.25rem;
		border: 1px solid var(--line);
		border-radius: 0.75rem;
		background: var(--card);
	}

	.stats {
		margin: 0;
	}

	.stat-row {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.35rem 0;
		border-bottom: 1px solid var(--line);
	}

	.stat-row:last-child {
		border-bottom: none;
	}

	dt {
		color: var(--muted);
		font-size: 0.875rem;
	}

	dd {
		margin: 0;
		color: var(--ink);
		font-weight: 700;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		border: 1px solid var(--line);
		border-radius: 0.75rem;
		background: var(--card);
		font-size: 0.9rem;
	}

	th,
	td {
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid var(--line);
		text-align: left;
	}

	tbody tr:last-child td {
		border-bottom: none;
	}

	th {
		color: var(--muted);
		font-weight: 700;
	}

	td {
		color: var(--ink);
	}

	.numeric {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	.empty {
		color: var(--muted);
	}
</style>
