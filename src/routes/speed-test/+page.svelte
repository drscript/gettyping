<script lang="ts">
	import { onMount } from 'svelte';
	import TrackFrame from '$lib/components/TrackFrame.svelte';
	import TypingAttempt, {
		type AttemptToType,
		type TypedScore
	} from '$lib/components/TypingAttempt.svelte';
	import LeaderboardPanel, { type LeaderboardView } from '$lib/components/LeaderboardPanel.svelte';

	let { data } = $props();
	let attempt = $state<AttemptToType>();
	let score = $state<TypedScore>();
	let leaderboard = $state<LeaderboardView>();
	let loading = $state(true);
	let message = $state('');

	async function startAttempt(): Promise<void> {
		loading = true;
		message = '';
		score = undefined;
		leaderboard = undefined;
		let response: Response;
		try {
			response = await fetch('/api/attempts/speed-test');
		} catch {
			// A rejected fetch must not strand the Player on the loading state forever.
			loading = false;
			message = 'The Speed Test could not start. Please try again.';
			return;
		}
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
					<div class:clean={score.errorCount === 0}><dt>Errors left</dt><dd>{score.errorCount}</dd></div>
				</dl>
				{#if leaderboard}<LeaderboardPanel {leaderboard} />{/if}
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
					oncomplete={(body) => {
						score = body.score;
						leaderboard = body.leaderboard as unknown as LeaderboardView;
					}}
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
	/* Same room and terrain as Learn, in the Speed Track's cooler temperature. */
	.track-shell { position: relative; width: min(calc(100% - 2rem), 62rem); min-height: 100vh; margin: 0 auto; padding: clamp(9rem, 15vh, 11rem) 0 6rem; }
	.track-shell::before { position: absolute; z-index: -1; top: -6rem; left: calc(50% - 50vw); width: 100vw; height: 14rem; border-radius: 0 0 50% 50% / 0 0 3rem 3rem; background: var(--night); content: ''; }
	.track-shell::after { position: absolute; z-index: -1; right: -20vw; bottom: 0; left: -20vw; height: 12rem; border-radius: 50%; background: var(--mint); content: ''; opacity: 0.3; transform: rotate(-2deg); }
	.status-card,
	.score-card,
	.error-card { padding: clamp(1.4rem, 4vw, 2.3rem); border: 2px solid var(--line); border-radius: 1.6rem; background: var(--card); box-shadow: var(--shadow-card); }
	.score-card { max-width: 44rem; margin: 0 auto; }
	.eyebrow { width: fit-content; padding: 0.4rem 0.7rem; margin: 0 0 0.7rem; border-radius: 999px; background: var(--indigo); color: #fff; font: 800 0.68rem var(--font-sans); letter-spacing: 0.08em; text-transform: uppercase; }
	h1 { margin: 0; font-family: var(--font-rounded); font-size: clamp(2.2rem, 6vw, 3.8rem); letter-spacing: -0.03em; line-height: 1; }
	.score-card h1 { font-size: clamp(2.3rem, 8vw, 4rem); }
	.score-card h1 span { color: var(--muted); font-size: 0.3em; letter-spacing: 0.04em; text-transform: uppercase; }
	.score-note,
	.learn-offer { color: var(--muted); font-size: 0.86rem; font-weight: 600; line-height: 1.55; }
	.score-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(7.5rem, 1fr)); gap: 0.7rem; margin: 1.8rem 0; }
	.score-grid div { padding: 1rem; border-radius: 1rem; background: var(--paper-deep); box-shadow: 0 5px 0 #c9c3ec; }
	.score-grid div:nth-child(1) { background: var(--mint); box-shadow: 0 5px 0 var(--mint-deep); }
	.score-grid div:nth-child(4) { background: var(--incorrect-fill); box-shadow: 0 5px 0 var(--coral); }
	.score-grid dt { color: var(--muted); font-size: 0.68rem; font-weight: 800; text-transform: uppercase; }
	.score-grid div:nth-child(1) dt { color: var(--night); }
	.score-grid div:nth-child(4) dt { color: var(--incorrect-ink); }
	/* A flawless Attempt must not be shown on an error-coloured tile. */
	.score-grid div.clean { background: var(--paper-deep); box-shadow: 0 5px 0 var(--pencil-line); }
	.score-grid div.clean dt { color: var(--muted); }
	.score-grid dd { margin: 0.3rem 0 0; font: 700 1.25rem var(--font-mono); }
	.score-actions { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
	.primary-action,
	.score-actions button,
	.error-card button { padding: 0.75rem 1.1rem; border: 0; border-radius: 999px; cursor: pointer; font-weight: 800; text-decoration: none; }
	.primary-action { background: var(--mint); color: var(--ink); box-shadow: 0 5px 0 var(--mint-deep); }
	.score-actions button { background: #fff; color: var(--ink); box-shadow: 0 5px 0 #c9c3ec; }
	.error-card { margin-top: 1rem; border-color: var(--incorrect-line); }
	.error-card p { margin: 0 0 0.8rem; }
	@media (max-width: 680px) { .track-shell { width: min(calc(100% - 1.25rem), 62rem); padding-top: 8.5rem; } .score-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .track-shell::before { top: -6rem; height: 12rem; } .track-shell::after { height: 9rem; } }
</style>
