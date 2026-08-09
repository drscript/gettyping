<script lang="ts">
	import { onMount } from 'svelte';
	import TrackFrame from '$lib/components/TrackFrame.svelte';
	import TypingAttempt, {
		type AttemptToType,
		type TypedScore
	} from '$lib/components/TypingAttempt.svelte';

	type PracticeMode = 'word-bank' | 'bigram';
	interface WeakKeyProfileItem { key: string; weakness: number }
	interface PracticeAttempt extends AttemptToType { exercise: { content: string; mode: PracticeMode } }

	let mode = $state<PracticeMode>('word-bank');
	let attempt = $state<PracticeAttempt>();
	let score = $state<TypedScore>();
	let startingWeakKeyProfile = $state<WeakKeyProfileItem[]>([]);
	let endingWeakKeyProfile = $state<WeakKeyProfileItem[]>();
	let loading = $state(true);
	let message = $state('');

	const comparedKeys = $derived.by(() => {
		const ending = endingWeakKeyProfile;
		if (!ending) return [];
		const before = startingWeakKeyProfile;
		return before.map((key) => ({
			key: key.key,
			before: key.weakness!,
			after: ending.find((current) => current.key === key.key)?.weakness ?? null
		}));
	});

	async function loadWeakKeyProfile(): Promise<WeakKeyProfileItem[]> {
		const response = await fetch('/api/weak-key-profile');
		return response.ok
			? ((await response.json()) as { keys: WeakKeyProfileItem[] }).keys
			: [];
	}

	async function startPractice(): Promise<void> {
		loading = true;
		message = '';
		score = undefined;
		endingWeakKeyProfile = undefined;
		const response = await fetch(`/api/attempts/practice?mode=${mode}`);
		if (response.status === 401) {
			window.location.assign('/');
			return;
		}
		if (response.status === 403) {
			window.location.assign('/speed-test');
			return;
		}
		if (!response.ok) {
			loading = false;
			message = 'Practice could not start. Please try again.';
			return;
		}
		attempt = (await response.json()) as PracticeAttempt;
		loading = false;
	}

	async function finishSession(): Promise<void> {
		endingWeakKeyProfile = await loadWeakKeyProfile();
		score = undefined;
	}

	onMount(async () => {
		startingWeakKeyProfile = await loadWeakKeyProfile();
		await startPractice();
	});
</script>

<svelte:head>
	<title>Practice · GetTyping</title>
	<meta name="description" content="Practise Exercises generated for your own weak keys." />
</svelte:head>

