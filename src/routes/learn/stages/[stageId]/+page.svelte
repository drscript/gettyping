<script lang="ts">
	import { onMount } from 'svelte';
	import TrackFrame from '$lib/components/TrackFrame.svelte';
	import TypingAttempt, {
		type AttemptToType,
		type TypedScore
	} from '$lib/components/TypingAttempt.svelte';
	import LeaderboardPanel, { type LeaderboardView } from '$lib/components/LeaderboardPanel.svelte';

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

	async function startStage(): Promise<void> {
		loading = true;
		message = '';
		score = undefined;
		result = undefined;
		leaderboard = undefined;
		const response = await fetch(endpoint);
		if (response.status === 401) {
			window.location.assign('/');
			return;
		}
		if (!response.ok) {
			loading = false;
			message = response.status === 403 ? 'This Stage is not open yet.' : 'This Stage is not ready yet.';
			return;
		}
		attempt = (await response.json()) as LearnAttempt;
		loading = false;
	}

	onMount(() => void startStage());
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
	.learn-shell { width: min(calc(100% - 2rem), 62rem); margin: 0 auto; padding: clamp(6.5rem, 12vh, 8rem) 0 4rem; font-family: var(--font-rounded); }
	.card,
	.error-card { max-width: 46rem; margin: 0 auto; padding: clamp(1.25rem, 5vw, 2rem); border: 1px solid var(--line); border-radius: 1.2rem; background: var(--card); box-shadow: 0 1px 3px rgb(0 0 0 / 5%); }
	.failure-card { border-color: var(--incorrect-line); }
	.cleared-card { border-color: var(--correct-line); }
	.eyebrow { margin: 0 0 0.55rem; color: var(--muted); font: 700 0.72rem var(--font-sans); letter-spacing: 0.08em; text-transform: uppercase; }
	h1 { margin: 0; font-size: clamp(2rem, 8vw, 4.25rem); line-height: 1; }
	.target { margin: 0.65rem 0 0; font-size: clamp(1.15rem, 3vw, 1.45rem); }
	.speed-note { color: var(--muted); font-family: var(--font-sans); font-size: 0.82rem; line-height: 1.5; }
	.adult-help { margin: 1.6rem 0 0; color: var(--muted); font: 0.78rem/1.5 var(--font-sans); }
	.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.7rem; margin: 1.5rem 0; }
	.stats span { padding: 0.9rem; border: 1px solid var(--line); border-radius: 0.75rem; color: var(--muted); font: 0.7rem var(--font-sans); text-transform: uppercase; }
	.stats strong { display: block; margin-top: 0.3rem; color: var(--ink); font: 700 1.25rem var(--font-rounded); }
	.actions,
	.error-card { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
	.actions { margin-top: 1.5rem; }
	.actions a,
	.error-card a { color: var(--muted); font: 0.82rem var(--font-sans); }
	.primary,
	.error-card button { padding: 0.78rem 1.25rem; border: 1px solid var(--ink); border-radius: 999px; background: var(--ink); color: white; cursor: pointer; font-weight: 700; }
	.link-button { text-decoration: none; }
	.actions .link-button { color: white; }
	.error-card { max-width: 46rem; border-color: var(--incorrect-line); }
	.error-card p { width: 100%; margin: 0; }
	@media (max-width: 680px) { .learn-shell { width: min(calc(100% - 1.25rem), 62rem); padding-top: 6rem; } .stats { grid-template-columns: 1fr; } }
</style>
