<script lang="ts">
	import { onMount } from 'svelte';
	import { mutePreference } from '$lib/ui/mute-preference';

	let { initialMuted = false }: { initialMuted?: boolean } = $props();
	let locallyChanged = $state(false);
	let localMuted = $state(false);
	let muted = $derived(locallyChanged ? localMuted : initialMuted);

	function toggleMute(): void {
		localMuted = !muted;
		locallyChanged = true;
		mutePreference.set(localMuted);
		void fetch('/api/preferences/mute', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ muted: localMuted })
		}).catch(() => undefined);
	}

	onMount(() => mutePreference.set(initialMuted));
</script>

<nav class="corner-furniture" aria-label="Persistent controls">
	<a class="grown-ups-link" href="/grown-ups" target="_blank" rel="noreferrer">
		For grown-ups
		<span class="sr-only"> (opens in a new tab)</span>
	</a>
	<button
		class="mute-toggle"
		type="button"
		aria-label={muted ? 'Sound muted. Turn sound on' : 'Sound on. Mute sound'}
		aria-pressed={muted}
		onclick={toggleMute}
	>
		<span aria-hidden="true">{muted ? '🔇' : '🔊'}</span>
	</button>
</nav>

<style>
	.corner-furniture {
		position: fixed;
		top: 1.25rem;
		right: clamp(1rem, 3vw, 2.5rem);
		z-index: 60;
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.grown-ups-link {
		display: inline-flex;
		min-height: 2.65rem;
		align-items: center;
		padding: 0.55rem 1rem;
		border-radius: 999px;
		background: rgb(255 255 255 / 94%);
		box-shadow: 0 5px 0 rgb(32 23 95 / 28%), 0 10px 22px rgb(25 18 88 / 20%);
		color: var(--ink);
		font-family: var(--font-sans);
		font-size: 0.78rem;
		font-weight: 800;
		text-decoration: none;
		transition: transform 140ms var(--ease-pop), box-shadow 140ms var(--ease-pop);
	}

	.grown-ups-link:hover {
		transform: translateY(-2px);
	}

	.mute-toggle {
		display: grid;
		width: 2.65rem;
		height: 2.65rem;
		padding: 0;
		place-items: center;
		border: 0;
		border-radius: 50%;
		background: rgb(255 255 255 / 94%);
		box-shadow: 0 5px 0 rgb(32 23 95 / 28%), 0 10px 22px rgb(25 18 88 / 20%);
		cursor: pointer;
		font-size: 1.15rem;
		line-height: 1;
		transition: transform 140ms var(--ease-pop), box-shadow 140ms var(--ease-pop);
	}

	.mute-toggle:hover {
		transform: translateY(-2px);
	}

	.grown-ups-link:active,
	.mute-toggle:active {
		box-shadow: 0 1px 0 rgb(32 23 95 / 24%), 0 4px 10px rgb(25 18 88 / 14%);
		transform: translateY(4px);
	}

	.mute-toggle[aria-pressed='true'] {
		background: var(--sun);
	}

	/*
	 * These are fixed, so they pass over Night Indigo and Paper Lavender in the same
	 * scroll. A white ring inside a Night Indigo ring reads on both; the default
	 * Active Indigo ring reaches only 2.1:1 against the band.
	 */
	.grown-ups-link:focus-visible,
	.mute-toggle:focus-visible {
		outline: 3px solid #fff;
		outline-offset: 3px;
		box-shadow: 0 5px 0 rgb(32 23 95 / 28%), 0 10px 22px rgb(25 18 88 / 20%), 0 0 0 9px var(--night);
	}

	@media (max-width: 560px) {
		.corner-furniture {
			top: 0.75rem;
			right: 0.75rem;
		}

		.grown-ups-link {
			min-height: 2.75rem;
			padding-inline: 0.8rem;
			font-size: 0.72rem;
		}

		.mute-toggle { width: 2.75rem; height: 2.75rem; }
	}
</style>
