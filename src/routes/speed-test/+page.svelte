<script lang="ts">
	import { onMount, tick } from 'svelte';
	import FeedbackLine from '$lib/components/FeedbackLine.svelte';
	import OnScreenKeyboard from '$lib/components/OnScreenKeyboard.svelte';
	import TrackFrame from '$lib/components/TrackFrame.svelte';
	import type { CharacterFeedbackItem, TypingKey } from '$lib/ui/types';
	import { typingKeys } from '$lib/ui/types';

	interface StartedAttempt {
		token: string;
		exercise: {
			id: number;
			content: string;
		};
	}

	interface KeystrokeEvent {
		expected: string;
		received: string;
		timestampOffsetMs: number;
	}

	interface Score {
		id: number;
		netWpm: number;
		grossWpm: number;
		accuracy: number;
		elapsedMs: number;
		charCount: number;
		errorCount: number;
	}

	let attempt = $state<StartedAttempt>();
	let events = $state<KeystrokeEvent[]>([]);
	let typedCharacters = $state<string[]>([]);
	let cursor = $state(0);
	let startedAt = $state(0);
	let score = $state<Score>();
	let loading = $state(true);
	let submitting = $state(false);
	let message = $state('');
	let typingPanel = $state<HTMLElement>();

	const content = $derived(attempt?.exercise.content ?? '');
	const feedback = $derived.by((): CharacterFeedbackItem[] =>
		[...content].map((character, index) => ({
			character,
			state:
				index < cursor
					? typedCharacters[index] === character
						? 'correct'
						: 'incorrect'
					: index === cursor
						? 'current'
						: 'pending'
		}))
	);
	const nextExpectedKey = $derived.by((): TypingKey | undefined => {
		const next = content[cursor];
		return typingKeys.includes(next as TypingKey) ? (next as TypingKey) : undefined;
	});
	const liveWpm = $derived.by(() => {
		const elapsedMs = events.at(-1)?.timestampOffsetMs ?? 0;
		const characterCount = events.filter((event) => event.received !== 'Backspace').length;
		return elapsedMs > 0 ? characterCount / 5 / (elapsedMs / 60_000) : 0;
	});

	async function startAttempt(): Promise<void> {
		loading = true;
		message = '';
		score = undefined;
		events = [];
		typedCharacters = [];
		cursor = 0;

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

		attempt = (await response.json()) as StartedAttempt;
		startedAt = performance.now();
		loading = false;
		await tick();
		typingPanel?.focus();
	}

	async function finishAttempt(): Promise<void> {
		if (!attempt || submitting) return;
		submitting = true;

		const response = await fetch('/api/attempts/speed-test', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ token: attempt.token, events })
		});
		if (!response.ok) {
			submitting = false;
			message = 'That Attempt could not be saved. Please start a fresh Speed Test.';
			return;
		}

		const savedScore = (await response.json()) as { score: Score };
		score = savedScore.score;
		submitting = false;
	}

	function recordKey(event: KeyboardEvent): void {
		if (!attempt || score || loading || submitting || event.metaKey || event.ctrlKey || event.altKey) {
			return;
		}

		const timestampOffsetMs = Math.max(0, performance.now() - startedAt);
		if (event.key === 'Backspace') {
			if (cursor === 0) return;
			event.preventDefault();
			events.push({
				expected: content[cursor - 1],
				received: 'Backspace',
				timestampOffsetMs
			});
			cursor -= 1;
			typedCharacters = typedCharacters.slice(0, cursor);
			return;
		}

		if ([...event.key].length !== 1 || cursor >= content.length) return;
		event.preventDefault();
		const expected = content[cursor];
		events.push({ expected, received: event.key, timestampOffsetMs });
		typedCharacters[cursor] = event.key;
		cursor += 1;

		if (cursor === content.length) void finishAttempt();
	}

	onMount(() => {
		void startAttempt();
	});
</script>

<svelte:head>
	<title>Speed Test · GetTyping</title>
	<meta
		name="description"
		content="Measure your typing speed and accuracy with the GetTyping Speed Test."
	/>
</svelte:head>

