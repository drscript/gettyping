<script lang="ts">
	import { untrack } from 'svelte';
	import TrackFrame from '$lib/components/TrackFrame.svelte';
	import TypingAttempt, {
		type AttemptToType,
		type TypedScore
	} from '$lib/components/TypingAttempt.svelte';
	import LeaderboardPanel, { type LeaderboardView } from '$lib/components/LeaderboardPanel.svelte';
	import { playCompletionSound } from '$lib/ui/audio-feedback';

	interface LearnAttempt extends AttemptToType {
		exercise: { id: number; stageId: number; content: string };
		stage: { id: number; name: string; keysTaught: string[]; requiredAccuracy: number };
	}
	interface StageResult {
		state: 'cleared' | 'failed' | 'completed';
		achievedAccuracy: number;
		requiredAccuracy: number;
		nextStageId: number | null;
		adultHelpAvailable?: boolean;
	}

	let { data } = $props();
	let attempt = $state<LearnAttempt>();
	let score = $state<TypedScore>();
	let result = $state<StageResult>();
	let leaderboard = $state<LeaderboardView>();
	let loading = $state(true);
	let message = $state('');
	const endpoint = $derived(`/api/attempts/learn/${data.stageId}`);
	// "Next Stage" navigates within this same route, so the component is reused and
	// only the loaded Stage id changes. Every load is numbered so a slow response
	// for an abandoned Stage cannot overwrite the Stage the Player is now on.
	let currentLoad = 0;

	async function startStage(): Promise<void> {
		const load = ++currentLoad;
		const stageEndpoint = endpoint;
		loading = true;
		message = '';
		attempt = undefined;
		score = undefined;
		result = undefined;
		leaderboard = undefined;
		let response: Response;
		try {
			response = await fetch(stageEndpoint);
		} catch {
			// A rejected fetch must not strand the Player on the loading state forever.
			if (load !== currentLoad) return;
			loading = false;
			message = 'This Stage is not ready yet.';
			return;
		}
		if (load !== currentLoad) return;
		if (response.status === 401) {
			window.location.assign('/');
			return;
		}
		if (!response.ok) {
			loading = false;
			message = response.status === 403 ? 'This Stage is not open yet.' : 'This Stage is not ready yet.';
			return;
		}
		const loaded = (await response.json()) as LearnAttempt;
		if (load !== currentLoad) return;
		attempt = loaded;
		loading = false;
	}

	$effect(() => {
		data.stageId;
		untrack(() => void startStage());
	});
</script>

<svelte:head>
	<title>Stage {data.stageId} · Learn · GetTyping</title>
	<meta name="description" content={`Learn typing in Stage ${data.stageId}.`} />
</svelte:head>

