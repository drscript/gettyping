<script lang="ts">
	import { onMount } from 'svelte';
	import TrackFrame from '$lib/components/TrackFrame.svelte';
	import TypingAttempt, {
		type AttemptToType,
		type TypedScore
	} from '$lib/components/TypingAttempt.svelte';

	let { data } = $props();
	let attempt = $state<AttemptToType>();
	let score = $state<TypedScore>();
	let loading = $state(true);
	let message = $state('');

	async function startAttempt(): Promise<void> {
		loading = true;
		message = '';
		score = undefined;
		const response = await fetch('/api/attempts/speed-test');
		if (response.status === 401) {
			window.location.assign('/');
			return;
		}
		if (!response.ok) {
			loading = false;
			message = 'The Speed Test could not start. Please try again.';
			return;
		}
		attempt = (await response.json()) as AttemptToType;
		loading = false;
	}

	onMount(() => void startAttempt());
</script>

<svelte:head>
	<title>Speed Test · GetTyping</title>
	<meta name="description" content="Measure your typing speed and accuracy with the GetTyping Speed Test." />
</svelte:head>

<main class="track-shell">
	<TrackFrame track="speed-test-practice">
		{#if loading}
			<section class="status-card" aria-live="polite">
				<p class="eyebrow">Speed Test</p>
				<h1>Preparing your text…</h1>
			</section>
		{:else if score}
			<section class="score-card" aria-live="polite">
				<p class="eyebrow">Speed Test complete</p>
				<h1>{score.netWpm.toFixed(1)} <span>net WPM</span></h1>
				<p class="score-note">This is your server-checked typing speed.</p>
				<dl class="score-grid">
					<div><dt>Accuracy</dt><dd>{(score.accuracy * 100).toFixed(1)}%</dd></div>
					<div><dt>Gross WPM</dt><dd>{score.grossWpm.toFixed(1)}</dd></div>
					<div><dt>Time</dt><dd>{(score.elapsedMs / 1000).toFixed(1)}s</dd></div>
					<div><dt>Errors left</dt><dd>{score.errorCount}</dd></div>
				</dl>
				<div class="score-actions">
					<a class="primary-action" href="/practice">Practise your weak keys →</a>
					<button type="button" onclick={startAttempt}>Take it again</button>
				</div>
				{#if score.netWpm < data.speedTestFloorWpm}
					<p class="learn-offer">Want a gentler start? <a href="/learn/stages/1">Start from the beginning instead</a>.</p>
				{/if}
			</section>
		{:else if attempt}
			{#key attempt.token}
				<TypingAttempt
					{attempt}
					endpoint="/api/attempts/speed-test"
					track="speed-test-practice"
					label="Speed Test"
					heading="Type at your natural pace"
					oncomplete={(body) => (score = body.score)}
					oninvalid={() => (message = 'That Attempt could not be saved. Please start a fresh Speed Test.')}
				/>
			{/key}
		{/if}

		{#if message}
			<section class="error-card" role="alert">
				<p>{message}</p>
				<button type="button" onclick={startAttempt}>Start again</button>
			</section>
		{/if}
	</TrackFrame>
</main>

<style>
	.track-shell { width: min(calc(100% - 2rem), 62rem); margin: 0 auto; padding: clamp(6.5rem, 12vh, 8rem) 0 4rem; }
	.status-card,
	.score-card,
	.error-card { padding: clamp(1.1rem, 4vw, 1.75rem); border: 1px solid var(--line); border-radius: 1rem; background: var(--card); box-shadow: 0 1px 3px rgb(0 0 0 / 5%); }
	.score-card { max-width: 44rem; margin: 0 auto; }
	.eyebrow { margin: 0 0 0.55rem; color: var(--muted); font: 700 0.72rem var(--font-mono); letter-spacing: 0.1em; text-transform: uppercase; }
	h1 { margin: 0; font-family: var(--font-mono); font-size: clamp(1.55rem, 4vw, 2.35rem); line-height: 1.12; }
	.score-card h1 { font-size: clamp(2.3rem, 8vw, 4rem); }
	.score-card h1 span { color: var(--muted); font-size: 0.3em; letter-spacing: 0.04em; text-transform: uppercase; }
	.score-note,
	.learn-offer { color: var(--muted); font-size: 0.82rem; line-height: 1.5; }
	.score-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(7.5rem, 1fr)); gap: 0.7rem; margin: 1.8rem 0; }
	.score-grid div { padding: 0.9rem; border: 1px solid var(--line); border-radius: 0.7rem; background: var(--paper); }
	.score-grid dt { color: var(--muted); font-size: 0.68rem; text-transform: uppercase; }
	.score-grid dd { margin: 0.3rem 0 0; font: 700 1.15rem var(--font-mono); }
	.score-actions { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
	.primary-action,
	.score-actions button,
	.error-card button { padding: 0.72rem 1.1rem; border: 1px solid var(--ink); border-radius: 999px; cursor: pointer; font-weight: 700; text-decoration: none; }
	.primary-action { background: var(--ink); color: white; }
	.score-actions button { background: transparent; color: var(--ink); }
	.error-card { margin-top: 1rem; border-color: var(--incorrect-line); }
	.error-card p { margin: 0 0 0.8rem; }
	@media (max-width: 680px) { .track-shell { width: min(calc(100% - 1.25rem), 62rem); padding-top: 6rem; } .score-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
