<script lang="ts">
	import { onMount } from 'svelte';
	import TrackFrame from '$lib/components/TrackFrame.svelte';
	import TypingAttempt, {
		type AttemptToType,
		type TypedScore
	} from '$lib/components/TypingAttempt.svelte';

	type PracticeMode = 'sentence' | 'bigram';
	interface WeakKeyProfileItem { key: string; weakness: number }
	interface PracticeAttempt extends AttemptToType { exercise: { content: string; mode: PracticeMode } }

	let mode = $state<PracticeMode>('sentence');
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
		try {
			const response = await fetch('/api/weak-key-profile');
			return response.ok
				? ((await response.json()) as { keys: WeakKeyProfileItem[] }).keys
				: [];
		} catch {
			return [];
		}
	}

	async function startPractice(): Promise<void> {
		loading = true;
		message = '';
		score = undefined;
		endingWeakKeyProfile = undefined;
		let response: Response;
		try {
			response = await fetch(`/api/attempts/practice?mode=${mode}`);
		} catch {
			// A rejected fetch must not strand the Player on the loading state forever.
			loading = false;
			message = 'Practice could not start. Please try again.';
			return;
		}
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
								<strong>{item.after === null ? 'not enough tries yet' : `${Math.round(item.after * 100)}%`}</strong>
							</div>
						{/each}
					</div>
				{:else}
					<p class="empty-profile">Your Weak-key Profile is still gathering enough samples to show a comparison.</p>
				{/if}
				<div class="actions">
					<button class="primary" type="button" onclick={async () => { startingWeakKeyProfile = await loadWeakKeyProfile(); await startPractice(); }}>Practise some more</button>
					<a href="/speed-test">Take the Speed Test</a>
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
				<div class="mode-choice" role="group" aria-label="Next Practice style">
					<span>Next style</span>
					<button class:active={mode === 'sentence'} aria-pressed={mode === 'sentence'} type="button" onclick={() => (mode = 'sentence')}>Sentences</button>
					<button class:active={mode === 'bigram'} aria-pressed={mode === 'bigram'} type="button" onclick={() => (mode = 'bigram')}>Focused bigrams</button>
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
					label={`Practice · ${attempt.exercise.mode === 'sentence' ? 'sentences' : 'focused bigrams'}`}
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
	/* Same room and terrain as the Speed Test, one shade further into the blue. */
	.track-shell { position: relative; width: min(calc(100% - 2rem), 62rem); min-height: 100vh; margin: 0 auto; padding: clamp(9rem, 15vh, 11rem) 0 6rem; }
	.track-shell::before { position: absolute; z-index: -1; top: -6rem; left: calc(50% - 50vw); width: 100vw; height: 14rem; border-radius: 0 0 50% 50% / 0 0 3rem 3rem; background: var(--night); content: ''; }
	.track-shell::after { position: absolute; z-index: -1; right: -20vw; bottom: 0; left: -20vw; height: 12rem; border-radius: 50%; background: var(--lesson-blue); content: ''; opacity: 0.26; transform: rotate(-2deg); }
	.card,
	.error-card { padding: clamp(1.4rem, 4vw, 2.3rem); border: 2px solid var(--line); border-radius: 1.6rem; background: var(--card); box-shadow: var(--shadow-card); }
	.card { max-width: 46rem; margin: 0 auto; }
	.eyebrow { width: fit-content; padding: 0.4rem 0.7rem; margin: 0 0 0.7rem; border-radius: 999px; background: var(--indigo); color: #fff; font: 800 0.68rem var(--font-sans); letter-spacing: 0.08em; text-transform: uppercase; }
	h1 { margin: 0; font: 700 clamp(2.1rem, 6vw, 3.6rem)/1 var(--font-rounded); letter-spacing: -0.03em; }
	.muted,
	.empty-profile { color: var(--muted); font-size: 0.86rem; line-height: 1.55; }
	.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.7rem; margin: 1.4rem 0; }
	.stats span { padding: 1rem; border-radius: 1rem; background: var(--paper-deep); color: var(--muted); font-size: 0.68rem; font-weight: 800; text-transform: uppercase; box-shadow: 0 5px 0 #c9c3ec; }
	.stats span:nth-child(2) { background: var(--mint); color: var(--night); box-shadow: 0 5px 0 var(--mint-deep); }
	.stats strong { display: block; margin-top: 0.35rem; color: var(--ink); font: 700 1.25rem var(--font-mono); }
	.mode-choice { display: flex; align-items: center; gap: 0.55rem; margin: 1rem 0; color: var(--muted); font-size: 0.72rem; flex-wrap: wrap; }
	.mode-choice button { padding: 0.5rem 0.75rem; border: 0; border-radius: 999px; background: var(--paper-deep); cursor: pointer; font-weight: 700; box-shadow: 0 4px 0 #c9c3ec; }
	.mode-choice button.active { background: var(--indigo); color: #fff; box-shadow: 0 4px 0 var(--night); }
	.actions { display: flex; align-items: center; gap: 1rem; margin-top: 1.4rem; flex-wrap: wrap; }
	.actions a,
	.text-action { display: inline-flex; min-height: 2.75rem; align-items: center; padding: 0.5rem 0.75rem; color: var(--muted); font-size: 0.8rem; }
	.primary { padding: 0.75rem 1.1rem; border: 0; border-radius: 999px; background: var(--mint); color: var(--ink); cursor: pointer; font-weight: 800; box-shadow: 0 5px 0 var(--mint-deep); }
	.text-action { border: 0; background: transparent; cursor: pointer; text-decoration: underline; text-underline-offset: 0.2rem; }
	.profile-comparison { display: grid; gap: 0.55rem; margin: 1.5rem 0; }
	.profile-row { display: grid; grid-template-columns: 2.4rem 3rem 1rem 1fr; align-items: center; gap: 0.7rem; padding: 0.75rem; border-radius: 0.9rem; background: var(--paper-deep); font-size: 0.8rem; }
	.profile-row kbd { display: grid; width: 2.2rem; height: 2.2rem; place-items: center; border-radius: 0.6rem; background: #fff; font: 700 1rem var(--font-mono); box-shadow: 0 4px 0 var(--key-edge); }
	.profile-row strong { font-size: 0.78rem; }
	.error-card { margin-top: 1rem; border-color: var(--incorrect-line); }
	@media (max-width: 680px) { .track-shell { width: min(calc(100% - 1.25rem), 62rem); padding-top: 8.5rem; } .stats { grid-template-columns: 1fr; } .track-shell::before { top: -6rem; height: 12rem; } .track-shell::after { height: 9rem; } }
</style>
