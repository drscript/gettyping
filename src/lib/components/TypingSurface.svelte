<script lang="ts">
	import type { CharacterFeedbackItem, TrackFlex, TypingKey } from '$lib/ui/types';
	import FeedbackLine from './FeedbackLine.svelte';
	import OnScreenKeyboard from './OnScreenKeyboard.svelte';
	import TrackFrame from './TrackFrame.svelte';

	let { track }: { track: TrackFlex } = $props();

	const nextExpectedKey: TypingKey = 'd';
	const feedback: CharacterFeedbackItem[] = [
		{ character: 'f', state: 'correct' },
		{ character: 'u', state: 'correct' },
		{ character: 'r', state: 'incorrect' },
		{ character: ' ', state: 'incorrect' },
		{ character: 'j', state: 'correct' },
		{ character: 'a', state: 'incorrect' },
		{ character: 'r', state: 'correct' },
		{ character: ' ', state: 'pending' },
		{ character: nextExpectedKey, state: 'current' },
		{ character: 'a', state: 'pending' },
		{ character: 'r', state: 'pending' },
		{ character: 'k', state: 'pending' },
		{ character: ' ', state: 'pending' },
		{ character: 'h', state: 'pending' },
		{ character: 'u', state: 'pending' },
		{ character: 'g', state: 'pending' }
	];
</script>

<TrackFrame {track}>
	<div class="typing-showcase">
		<section class="typing-panel" aria-label="Typing primitive preview">
			<div class="panel-label">
				<span>Learn · Stage 6 · Top row R &amp; U</span>
				<span>Attempt in progress</span>
			</div>
			<FeedbackLine items={feedback} />
		</section>

		<OnScreenKeyboard nextKey={nextExpectedKey} />
		<p class="keyboard-note">The next expected key stays highlighted on both Tracks.</p>
	</div>
</TrackFrame>

<style>
	.typing-panel {
		padding: 1.5rem;
		border: 1px solid var(--line);
		border-radius: 0.875rem;
		background: var(--card);
		box-shadow: 0 1px 3px rgb(0 0 0 / 5%);
	}

	.panel-label {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 0.9rem;
		color: var(--muted);
		font-family: var(--font-sans);
		font-size: 0.72rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.keyboard-note {
		margin: 1rem 0 0;
		color: var(--muted);
		font-family: var(--font-sans);
		font-size: 0.78rem;
		text-align: center;
	}

	@media (max-width: 560px) {
		.typing-panel {
			padding: 1.1rem;
		}

		.panel-label {
			align-items: flex-start;
			flex-direction: column;
			font-size: 0.62rem;
		}
	}
</style>
