<script lang="ts">
	let { data } = $props();
	let stats = $derived(data.stats);
</script>

<svelte:head>
	<title>Admin · GetTyping</title>
</svelte:head>

<main>
	<h1>Admin</h1>
	<p>Raw numbers for now — a real layout lands in a later ticket.</p>

	<section>
		<h2>Growth</h2>
		<ul>
			<li>Total Players: {stats.growth.totalPlayers}</li>
			<li>New Players (last 7 days): {stats.growth.newPlayersLast7Days}</li>
		</ul>
	</section>

	<section>
		<h2>Engagement</h2>
		<ul>
			<li>Total Attempts: {stats.engagement.totalAttempts}</li>
			<li>Attempts (last 7 days): {stats.engagement.attemptsLast7Days}</li>
			<li>Average Attempts per Player: {stats.engagement.averageAttemptsPerPlayer.toFixed(2)}</li>
		</ul>
	</section>

	<section>
		<h2>Learn funnel</h2>
		<ul>
			{#each stats.learnFunnel as stage (stage.stageId)}
				<li>Stage {stage.stageId} ({stage.name}): {stage.playersCleared} Players cleared</li>
			{/each}
		</ul>
	</section>

	<section>
		<h2>Speed Test & Practice performance</h2>
		<ul>
			<li>Attempts: {stats.practicePerformance.attempts}</li>
			<li>
				Average net WPM: {stats.practicePerformance.averageNetWpm === null
					? '—'
					: stats.practicePerformance.averageNetWpm.toFixed(1)}
			</li>
			<li>
				Average accuracy: {stats.practicePerformance.averageAccuracy === null
					? '—'
					: (stats.practicePerformance.averageAccuracy * 100).toFixed(1) + '%'}
			</li>
		</ul>
		<h3>Weakest keys</h3>
		<ul>
			{#each stats.practicePerformance.weakestKeys as row (row.key)}
				<li>{row.key}: {(row.errorRate * 100).toFixed(1)}% error rate ({row.totalAttempts.toFixed(1)} attempts)</li>
			{/each}
		</ul>
	</section>

	<section>
		<h2>Content popularity</h2>
		<ul>
			{#each stats.contentPopularity as row (row.exerciseId)}
				<li>Exercise {row.exerciseId} ({row.stageName ?? row.track}): {row.attempts} Attempts, {row.distinctPlayers} distinct Players</li>
			{/each}
		</ul>
	</section>
</main>

<style>
	main {
		max-width: 40rem;
		margin: 3rem auto;
		padding: 0 1.5rem;
		font-family: system-ui, sans-serif;
	}
</style>
