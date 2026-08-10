<script lang="ts">
	import type { CharacterFeedbackState } from '$lib/ui/types';
	import { isSpaceKey } from '$lib/ui/types';

	let {
		character,
		state = 'pending'
	}: { character: string; state?: CharacterFeedbackState } = $props();

	const stateLabel: Record<CharacterFeedbackState, string> = {
		correct: 'correct',
		incorrect: 'incorrect',
		current: 'next character',
		pending: 'not typed yet'
	};
</script>

<span
	class="feedback-character"
	class:is-space={isSpaceKey(character)}
	data-state={state}
	aria-label={`${isSpaceKey(character) ? 'space' : character}: ${stateLabel[state]}`}
>
	<span class="character" aria-hidden="true">{isSpaceKey(character) ? '\u00a0' : character}</span>
	{#if state === 'correct'}
		<span class="state-glyph" aria-hidden="true">✓</span>
	{:else if state === 'incorrect'}
		<span class="state-glyph" aria-hidden="true">×</span>
	{/if}
</span>

<style>
	.feedback-character {
		display: inline-flex;
		min-width: 0.72em;
		min-height: 1.5em;
		padding: 0.03em 0.12em;
		align-items: center;
		justify-content: center;
		border: 2px solid transparent;
		border-radius: 0.32em;
		line-height: 1.35;
		white-space: pre;
	}

	.feedback-character[data-state='correct'] {
		border-color: var(--correct-line);
		background: var(--correct-fill);
		box-shadow: 0 0.12em 0 var(--mint-deep);
	}

	.feedback-character[data-state='incorrect'] {
		border-style: dashed;
		border-color: var(--incorrect-line);
		background: var(--incorrect-fill);
		box-shadow: 0 0.12em 0 var(--coral-deep);
	}

	.feedback-character[data-state='current'] {
		border-color: var(--sun);
		background: var(--highlight);
		box-shadow: 0 0.12em 0 var(--sun-deep);
	}

	.state-glyph {
		align-self: flex-start;
		margin-left: 0.08em;
		font-family: var(--font-mono);
		font-size: 0.5em;
		font-weight: 600;
		line-height: 1.2;
	}

	.feedback-character[data-state='correct'] .state-glyph {
		color: var(--correct-ink);
	}

	.feedback-character[data-state='incorrect'] .state-glyph {
		color: var(--incorrect-ink);
	}

	.feedback-character.is-space {
		border-color: transparent;
		background: transparent;
	}

	.feedback-character.is-space[data-state='incorrect'] {
		border-color: var(--incorrect-line);
		background: var(--incorrect-fill);
		box-shadow: inset 0 0 0 1px var(--incorrect-line), 0 0.12em 0 var(--coral-deep);
	}

	.feedback-character.is-space .state-glyph {
		display: none;
	}
</style>
