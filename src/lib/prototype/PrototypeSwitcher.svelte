<!--
  PROTOTYPE — Floating variant switcher
  Shows at the bottom of the viewport. Click arrows or use ←/→ to cycle.
  Updates the URL search param so variants are shareable.
-->
<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let { variants, labels }: { variants: string[]; labels: Record<string, string> } = $props();

	let currentVariant = $derived($page.url.searchParams.get('variant') ?? variants[0]);

	function cycleTo(direction: 'next' | 'prev') {
		const currentIndex = variants.indexOf(currentVariant);
		const newIndex =
			direction === 'next'
				? (currentIndex + 1) % variants.length
				: (currentIndex - 1 + variants.length) % variants.length;
		const newVariant = variants[newIndex];
		const url = new URL($page.url);
		url.searchParams.set('variant', newVariant);
		goto(url.toString(), { replaceState: true, keepFocus: true });
	}

	function handleKeydown(event: KeyboardEvent) {
		// Don't intercept when user is typing in an input
		const target = event.target as HTMLElement;
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
			return;
		}
		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			cycleTo('prev');
		} else if (event.key === 'ArrowRight') {
			event.preventDefault();
			cycleTo('next');
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="switcher">
	<button
		type="button"
		class="switcher-btn"
		onclick={() => cycleTo('prev')}
		aria-label="Previous variant"
	>
		←
	</button>
	<div class="switcher-label">
		<span class="variant-key">{currentVariant}</span>
		<span class="variant-name">{labels[currentVariant] ?? currentVariant}</span>
	</div>
	<button
		type="button"
		class="switcher-btn"
		onclick={() => cycleTo('next')}
		aria-label="Next variant"
	>
		→
	</button>
</div>

<style>
	.switcher {
		position: fixed;
		bottom: 1.5rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 1000;
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 1.5rem;
		background: var(--ink, #1a1a2e);
		border-radius: 999px;
		box-shadow: 0 8px 24px rgb(0 0 0 / 25%);
		color: #fff;
		font: 700 0.85rem var(--font-sans, system-ui);
	}

	.switcher-btn {
		width: 2rem;
		height: 2rem;
		border: 0;
		border-radius: 50%;
		background: rgb(255 255 255 / 15%);
		color: #fff;
		font: 800 1.2rem var(--font-sans, system-ui);
		cursor: pointer;
		display: grid;
		place-items: center;
		transition: background 120ms ease;
	}

	.switcher-btn:hover {
		background: rgb(255 255 255 / 25%);
	}

	.switcher-btn:active {
		background: rgb(255 255 255 / 35%);
	}

	.switcher-label {
		display: grid;
		gap: 0.15rem;
		min-width: 12rem;
		text-align: center;
	}

	.variant-key {
		font: 800 1rem var(--font-mono, monospace);
		letter-spacing: 0.05em;
	}

	.variant-name {
		font: 600 0.72rem var(--font-sans, system-ui);
		opacity: 0.75;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
</style>