<main class="track-shell">
	<TrackFrame track="speed-test-practice">
		{#if loading}
			<section class="card" aria-live="polite"><p class="eyebrow">Practice</p><h1>Finding the right keys…</h1></section>
		{:else if endingWeakKeyProfile}
			<section class="card summary-card" aria-live="polite">
				<p class="eyebrow">Practice complete</p>
				<h1>Your weak keys are moving</h1>
				<p class="muted">This compares your Weak-key Profile when you started with where it is now.</p>
				{#if comparedKeys.length > 0}
					<div class="profile-comparison">
						{#each comparedKeys as item}
							<div class="profile-row">
								<kbd>{item.key}</kbd>
								<span>{Math.round(item.before * 100)}%</span>
								<span aria-hidden="true">→</span>
								<strong>{item.after === null ? 'below the sample floor' : `${Math.round(item.after * 100)}%`}</strong>
							</div>
						{/each}
					</div>
				{:else}
					<p class="empty-profile">Your Weak-key Profile is still gathering enough samples to show a comparison.</p>
				{/if}
				<div class="actions">
					<button class="primary" type="button" onclick={async () => { startingWeakKeyProfile = await loadWeakKeyProfile(); await startPractice(); }}>Practise some more</button>
					<a href="/speed-test">Retake the Speed Test</a>
					<a href="/">Back to home</a>
				</div>
			</section>
		{:else if score}
			<section class="card compact-score" aria-live="polite">
				<p class="eyebrow">Exercise complete</p>
				<div class="stats">
					<span>Net WPM<strong>{score.netWpm.toFixed(1)}</strong></span>
					<span>Accuracy<strong>{(score.accuracy * 100).toFixed(1)}%</strong></span>
					<span>Errors<strong>{score.errorCount}</strong></span>
				</div>
				<div class="mode-choice" aria-label="Next Practice style">
					<span>Next style</span>
					<button class:active={mode === 'word-bank'} type="button" onclick={() => (mode = 'word-bank')}>Readable words</button>
					<button class:active={mode === 'bigram'} type="button" onclick={() => (mode = 'bigram')}>Intense bigrams</button>
				</div>
				<div class="actions">
					<button class="primary" type="button" onclick={startPractice}>Next Exercise →</button>
					<button class="text-action" type="button" onclick={finishSession}>Finish for now</button>
				</div>
			</section>
		{:else if attempt}
			{#key attempt.token}
				<TypingAttempt
					{attempt}
					endpoint="/api/attempts/practice"
					track="speed-test-practice"
					label={`Practice · ${attempt.exercise.mode === 'word-bank' ? 'readable words' : 'focused bigrams'}`}
					heading="Work on what slows you down"
					oncomplete={(body) => {
						score = body.score;
					}}
					oninvalid={() => (message = 'That Attempt could not be saved. Please start a fresh Exercise.')}
				/>
			{/key}
		{/if}

		{#if message}<section class="error-card" role="alert"><p>{message}</p><button type="button" onclick={startPractice}>Start again</button></section>{/if}
	</TrackFrame>
</main>

<style>
	.track-shell { width: min(calc(100% - 2rem), 62rem); margin: 0 auto; padding: clamp(6.5rem, 12vh, 8rem) 0 4rem; }
	.card,
	.error-card { padding: clamp(1.1rem, 4vw, 1.75rem); border: 1px solid var(--line); border-radius: 1rem; background: var(--card); box-shadow: 0 1px 3px rgb(0 0 0 / 5%); }
	.card { max-width: 46rem; margin: 0 auto; }
	.eyebrow { margin: 0 0 0.55rem; color: var(--muted); font: 700 0.72rem var(--font-mono); letter-spacing: 0.1em; text-transform: uppercase; }
	h1 { margin: 0; font: 700 clamp(1.6rem, 5vw, 2.45rem) var(--font-mono); }
	.muted,
	.empty-profile { color: var(--muted); font-size: 0.86rem; line-height: 1.55; }
	.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.7rem; margin: 1.4rem 0; }
	.stats span { padding: 0.9rem; border: 1px solid var(--line); border-radius: 0.7rem; color: var(--muted); font-size: 0.68rem; text-transform: uppercase; }
	.stats strong { display: block; margin-top: 0.35rem; color: var(--ink); font: 700 1.25rem var(--font-mono); }
	.mode-choice { display: flex; align-items: center; gap: 0.55rem; margin: 1rem 0; color: var(--muted); font-size: 0.72rem; flex-wrap: wrap; }
	.mode-choice button { padding: 0.45rem 0.7rem; border: 1px solid var(--line); border-radius: 999px; background: var(--paper); cursor: pointer; }
	.mode-choice button.active { border-color: var(--ink); background: var(--ink); color: white; }
	.actions { display: flex; align-items: center; gap: 1rem; margin-top: 1.4rem; flex-wrap: wrap; }
	.actions a,
	.text-action { color: var(--muted); font-size: 0.8rem; }
	.primary { padding: 0.72rem 1.1rem; border: 1px solid var(--ink); border-radius: 999px; background: var(--ink); color: white; cursor: pointer; font-weight: 700; }
	.text-action { border: 0; background: transparent; cursor: pointer; text-decoration: underline; text-underline-offset: 0.2rem; }
	.profile-comparison { display: grid; gap: 0.55rem; margin: 1.5rem 0; }
	.profile-row { display: grid; grid-template-columns: 2rem 3rem 1rem 1fr; align-items: center; gap: 0.7rem; padding: 0.7rem; border-bottom: 1px solid var(--line); font-size: 0.8rem; }
	.profile-row kbd { display: grid; width: 2rem; height: 2rem; place-items: center; border: 1px solid var(--line-strong); border-radius: 0.4rem; background: var(--paper); font: 700 1rem var(--font-mono); }
	.profile-row strong { font-size: 0.78rem; }
	.error-card { margin-top: 1rem; border-color: var(--incorrect-line); }
	@media (max-width: 680px) { .track-shell { width: min(calc(100% - 1.25rem), 62rem); padding-top: 6rem; } .stats { grid-template-columns: 1fr; } }
</style>
