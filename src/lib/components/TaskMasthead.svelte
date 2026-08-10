<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * The indigo room every non-typing route arrives into, closed by the same paper
	 * curve as the home landscape. Typing routes deliberately do not use this: their
	 * Attempt panel has to stay the dominant object on the screen.
	 */
	let {
		back,
		backLabel = 'Back',
		label,
		title,
		lead,
		tone = 'neutral',
		keys = ['G', 'T'],
		actions
	}: {
		back?: string;
		backLabel?: string;
		label?: string;
		title: string;
		lead?: string;
		tone?: 'neutral' | 'learn' | 'speed';
		keys?: string[];
		actions?: Snippet;
	} = $props();
</script>

<header class="masthead" data-tone={tone}>
	<div class="masthead-inner">
		{#if back}
			<a class="back-control" href={back}><span aria-hidden="true">←</span> {backLabel}</a>
		{/if}
		{#if label}<p class="masthead-label">{label}</p>{/if}
		<h1>{title}</h1>
		{#if lead}<p class="masthead-lead">{lead}</p>{/if}
		{#if actions}<div class="masthead-actions">{@render actions()}</div>{/if}
	</div>

	<div class="masthead-keys" aria-hidden="true">
		{#each keys as key}<span>{key}</span>{/each}
	</div>
</header>

<style>
	.masthead {
		position: relative;
		z-index: 1;
		overflow: hidden;
		padding: clamp(5.5rem, 12vh, 7.5rem) 0 clamp(3.5rem, 8vh, 5rem);
		background: var(--night);
		color: #fff;
	}

	/* The paper terrain rises into the room, exactly as it does on the home landscape. */
	.masthead::after {
		position: absolute;
		z-index: 0;
		right: -8vw;
		bottom: -3.5rem;
		left: -8vw;
		height: 7rem;
		border-radius: 50% 50% 0 0 / 100% 100% 0 0;
		background: var(--paper);
		content: '';
	}

	.masthead-inner {
		position: relative;
		z-index: 2;
		width: min(calc(100% - 2rem), var(--task-width, 56rem));
		margin: 0 auto;
	}

	.back-control {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.55rem 0.95rem;
		border-radius: 999px;
		margin-bottom: 1.6rem;
		background: #fff;
		color: var(--ink);
		font-size: 0.78rem;
		font-weight: 800;
		text-decoration: none;
		box-shadow: 0 5px 0 rgb(255 255 255 / 24%);
		transition: transform 140ms var(--ease-pop), box-shadow 140ms var(--ease-pop);
	}

	.back-control:hover { transform: translateY(-2px); }
	.back-control:active { box-shadow: none; transform: translateY(4px); }
	.back-control:focus-visible { outline-color: var(--sun); }

	.masthead-label {
		margin: 0 0 0.6rem;
		color: var(--sun);
		font-size: 0.72rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.masthead[data-tone='speed'] .masthead-label { color: var(--mint); }

	h1 {
		max-width: 16ch;
		margin: 0;
		font-family: var(--font-rounded);
		font-size: clamp(2.2rem, 5.5vw, 3.7rem);
		font-weight: 700;
		letter-spacing: -0.035em;
		line-height: 0.98;
		text-shadow: 0 4px 0 rgb(14 9 55 / 34%);
		text-wrap: balance;
	}

	.masthead-lead {
		max-width: 52ch;
		margin: 0.9rem 0 0;
		color: var(--on-night);
		font-size: 0.95rem;
		font-weight: 600;
		line-height: 1.55;
	}

	.masthead-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: 1.5rem;
		flex-wrap: wrap;
	}

	/*
	 * One composed cluster at the horizon rather than scattered ornament. It stays
	 * below `.masthead-inner`: furniture must never paint over a lead or an action.
	 */
	.masthead-keys {
		position: absolute;
		z-index: 1;
		right: clamp(1rem, 7vw, 7rem);
		bottom: 1.9rem;
		display: flex;
		align-items: flex-end;
		gap: 0.5rem;
		pointer-events: none;
	}

	.masthead-keys span {
		display: grid;
		width: 3.4rem;
		height: 3.4rem;
		place-items: center;
		border-radius: 0.85rem;
		background: var(--indigo-active);
		color: #fff;
		font: 700 1.25rem var(--font-rounded);
		box-shadow: inset 0 3px 0 rgb(255 255 255 / 22%), 0 6px 0 rgb(14 9 55 / 40%);
	}

	.masthead-keys span:nth-child(2n) { background: var(--sun); color: var(--night); box-shadow: inset 0 3px 0 rgb(255 255 255 / 40%), 0 6px 0 var(--sun-deep); transform: translateY(-0.6rem); }
	.masthead[data-tone='speed'] .masthead-keys span:nth-child(2n) { background: var(--mint); box-shadow: inset 0 3px 0 rgb(255 255 255 / 40%), 0 6px 0 var(--mint-deep); }

	@media (max-width: 820px) {
		.masthead-keys { display: none; }
	}

	@media (max-width: 620px) {
		.masthead { padding-top: 5rem; }
		.masthead-inner { width: min(calc(100% - 1.5rem), var(--task-width, 56rem)); }
	}
</style>
