<script lang="ts">
	import { onMount, tick } from 'svelte';
	import FeedbackLine from './FeedbackLine.svelte';
	import OnScreenKeyboard from './OnScreenKeyboard.svelte';
	import type { CharacterFeedbackItem, TrackFlex, TypingKey } from '$lib/ui/types';
	import { typingKeys } from '$lib/ui/types';

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
			events.push({ expected: content[cursor - 1], received: 'Backspace', timestampOffsetMs });
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
	<div class="live-speed" aria-label={`Advisory live speed: ${liveWpm.toFixed(0)} words per minute`}>
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
		align-items: flex-end;
		justify-content: space-between;
		gap: 2rem;
		margin-bottom: 1.4rem;
	}

	.eyebrow {
		margin: 0 0 0.55rem;
		color: var(--muted);
		font: 700 0.72rem var(--font-mono);
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0;
		font-family: var(--track-font-family);
		font-size: clamp(1.55rem, 4vw, 2.35rem);
		line-height: 1.12;
	}

	.attempt-header p:last-child {
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

	.live-speed strong { font: 700 1.45rem var(--font-mono); }
	.live-speed span,
	.live-speed small { color: var(--muted); font-size: 0.66rem; text-transform: uppercase; }

	.typing-panel {
		padding: clamp(1.1rem, 4vw, 1.75rem);
		border: 1px solid var(--line);
		border-radius: 1rem;
		background: var(--card);
		box-shadow: 0 1px 3px rgb(0 0 0 / 5%);
		outline: none;
		transition: border-color 120ms ease, box-shadow 120ms ease;
	}

	.typing-panel:focus { border-color: var(--focus-line); box-shadow: 0 0 0 3px rgb(230 201 77 / 20%); }
	.typing-panel.is-submitting { opacity: 0.72; }
	.typing-instructions,
	.saving { margin: 0 0 1rem; color: var(--muted); font-size: 0.75rem; }
	.saving { margin: 1rem 0 0; }

	@media (max-width: 680px) {
		.attempt-header { align-items: stretch; flex-direction: column; gap: 1rem; }
		.live-speed { align-self: flex-start; text-align: left; }
	}
</style>
