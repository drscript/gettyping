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
		top: 1.1rem;
		right: 1.1rem;
		z-index: 50;
		display: flex;
		align-items: center;
		gap: 0.7rem;
	}

	.grown-ups-link {
		color: var(--muted);
		font-family: var(--font-sans);
		font-size: 0.75rem;
		letter-spacing: 0.01em;
		text-underline-offset: 0.22rem;
		transition: color 120ms ease;
	}

	.grown-ups-link:hover {
		color: var(--ink);
	}

	.mute-toggle {
		display: grid;
		width: 2.5rem;
		height: 2.5rem;
		padding: 0;
		place-items: center;
		border: 1px solid var(--line);
		border-radius: 50%;
		background: rgb(255 255 255 / 92%);
		box-shadow: 0 0.15rem 0.7rem rgb(28 27 25 / 8%);
		cursor: pointer;
		transition:
			border-color 120ms ease,
			transform 120ms ease;
	}

	.mute-toggle:hover {
		border-color: var(--line-strong);
		transform: translateY(-1px);
	}

	.mute-toggle[aria-pressed='true'] {
		background: #eeece6;
	}

	@media (max-width: 560px) {
		.corner-furniture {
			top: 0.75rem;
			right: 0.75rem;
		}

		.grown-ups-link {
			font-size: 0.67rem;
		}
	}
</style>