<main class="speed-test-shell">
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
					<div>
						<dt>Accuracy</dt>
						<dd>{(score.accuracy * 100).toFixed(1)}%</dd>
					</div>
					<div>
						<dt>Gross WPM</dt>
						<dd>{score.grossWpm.toFixed(1)}</dd>
					</div>
					<div>
						<dt>Time</dt>
						<dd>{(score.elapsedMs / 1000).toFixed(1)}s</dd>
					</div>
					<div>
						<dt>Characters typed</dt>
						<dd>{score.charCount}</dd>
					</div>
					<div>
						<dt>Errors left</dt>
						<dd>{score.errorCount}</dd>
					</div>
				</dl>

				<div class="score-actions">
					<button class="primary-action" type="button" onclick={startAttempt}>Take it again</button>
					<a href="/">Back to home</a>
				</div>
			</section>
		{:else if attempt}
			<header class="attempt-header">
				<div>
					<p class="eyebrow">Speed Test</p>
					<h1>Type at your natural pace</h1>
					<p>There is no pass or fail. Accuracy and speed are both measured.</p>
				</div>
				<div class="live-speed" aria-label={`Advisory live speed: ${liveWpm.toFixed(0)} words per minute`}>
					<strong>{liveWpm.toFixed(0)}</strong>
					<span>live WPM</span>
					<small>advisory</small>
				</div>
			</header>

			<div
				class="typing-panel"
				class:is-submitting={submitting}
				aria-label="Speed Test typing area"
				aria-describedby="typing-instructions"
				role="textbox"
				tabindex="0"
				bind:this={typingPanel}
				onkeydown={recordKey}
			>
				<p id="typing-instructions" class="typing-instructions">
					Start typing. Use Backspace to correct the previous character.
				</p>
				<FeedbackLine items={feedback} />
				{#if submitting}<p class="saving">Checking your Score…</p>{/if}
			</div>

			{#if nextExpectedKey}<OnScreenKeyboard nextKey={nextExpectedKey} />{/if}
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
	.speed-test-shell {
		width: min(calc(100% - 2rem), 62rem);
		margin: 0 auto;
		padding: clamp(6.5rem, 12vh, 8rem) 0 4rem;
	}

	.attempt-header {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 2rem;
		margin-bottom: 1.4rem;
	}

	.eyebrow {
		margin: 0 0 0.55rem;
		color: var(--muted);
		font-family: var(--font-mono);
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0;
		font-family: var(--font-mono);
		font-size: clamp(1.55rem, 4vw, 2.35rem);
		line-height: 1.12;
	}

	.attempt-header p:last-child,
	.score-note {
		margin: 0.55rem 0 0;
		color: var(--muted);
		font-size: 0.88rem;
		line-height: 1.5;
	}

	.live-speed {
		display: grid;
		min-width: 7.5rem;
		padding: 0.8rem 1rem;
		border: 1px solid var(--line);
		border-radius: 0.8rem;
		background: var(--card);
		text-align: right;
	}

	.live-speed strong {
		font-family: var(--font-mono);
		font-size: 1.45rem;
	}

	.live-speed span,
	.live-speed small {
		color: var(--muted);
		font-size: 0.66rem;
		text-transform: uppercase;
	}

	.typing-panel,
	.status-card,
	.score-card,
	.error-card {
		padding: clamp(1.1rem, 4vw, 1.75rem);
		border: 1px solid var(--line);
		border-radius: 1rem;
		background: var(--card);
		box-shadow: 0 1px 3px rgb(0 0 0 / 5%);
	}

	.typing-panel {
		outline: none;
		transition:
			border-color 120ms ease,
			box-shadow 120ms ease;
	}

	.typing-panel:focus {
		border-color: var(--focus-line);
		box-shadow: 0 0 0 3px rgb(230 201 77 / 20%);
	}

	.typing-panel.is-submitting {
		opacity: 0.72;
	}

	.typing-instructions,
	.saving {
		margin: 0 0 1rem;
		color: var(--muted);
		font-size: 0.75rem;
	}

	.saving {
		margin: 1rem 0 0;
	}

	.score-card {
		max-width: 44rem;
		margin: 0 auto;
	}

	.score-card h1 {
		font-size: clamp(2.3rem, 8vw, 4rem);
	}

	.score-card h1 span {
		color: var(--muted);
		font-size: 0.3em;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.score-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(7.5rem, 1fr));
		gap: 0.7rem;
		margin: 1.8rem 0;
	}

	.score-grid div {
		padding: 0.9rem;
		border: 1px solid var(--line);
		border-radius: 0.7rem;
		background: var(--paper);
	}

	.score-grid dt {
		color: var(--muted);
		font-size: 0.68rem;
		text-transform: uppercase;
	}

	.score-grid dd {
		margin: 0.3rem 0 0;
		font-family: var(--font-mono);
		font-size: 1.15rem;
		font-weight: 700;
	}

	.score-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.score-actions a {
		color: var(--muted);
		font-size: 0.82rem;
		text-underline-offset: 0.2rem;
	}

	.primary-action,
	.error-card button {
		padding: 0.72rem 1.1rem;
		border: 1px solid var(--ink);
		border-radius: 999px;
		background: var(--ink);
		color: white;
		cursor: pointer;
		font-weight: 700;
	}

	.error-card {
		margin-top: 1rem;
		border-color: var(--incorrect-line);
	}

	.error-card p {
		margin: 0 0 0.8rem;
	}

	@media (max-width: 680px) {
		.speed-test-shell {
			width: min(calc(100% - 1.25rem), 62rem);
			padding-top: 6rem;
		}

		.attempt-header {
			align-items: stretch;
			flex-direction: column;
			gap: 1rem;
		}

		.live-speed {
			align-self: flex-start;
			text-align: left;
		}

		.score-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
