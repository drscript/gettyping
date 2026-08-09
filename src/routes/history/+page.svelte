<script lang="ts">
	let { data } = $props();
	let plottedScores = $derived(data.speedTestScores.filter((score) => score.leaderboardEligible));
	let plottedMinimum = $derived(Math.min(...plottedScores.map((score) => score.netWpm)));
	let plottedMaximum = $derived(Math.max(...plottedScores.map((score) => score.netWpm)));
	let plottedStart = $derived(plottedScores.at(0)?.createdAt ?? 0);
	let plottedEnd = $derived(plottedScores.at(-1)?.createdAt ?? 0);

	function chartX(createdAt: number): number {
		const elapsedRange = plottedEnd - plottedStart;
		return elapsedRange === 0 ? 50 : 6 + ((createdAt - plottedStart) / elapsedRange) * 88;
	}

	function chartY(netWpm: number): number {
		const spread = plottedMaximum - plottedMinimum;
		return spread === 0 ? 50 : 88 - ((netWpm - plottedMinimum) / spread) * 76;
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
	<a class="back-link" href="/">← Back home</a>
	<header>
		<p class="eyebrow">Progress over time</p>
		<h1>Your typing history</h1>
		<p>Each Track shows only the Scores that can be compared honestly.</p>
	</header>

	<section aria-labelledby="speed-heading">
		<div class="section-heading">
			<div><p class="eyebrow">Same text every time</p><h2 id="speed-heading">Speed Test</h2></div>
		</div>
		{#if data.speedTestScores.length === 0}
			<p class="empty-state">No Speed Test Attempts yet. Your trend will start after the first one.</p>
		{:else}
			{#if plottedScores.length > 0}
				<div class="trend-card">
					<svg viewBox="0 0 100 100" role="img" aria-label="Eligible Speed Test Net WPM trend">
						{#if plottedScores.length > 1}
							<polyline
								points={plottedScores.map((score) => `${chartX(score.createdAt)},${chartY(score.netWpm)}`).join(' ')}
								fill="none"
								vector-effect="non-scaling-stroke"
							/>
						{/if}
						{#each plottedScores as score}
							<circle data-trend-score-id={score.id} cx={chartX(score.createdAt)} cy={chartY(score.netWpm)} r="2" />
						{/each}
					</svg>
					<div class="trend-range"><span>{plottedMinimum.toFixed(1)}–{plottedMaximum.toFixed(1)} WPM</span><span>{formatDate(plottedStart)}–{formatDate(plottedEnd)}</span></div>
				</div>
			{/if}
			<ol class="score-list">
				{#each [...data.speedTestScores].reverse() as score}
					<li data-speed-score-id={score.id}>
						<div><strong>{score.netWpm.toFixed(1)} net WPM</strong><span>{(score.accuracy * 100).toFixed(1)}% accuracy</span></div>
						<div class="score-meta"><span>{score.nickname}</span><time datetime={new Date(score.createdAt).toISOString()}>{formatDate(score.createdAt)}</time>{#if !score.leaderboardEligible}<span class="not-ranked">Not ranked</span>{/if}</div>
					</li>
				{/each}
			</ol>
		{/if}
	</section>

	<section aria-labelledby="learn-heading">
		<div class="section-heading">
			<div><p class="eyebrow">Best by cleared Stage</p><h2 id="learn-heading">Learn</h2></div>
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

	<section aria-labelledby="practice-heading">
		<div class="section-heading">
			<div><p class="eyebrow">Useful as a whole</p><h2 id="practice-heading">Practice</h2></div>
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
		{#if data.practice.weakKeys.length > 0}
			<div class="weak-keys">
				{#each data.practice.weakKeys as key}
					<div data-weak-key={key.key}><kbd>{key.key}</kbd><span>{Math.round(key.weakness * 100)}% weak</span></div>
				{/each}
			</div>
		{:else}
			<p class="empty-profile">The Profile is still gathering enough samples to identify a weak key.</p>
		{/if}
	</section>
</main>

<style>
	main { width: min(calc(100% - 2rem), 52rem); margin: 0 auto; padding: 5.5rem 0 5rem; }
	.back-link { color: var(--muted); font-size: 0.8rem; text-underline-offset: 0.22rem; }
	header { max-width: 42rem; margin: 2.2rem 0 2rem; }
	.eyebrow { margin: 0 0 0.45rem; color: var(--muted); font: 700 0.68rem var(--font-mono); letter-spacing: 0.09em; text-transform: uppercase; }
	h1 { margin: 0; font-family: var(--font-rounded); font-size: clamp(2rem, 7vw, 3.2rem); }
	header > p:last-child { color: var(--muted); font-size: 0.9rem; line-height: 1.55; }
	section { margin-top: 1rem; padding: 1.3rem; border: 1px solid var(--line); border-radius: 1rem; background: var(--card); }
	.section-heading h2 { margin: 0; font-size: 1.2rem; }
	.empty-state { margin: 1rem 0 0; padding: 1rem; border-radius: 0.7rem; background: var(--paper); color: var(--muted); font-size: 0.82rem; line-height: 1.5; }
	.trend-card { margin-top: 1rem; padding: 0.8rem; border-radius: 0.75rem; background: var(--paper); }
	.trend-card svg { display: block; width: 100%; height: 10rem; overflow: visible; }
	.trend-card polyline { stroke: var(--focus-line); stroke-width: 2px; }
	.trend-card circle { fill: var(--ink); stroke: var(--card); stroke-width: 1px; }
	.trend-range { display: flex; justify-content: space-between; gap: 1rem; color: var(--muted); font: 0.68rem var(--font-mono); }
	.score-list,
	.learn-list { padding: 0; margin: 1rem 0 0; list-style: none; }
	.score-list li { display: flex; align-items: start; justify-content: space-between; gap: 1rem; padding: 0.85rem 0; border-top: 1px solid var(--line); }
	.score-list li > div:first-child,
	.learn-list li > div,
	.learn-best { display: grid; gap: 0.2rem; }
	.score-list span,
	.score-list time,
	.learn-list span { color: var(--muted); font-size: 0.7rem; }
	.score-meta { display: flex; align-items: end; gap: 0.25rem; flex-direction: column; text-align: right; }
	.not-ranked { padding: 0.18rem 0.38rem; border-radius: 999px; background: var(--incorrect-fill); color: var(--incorrect-ink) !important; font-weight: 700; }
	.learn-list li { display: grid; grid-template-columns: 2.4rem 1fr auto; align-items: center; gap: 0.8rem; padding: 0.8rem 0; border-top: 1px solid var(--line); }
	.stage-number { display: grid; width: 2.3rem; height: 2.3rem; place-items: center; border-radius: 50%; background: var(--correct-fill); color: var(--correct-ink) !important; font: 700 0.9rem var(--font-rounded) !important; }
	.learn-best { text-align: right; }
	.practice-aggregate { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.7rem; margin: 1rem 0 1.4rem; }
	.practice-aggregate div { padding: 0.9rem; border-radius: 0.7rem; background: var(--paper); }
	.practice-aggregate dt { color: var(--muted); font-size: 0.68rem; text-transform: uppercase; }
	.practice-aggregate dd { margin: 0.3rem 0 0; font: 700 1.2rem var(--font-mono); }
	h3 { margin: 0; font-size: 0.9rem; }
	.weak-keys { display: flex; gap: 0.55rem; margin-top: 0.75rem; flex-wrap: wrap; }
	.weak-keys > div { display: flex; align-items: center; gap: 0.45rem; padding: 0.45rem 0.65rem; border: 1px solid var(--line); border-radius: 0.6rem; }
	.weak-keys kbd { font: 700 1rem var(--font-mono); }
	.weak-keys span,
	.empty-profile { color: var(--muted); font-size: 0.7rem; }
	@media (max-width: 560px) { main { width: min(calc(100% - 1.25rem), 52rem); padding-top: 5rem; } }
</style>
