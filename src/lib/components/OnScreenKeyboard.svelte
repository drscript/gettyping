<script lang="ts">
	import type { TypingKey } from '$lib/ui/types';
	import { isSpaceKey } from '$lib/ui/types';
	import { keyboardCapRows } from '$lib/ui/keyboard-caps';

	let { nextKey }: { nextKey: TypingKey } = $props();
</script>

<div class="keyboard" role="img" aria-label={`On-screen keyboard. Next key: ${isSpaceKey(nextKey) ? 'space' : nextKey}`}>
	{#each keyboardCapRows as row}
		<div class="keyboard-row">
			{#each row as cap}
				{@const isNext = cap.values.includes(nextKey)}
				<kbd class:is-next={isNext} class:is-wide={cap.wide}>
					{cap.label}
					{#if isNext}<span class="sr-only"> — next key</span>{/if}
				</kbd>
			{/each}
		</div>
	{/each}
</div>

<style>
	/*
	 * Keys are sized against the keyboard's own width, not the viewport, so eleven
	 * columns always fit whatever gutters the shell around it happens to use.
	 */
	.keyboard {
		display: grid;
		container-type: inline-size;
		gap: clamp(0.28rem, 1vw, 0.48rem);
		padding: clamp(0.75rem, 2vw, 1.2rem);
		margin-top: 1.65rem;
		border-radius: 1.4rem;
		background: #d9d5f2;
		box-shadow: inset 0 4px 0 rgb(255 255 255 / 58%), 0 10px 0 var(--key-edge-deep), 0 18px 28px rgb(33 24 95 / 14%);
	}

	.keyboard-row {
		display: flex;
		justify-content: center;
		gap: min(0.42rem, 0.85cqw);
	}

	kbd {
		display: grid;
		width: min(2.25rem, 8cqw);
		height: min(2.25rem, 8cqw);
		place-items: center;
		border: 0;
		border-radius: 0.72rem;
		background: var(--card);
		box-shadow: 0 4px 0 var(--key-edge), 0 7px 10px rgb(33 24 95 / 13%);
		color: var(--ink);
		font-family: var(--font-mono);
		font-size: min(0.75rem, max(0.6rem, 3cqw));
		font-weight: 500;
		white-space: nowrap;
	}

	/* DESIGN.md commits the next key to Sunshine; the pale --highlight tint read at 1.14:1
	   against the neighbouring white caps, which is not a teaching affordance. */
	kbd.is-next {
		background: var(--sun);
		box-shadow: 0 6px 0 var(--sun-deep), 0 10px 16px rgb(33 24 95 / 18%);
		font-weight: 700;
		transform: translateY(-4px) scale(1.06);
	}

	kbd.is-wide {
		width: min(12.5rem, 42cqw);
		color: var(--muted);
		font-size: min(0.6rem, max(0.55rem, 2.6cqw));
		letter-spacing: 0.06em;
	}

	.keyboard-row:nth-child(4) kbd.is-wide {
		width: min(4.75rem, 11cqw);
	}

	@media (max-width: 560px) {
		.keyboard { padding: 0.6rem 0.45rem; border-radius: 1rem; }
		kbd { border-radius: 0.5rem; }
	}
</style>
