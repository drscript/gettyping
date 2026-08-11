<script lang="ts">
	import { onMount, tick } from 'svelte';
	import FeedbackLine from './FeedbackLine.svelte';
	import OnScreenKeyboard from './OnScreenKeyboard.svelte';
	import type { CharacterFeedbackItem, TrackFlex, TypingKey } from '$lib/ui/types';
	import { typingKeys } from '$lib/ui/types';
	import { createAttemptAudioFeedback } from '$lib/ui/audio-feedback';

	export interface AttemptToType {
		token: string;
		exercise: { content: string };
	}

	export interface TypedScore {
		id: number;
		netWpm: number;
		grossWpm: number;
		accuracy: number;
		elapsedMs: number;
		charCount: number;
		errorCount: number;
	}

	let {
		attempt,
		endpoint,
		track,
		label,
		heading,
		oncomplete,
		oninvalid
	}: {
		attempt: AttemptToType;
		endpoint: string;
		track: TrackFlex;
		label: string;
		heading: string;
		oncomplete: (body: {
			score: TypedScore;
			result?: Record<string, unknown>;
			leaderboard?: Record<string, unknown>;
		}) => void;
		oninvalid: () => void;
	} = $props();

	let events = $state<Array<{ expected: string; received: string; timestampOffsetMs: number }>>(
		[]
	);
	let typedCharacters = $state<string[]>([]);
	let cursor = $state(0);
	let startedAt = $state(0);
	let submitting = $state(false);
	let typingPanel = $state<HTMLElement>();
	let typedKeyCount = 0;
	let correctKeyCount = 0;
	const audioFeedback = createAttemptAudioFeedback();

	const content = $derived(attempt.exercise.content);
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
		if (next && next !== next.toLowerCase() && /[a-z]/i.test(next)) return 'shift';
		return typingKeys.includes(next as TypingKey) ? (next as TypingKey) : undefined;
	});
	const liveWpm = $derived.by(() => {
		const elapsedMs = events.at(-1)?.timestampOffsetMs ?? 0;
		const characterCount = events.filter((event) => event.received !== 'Backspace').length;
		return elapsedMs > 0 ? characterCount / 5 / (elapsedMs / 60_000) : 0;
	});

	async function finishAttempt(): Promise<void> {
		if (submitting) return;
		submitting = true;
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ token: attempt.token, events })
		});
		if (!response.ok) {
			submitting = false;
			oninvalid();
			return;
		}
		oncomplete(
			(await response.json()) as {
				score: TypedScore;
				result?: Record<string, unknown>;
				leaderboard?: Record<string, unknown>;
			}
		);
	}

	function recordKey(event: KeyboardEvent): void {
		if (submitting || event.metaKey || event.ctrlKey || event.altKey) return;

		const timestampOffsetMs = Math.max(0, performance.now() - startedAt);
		if (event.key === 'Backspace') {
			if (cursor === 0) return;
			event.preventDefault();
			if (event.repeat) return;
			events.push({ expected: content[cursor - 1], received: 'Backspace', timestampOffsetMs });
			cursor -= 1;
			typedCharacters = typedCharacters.slice(0, cursor);
			return;
		}

		if ([...event.key].length !== 1 || cursor >= content.length) return;
		event.preventDefault();
		if (event.repeat) return;
		const expected = content[cursor];
		events.push({ expected, received: event.key, timestampOffsetMs });
		typedKeyCount += 1;
		const correct = event.key === expected;
		if (correct) correctKeyCount += 1;
		audioFeedback.recordKey(correct, correctKeyCount / typedKeyCount);
		typedCharacters[cursor] = event.key;
		cursor += 1;
		if (cursor === content.length) void finishAttempt();
	}

	onMount(async () => {
		startedAt = performance.now();
		await tick();
		typingPanel?.focus();
	});
</script>

<header class="attempt-header" data-track={track}>
	<div>
		<p class="eyebrow">{label}</p>
		<h1>{heading}</h1>
		<p>Accuracy and speed are measured from the same keystrokes.</p>
	</div>
	<div class="live-speed" role="group" aria-label={`Advisory live speed: ${liveWpm.toFixed(0)} words per minute`}>
		<strong>{liveWpm.toFixed(0)}</strong>
		<span>live WPM</span>
		<small>advisory</small>
	</div>
</header>

<div
	class="typing-panel"
	class:is-submitting={submitting}
	aria-label={`${label} typing area`}
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

<style>
	.attempt-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 2rem;
		margin-bottom: 1.6rem;
	}

	.eyebrow {
		width: fit-content;
		padding: 0.42rem 0.7rem;
		margin: 0 0 0.65rem;
		border-radius: 999px;
		background: var(--indigo);
		color: #fff;
		font: 800 0.7rem var(--font-sans);
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0;
		font-family: var(--track-font-family);
		font-size: clamp(2rem, 5vw, 3.5rem);
		letter-spacing: -0.025em;
		line-height: 1;
	}

	.attempt-header p:last-child {
		margin: 0.55rem 0 0;
		color: var(--muted);
		font-size: 0.9rem;
		font-weight: 600;
		line-height: 1.5;
	}

	.live-speed {
		display: grid;
		min-width: 8.5rem;
		padding: 1rem 1.2rem;
		border-radius: 1.25rem;
		background: var(--indigo);
		color: #fff;
		box-shadow: 0 7px 0 var(--night), 0 14px 24px rgb(33 24 95 / 20%);
		text-align: right;
	}

	.live-speed strong { font: 700 1.8rem var(--font-mono); }
	.live-speed span,
	.live-speed small { color: var(--on-night); font-size: 0.66rem; font-weight: 800; text-transform: uppercase; }

	.typing-panel {
		position: relative;
		padding: clamp(1.4rem, 4vw, 2.4rem);
		border: 2px solid var(--line);
		border-radius: 1.6rem;
		background: var(--card);
		box-shadow: var(--shadow-card);
		outline: none;
		transition: border-color 140ms var(--ease-pop), box-shadow 140ms var(--ease-pop), transform 140ms var(--ease-pop);
	}

	.typing-panel:focus { border-color: var(--indigo-active); box-shadow: 0 8px 0 var(--key-edge-deep), 0 0 0 5px rgb(75 68 189 / 18%), 0 22px 34px rgb(33 24 95 / 16%); transform: translateY(-2px); }
	.typing-panel.is-submitting { opacity: 0.72; }
	.typing-instructions,
	.saving { margin: 0 0 1.15rem; color: var(--muted); font-size: 0.78rem; font-weight: 700; }
	.saving { margin: 1rem 0 0; }

	@media (max-width: 680px) {
		.attempt-header { align-items: stretch; flex-direction: column; gap: 1rem; }
		.live-speed { align-self: flex-start; text-align: left; }
		.typing-panel { padding: 1.15rem; border-radius: 1.2rem; }
	}
</style>
