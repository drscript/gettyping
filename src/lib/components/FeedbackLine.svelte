<script lang="ts">
	import type { CharacterFeedbackItem } from '$lib/ui/types';
	import CharacterFeedback from './CharacterFeedback.svelte';

	let { items }: { items: CharacterFeedbackItem[] } = $props();
</script>

<div class="feedback-line" aria-label="Typing feedback">
	{#each items as item, index (`${index}-${item.character}`)}
		<CharacterFeedback character={item.character} state={item.state} />
	{/each}
</div>

<style>
	.feedback-line {
		display: flex;
		min-height: 3.2em;
		align-items: center;
		align-content: flex-start;
		flex-wrap: wrap;
		gap: 0.04em;
		font-family: var(--track-font-family);
		font-size: var(--track-font-size);
		font-weight: 600;
		line-height: 1.85;
		word-spacing: 0.25em;
	}
</style>