<main class="learn-shell">
	<TrackFrame track="learn">
		{#if loading}
			<section class="card" aria-live="polite"><p class="eyebrow">Learn · Stage {data.stageId}</p><h1>Getting your Stage ready…</h1></section>
		{:else if score && result?.state === 'failed'}
			<section class="card failure-card" aria-live="polite">
				<p class="eyebrow">Stage {data.stageId}</p>
				<h1>{Math.round(result.achievedAccuracy * 100)}%</h1>
				<p class="target">You need <strong>{Math.round(result.requiredAccuracy * 100)}%</strong> to clear this Stage.</p>
				<p class="speed-note">You typed at {score.netWpm.toFixed(1)} net WPM. Speed never decides whether you clear.</p>
				<div class="actions">
					<button class="primary" type="button" onclick={startStage}>Try again</button>
					<a href="/">Back to home</a>
				</div>
				{#if result.adultHelpAvailable}
					<p class="adult-help">A grown-up can help if this Stage is truly stuck. <a href="/grown-ups">Show them the grown-ups page.</a></p>
				{/if}
			</section>
		{:else if score && result?.state === 'completed'}
			<section class="card cleared-card" aria-live="polite">
				<p class="eyebrow">All 21 Stages cleared</p>
				<h1>You learned the whole keyboard ✓</h1>
				<div class="stats">
					<span>Accuracy<strong>{(score.accuracy * 100).toFixed(1)}%</strong></span>
					<span>Net WPM<strong>{score.netWpm.toFixed(1)}</strong></span>
					<span>Errors<strong>{score.errorCount}</strong></span>
				</div>
				{#if leaderboard}<LeaderboardPanel {leaderboard} />{/if}
				<div class="actions">
					<a class="primary link-button" href="/speed-test">Take the Speed Test →</a>
					<a href="/">See all Stages</a>
				</div>
			</section>
		{:else if score && result?.state === 'cleared'}
			<section class="card cleared-card" aria-live="polite">
				<p class="eyebrow">Stage {data.stageId} cleared</p>
				<h1>Nicely done ✓</h1>
				<div class="stats">
					<span>Accuracy<strong>{(score.accuracy * 100).toFixed(1)}%</strong></span>
					<span>Net WPM<strong>{score.netWpm.toFixed(1)}</strong></span>
					<span>Errors<strong>{score.errorCount}</strong></span>
				</div>
				{#if leaderboard}<LeaderboardPanel {leaderboard} />{/if}
				<p class="speed-note">
					{score.accuracy >= result.requiredAccuracy
						? 'Your accuracy opened the next Stage. Speed was measured, but it did not gate you.'
						: 'This Stage was already cleared, so your path stays open. This replay was still recorded.'}
				</p>
				<div class="actions">
					{#if result.nextStageId}
						<a class="primary link-button" href={`/learn/stages/${result.nextStageId}`}>Next Stage →</a>
					{/if}
					<a href="/">Back to home</a>
				</div>
			</section>
		{:else if attempt}
			{#key attempt.token}
				<TypingAttempt
					{attempt}
					{endpoint}
					track="learn"
					label={`Learn · Stage ${attempt.stage.id} · ${attempt.stage.name}`}
					heading={`Find ${attempt.stage.keysTaught.map((key) => key.toUpperCase()).join(' and ')}`}
					oncomplete={(body) => {
						score = body.score;
						result = body.result as unknown as StageResult;
						leaderboard = body.leaderboard as unknown as LeaderboardView;
						if (result.achievedAccuracy >= result.requiredAccuracy) playCompletionSound();
					}}
					oninvalid={() => (message = 'That Attempt could not be saved. Please start the Stage again.')}
				/>
			{/key}
		{/if}

		{#if message}
			<section class="error-card" role="alert"><p>{message}</p><button type="button" onclick={startStage}>Try again</button><a href="/">Back to home</a></section>
		{/if}
	</TrackFrame>
</main>

<style>
	/*
	 * Task surfaces keep the room overhead and the terrain underfoot, but the
	 * Attempt panel stays the dominant object: no masthead competes with it.
	 */
	.learn-shell { position: relative; width: min(calc(100% - 2rem), 62rem); min-height: 100vh; margin: 0 auto; padding: clamp(9rem, 15vh, 11rem) 0 6rem; font-family: var(--font-sans); }
	.learn-shell::before { position: absolute; z-index: -1; top: -6rem; left: calc(50% - 50vw); width: 100vw; height: 14rem; border-radius: 0 0 50% 50% / 0 0 3rem 3rem; background: var(--night); content: ''; }
	.learn-shell::after { position: absolute; z-index: -1; right: -20vw; bottom: 0; left: -20vw; height: 12rem; border-radius: 50%; background: var(--sun); content: ''; opacity: 0.34; transform: rotate(-2deg); }
	.card,
	.error-card { position: relative; max-width: 46rem; margin: 0 auto; padding: clamp(1.4rem, 5vw, 2.4rem); border: 2px solid var(--line); border-radius: 1.6rem; background: var(--card); box-shadow: var(--shadow-card); overflow: hidden; }
	.card > * { position: relative; z-index: 1; }
	/* The outcome tints the card as terrain rising into it, not as a diagonal wedge. */
	.failure-card::after,
	.cleared-card::after { position: absolute; z-index: 0; right: -12%; bottom: -3.5rem; left: -12%; height: 9rem; border-radius: 50%; content: ''; }
	.failure-card { border-color: var(--incorrect-line); }
	.failure-card::after { background: var(--incorrect-fill); }
	.cleared-card { border-color: var(--correct-line); }
	.cleared-card::after { background: var(--correct-fill); }
	.eyebrow { width: fit-content; padding: 0.4rem 0.7rem; margin: 0 0 0.7rem; border-radius: 999px; background: var(--indigo); color: #fff; font: 800 0.7rem var(--font-sans); letter-spacing: 0.08em; text-transform: uppercase; }
	h1 { max-width: 13ch; margin: 0; font: 700 clamp(2.4rem, 8vw, 5rem)/0.95 var(--font-rounded); letter-spacing: -0.035em; }
	.target { margin: 0.65rem 0 0; font-size: clamp(1.15rem, 3vw, 1.45rem); }
	.speed-note { max-width: 58ch; color: var(--muted); font-family: var(--font-sans); font-size: 0.86rem; font-weight: 600; line-height: 1.55; }
	.adult-help { margin: 1.6rem 0 0; color: var(--muted); font: 0.78rem/1.5 var(--font-sans); }
	.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.7rem; margin: 1.5rem 0; }
	.stats span { padding: 1rem; border-radius: 1rem; background: var(--paper-deep); color: var(--muted); font: 800 0.68rem var(--font-sans); text-transform: uppercase; box-shadow: 0 5px 0 #c9c3ec; }
	.stats span:nth-child(1) { background: var(--mint); color: var(--night); box-shadow: 0 5px 0 var(--mint-deep); }
	.stats span:nth-child(2) { background: var(--sun); color: var(--night); box-shadow: 0 5px 0 var(--sun-deep); }
	.stats strong { display: block; margin-top: 0.35rem; color: var(--ink); font: 700 1.4rem var(--font-rounded); }
	.actions,
	.error-card { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
	.actions { margin-top: 1.5rem; }
	.actions a,
	.error-card a { display: inline-flex; min-height: 2.75rem; align-items: center; padding: 0.5rem 0.75rem; color: var(--muted); font: 0.82rem var(--font-sans); }
	.primary,
	.error-card button { padding: 0.78rem 1.25rem; border: 0; border-radius: 999px; background: var(--sun); color: var(--ink); cursor: pointer; font-weight: 800; box-shadow: 0 5px 0 var(--sun-deep); }
	.link-button { text-decoration: none; }
	.actions .link-button { color: var(--ink); }
	.error-card { max-width: 46rem; border-color: var(--incorrect-line); }
	.error-card p { width: 100%; margin: 0; }
	@media (max-width: 680px) { .learn-shell { width: min(calc(100% - 1.25rem), 62rem); padding-top: 8.5rem; } .stats { grid-template-columns: 1fr; } .learn-shell::before { top: -6rem; height: 12rem; } .learn-shell::after { height: 9rem; } }
</style>
