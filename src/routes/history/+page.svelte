<script lang="ts">
	import TaskMasthead from '$lib/components/TaskMasthead.svelte';
	import VariantA from '$lib/prototype/VariantA.svelte';
	import VariantB from '$lib/prototype/VariantB.svelte';
	import VariantC from '$lib/prototype/VariantC.svelte';
	import PrototypeSwitcher from '$lib/prototype/PrototypeSwitcher.svelte';
	import { page } from '$app/stores';

	let { data } = $props();
	let currentVariant = $derived($page.url.searchParams.get('variant') ?? 'A');
	let plottedScores = $derived(data.speedTestScores.filter((score) => score.leaderboardEligible));
	let plottedMinimum = $derived(Math.min(...plottedScores.map((score) => score.netWpm)));
	let plottedMaximum = $derived(Math.max(...plottedScores.map((score) => score.netWpm)));
	let plottedStart = $derived(plottedScores.at(0)?.createdAt ?? 0);
	let plottedEnd = $derived(plottedScores.at(-1)?.createdAt ?? 0);

	function chartX(createdAt: number): number {
		const elapsedRange = plottedEnd - plottedStart;
		return elapsedRange === 0 ? 50 : 6 + ((createdAt - plottedStart) / elapsedRange) * 88;
	}

	/* The plot box is 100 x 32 so the SVG can keep its aspect ratio and round markers. */
	function chartY(netWpm: number): number {
		const spread = plottedMaximum - plottedMinimum;
		return spread === 0 ? 16 : 28 - ((netWpm - plottedMinimum) / spread) * 24;
	}

	function formatDate(createdAt: number): string {
		return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(createdAt));
	}

	function formatDuration(elapsedMs: number): string {
		const totalSeconds = Math.round(elapsedMs / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${minutes}m ${seconds}s`;
	}
</script>

<svelte:head>
	<title>Your typing history · GetTyping</title>
	<meta name="description" content="See your Speed Test trend, cleared Learn Stages, and Practice progress." />
</svelte:head>

<main>
	<TaskMasthead
		back="/"
		backLabel="Back home"
		label="Progress over time"
		title="Your typing history"
		lead="Each Track shows only the Scores that can be compared honestly."
		keys={['W', 'P', 'M']}
	/>

	<div class="task-body">
		<section class="panel" aria-labelledby="speed-heading">
			<div class="panel-heading">
				<h2 id="speed-heading">Speed Test</h2>
				<p>Same text every time</p>
			</div>

			{#if data.speedTestScores.length === 0}
				<p class="empty-state">No Speed Test Attempts yet. Your trend will start after the first one.</p>
			{:else}
				{#if plottedScores.length > 0}
					<div class="trend-card">
						<svg viewBox="0 0 100 32" role="img" aria-label="Eligible Speed Test Net WPM trend">
							{#if plottedScores.length > 1}
								<polyline
									points={plottedScores.map((score) => `${chartX(score.createdAt)},${chartY(score.netWpm)}`).join(' ')}
									fill="none"
									vector-effect="non-scaling-stroke"
								/>
							{/if}
							{#each plottedScores as score}
								<circle data-trend-score-id={score.id} cx={chartX(score.createdAt)} cy={chartY(score.netWpm)} r="1.6" vector-effect="non-scaling-stroke" />
							{/each}
						</svg>
						<div class="trend-range">
							<span>{plottedMinimum.toFixed(1)}–{plottedMaximum.toFixed(1)} WPM</span>
							<span>{formatDate(plottedStart)}–{formatDate(plottedEnd)}</span>
						</div>
					</div>
				{/if}
				<ol class="score-list">
					{#each [...data.speedTestScores].reverse() as score}
						<li data-speed-score-id={score.id}>
							<div><strong>{score.netWpm.toFixed(1)} net WPM</strong><span>{(score.accuracy * 100).toFixed(1)}% accuracy</span></div>
							<div class="score-meta">
								<span>{score.nickname}</span>
								<time datetime={new Date(score.createdAt).toISOString()}>{formatDate(score.createdAt)}</time>
								{#if !score.leaderboardEligible}<span class="not-ranked">Not ranked</span>{/if}
							</div>
						</li>
					{/each}
				</ol>
			{/if}
		</section>

		<section class="panel" aria-labelledby="learn-heading">
			<div class="panel-heading">
				<h2 id="learn-heading">Learn</h2>
				<p>Best by cleared Stage</p>
			</div>

			{#if data.learnScores.length === 0}
				<p class="empty-state">No cleared Stages yet. Your best Score appears after you clear one.</p>
			{:else}
				<ol class="learn-list">
					{#each data.learnScores as score}
						<li data-stage-id={score.stageId}>
							<span class="stage-number">{score.stageId}</span>
							<div><strong>{score.stageName}</strong><span>{score.nickname}</span></div>
							<div class="learn-best"><strong>{score.netWpm.toFixed(1)} net WPM</strong><span>{(score.accuracy * 100).toFixed(1)}% accuracy</span></div>
						</li>
					{/each}
				</ol>
			{/if}
		</section>

		<section class="panel" aria-labelledby="practice-heading">
			<div class="panel-heading">
				<h2 id="practice-heading">Practice</h2>
				<p>Useful as a whole</p>
			</div>

			{#if data.practice.attempts === 0}
				<p class="empty-state">No Practice Attempts yet.</p>
			{:else}
				<dl class="practice-aggregate">
					<div><dt>Attempts</dt><dd data-practice-count={data.practice.attempts}>{data.practice.attempts}</dd></div>
					<div><dt>Time typing</dt><dd data-practice-elapsed={formatDuration(data.practice.elapsedMs)}>{formatDuration(data.practice.elapsedMs)}</dd></div>
				</dl>
			{/if}

			<h3>Current Weak-key Profile</h3>

			<!-- PROTOTYPE: Heat map keyboard variants -->
			{#if currentVariant === 'A'}
				<VariantA />
			{:else if currentVariant === 'B'}
				<VariantB />
			{:else if currentVariant === 'C'}
				<VariantC />
			{:else}
				<p class="empty-profile">The Profile is still gathering enough samples to identify a weak key.</p>
			{/if}
		</section>
	</div>

	<PrototypeSwitcher
		variants={['A', 'B', 'C']}
		labels={{
			A: 'Full QWERTY Grid',
			B: 'Compact Heat Strip',
			C: 'Zone-Ranked List'
		}}
	/>
</main>

<style>
	main {
		--task-width: 54rem;

		display: flex;
		min-height: 100vh;
		flex-direction: column;
		overflow: hidden;
		background: var(--paper);
	}

	.task-body {
		position: relative;
		width: min(calc(100% - 2rem), var(--task-width));
		flex: 1;
		padding: 2.5rem 0 5rem;
		margin: 0 auto;
	}

	.task-body::before {
		position: absolute;
		z-index: 0;
		right: -18vw;
		bottom: -2.5rem;
		left: -18vw;
		height: 10rem;
		border-radius: 50%;
		background: var(--lesson-blue);
		content: '';
		opacity: 0.24;
		transform: rotate(-2deg);
	}

	.panel {
		position: relative;
		z-index: 1;
		padding: clamp(1.25rem, 3.5vw, 1.85rem);
		border-radius: 1.6rem;
		background: #fff;
		box-shadow: var(--shadow-paper);
	}

	.panel + .panel { margin-top: 1.25rem; }

	.panel-heading {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		padding-bottom: 0.9rem;
		border-bottom: 2px solid var(--line);
		margin-bottom: 1.1rem;
		flex-wrap: wrap;
	}

	.panel-heading h2 {
		margin: 0;
		font-family: var(--font-rounded);
		font-size: 1.55rem;
		letter-spacing: -0.02em;
	}

	.panel-heading p { margin: 0; color: var(--muted); font-size: 0.78rem; font-weight: 700; }

	.empty-state {
		margin: 0;
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
		background: var(--paper);
		color: var(--muted);
		font-size: 0.86rem;
		line-height: 1.55;
	}

	/* The trend is the Speed Track's own expression: cool panel, monospace scale. */
	.trend-card {
		padding: 1rem 1rem 0.75rem;
		border-radius: 1.1rem;
		margin-bottom: 1.1rem;
		background: var(--indigo);
	}

	.trend-card svg { display: block; width: 100%; max-height: 13rem; aspect-ratio: 100 / 32; overflow: visible; }
	.trend-card polyline { stroke: var(--sun); stroke-width: 3px; stroke-linecap: round; stroke-linejoin: round; }
	.trend-card circle { fill: #fff; stroke: var(--indigo); stroke-width: 3px; }

	.trend-range {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 0.75rem;
		color: var(--on-night);
		font: 700 0.7rem var(--font-mono);
		flex-wrap: wrap;
	}

	.score-list,
	.learn-list { padding: 0; margin: 0; list-style: none; }

	.score-list li {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.9rem 0;
	}

	.score-list li + li,
	.learn-list li + li { border-top: 2px solid var(--line); }

	.score-list li > div:first-child,
	.learn-list li > div,
	.learn-best { display: grid; gap: 0.22rem; }

	.score-list strong,
	.learn-best strong { font: 700 1rem var(--font-mono); }

	.score-list span,
	.score-list time,
	.learn-list span { color: var(--muted); font-size: 0.74rem; font-weight: 600; }

	.score-meta { display: flex; align-items: end; gap: 0.25rem; flex-direction: column; text-align: right; }

	.not-ranked {
		padding: 0.2rem 0.5rem;
		border-radius: 999px;
		background: var(--incorrect-fill);
		color: var(--incorrect-ink) !important;
		font-weight: 800;
	}

	.learn-list li {
		display: grid;
		grid-template-columns: 2.9rem 1fr auto;
		align-items: center;
		gap: 0.9rem;
		padding: 0.85rem 0;
	}

	.learn-list strong { font-family: var(--font-rounded); font-size: 1rem; }

	.stage-number {
		display: grid;
		width: 2.7rem;
		height: 2.7rem;
		place-items: center;
		border-radius: 50%;
		background: var(--mint);
		color: var(--night) !important;
		font: 700 1.05rem var(--font-rounded) !important;
		box-shadow: 0 4px 0 var(--mint-deep);
	}

	.learn-best { text-align: right; }

	.practice-aggregate {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
		margin: 0;
	}

	.practice-aggregate div {
		padding: 1rem 1.1rem;
		border-radius: 1rem;
		background: var(--paper-deep);
		box-shadow: 0 5px 0 var(--pencil-line);
	}

	.practice-aggregate dt { color: var(--muted); font-size: 0.68rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; }
	.practice-aggregate dd { margin: 0.35rem 0 0; font: 700 1.35rem var(--font-mono); }

	h3 {
		margin: 1.75rem 0 0.85rem;
		font-family: var(--font-rounded);
		font-size: 1.05rem;
	}

	/* Weak keys read as real keycaps, not chips. */
	.weak-keys { display: flex; gap: 0.6rem; flex-wrap: wrap; }

	.weak-keys > div {
		display: grid;
		min-width: 4.4rem;
		gap: 0.4rem;
		padding: 0.7rem 0.6rem;
		place-items: center;
		border-radius: 1rem;
		background: var(--incorrect-fill);
		box-shadow: 0 5px 0 var(--coral);
	}

	.weak-keys kbd {
		display: grid;
		width: 2.2rem;
		height: 2.2rem;
		place-items: center;
		border-radius: 0.6rem;
		background: #fff;
		font: 700 1.05rem var(--font-mono);
		box-shadow: 0 3px 0 var(--pencil-line);
		text-transform: uppercase;
	}

	.weak-keys span { color: var(--incorrect-ink); font-size: 0.66rem; font-weight: 800; }

	.empty-profile { margin: 0; color: var(--muted); font-size: 0.82rem; line-height: 1.5; }

	@media (max-width: 620px) {
		.task-body { width: min(calc(100% - 1.5rem), var(--task-width)); }
		.task-body::before { height: 8rem; }
		.learn-list li { grid-template-columns: 2.4rem 1fr; }
		.learn-best { grid-column: 2; text-align: left; }
		.practice-aggregate { grid-template-columns: minmax(0, 1fr); }
	}
</style>
