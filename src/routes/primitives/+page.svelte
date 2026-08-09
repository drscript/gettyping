<script lang="ts">
	import { onMount } from 'svelte';
	import CharacterFeedback from '$lib/components/CharacterFeedback.svelte';
	import TypingSurface from '$lib/components/TypingSurface.svelte';
	import type { TrackFlex } from '$lib/ui/types';

	let track: TrackFlex = $state('learn');
	let withoutHue = $state(false);

	onMount(() => {
		const parameters = new URLSearchParams(window.location.search);
		if (parameters.get('track') === 'speed') track = 'speed-test-practice';
		withoutHue = parameters.has('without-hue');
	});
</script>

<svelte:head>
	<title>Shared visual primitives · GetTyping</title>
	<meta
		name="description"
		content="The shared character feedback, keyboard and Track typography primitives for GetTyping."
	/>
</svelte:head>

<main>
	<header>
		<p class="ticket-label">Shared visual primitives · 19</p>
		<h1>One visual language, flexed per Track</h1>
		<p class="sub">
			The prompt, feedback, keyboard and persistent controls keep one shape. Switch Tracks to
			change only the type family and scale; remove hue to inspect the independent shape and glyph
			feedback.
		</p>
	</header>

	<section class="preview-controls" aria-label="Primitive preview controls">
		<div class="track-tabs" aria-label="Track flex">
			<button
				type="button"
				aria-pressed={track === 'learn'}
				onclick={() => (track = 'learn')}>Learn</button
			>
			<button
				type="button"
				aria-pressed={track === 'speed-test-practice'}
				onclick={() => (track = 'speed-test-practice')}>Speed Test &amp; Practice</button
			>
		</div>

		<label class="hue-control">
			<input type="checkbox" bind:checked={withoutHue} />
			<span aria-hidden="true" class="hue-swatch"></span>
			<span>Remove hue</span>
		</label>
	</section>

	<section class="preview" class:without-hue={withoutHue} aria-label="Track primitive showcase">
		<div class="preview-label" aria-live="polite">
			<span>{track === 'learn' ? 'Learn flex' : 'Speed Test & Practice flex'}</span>
			<span>same component tree</span>
		</div>
		<TypingSurface {track} />
	</section>

	<section class="state-key" aria-label="Feedback state key">
		<article>
			<CharacterFeedback character="f" state="correct" />
			<div><b>Correct</b><small>filled pill + check glyph</small></div>
		</article>
		<article>
			<CharacterFeedback character="r" state="incorrect" />
			<div><b>Incorrect</b><small>dashed outline + cross glyph</small></div>
		</article>
	</section>

	<p class="spec-note">
		The speaker and “For grown-ups” controls are layout furniture, so they remain reachable on this
		mid-Attempt view and every later screen. The grown-ups route opens separately; using either
		control leaves the Attempt in place.
	</p>
</main>

<style>
	main {
		width: min(calc(100% - 2rem), 58.75rem);
		margin: 0 auto;
		padding: 5rem 0 7rem;
	}

	header {
		max-width: 42rem;
	}

	.ticket-label {
		margin: 0 0 0.65rem;
		color: var(--muted);
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.07em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0 0 0.4rem;
		font-family: var(--font-sans);
		font-size: 1.625rem;
		line-height: 1.2;
	}

	.sub {
		max-width: 62ch;
		margin: 0 0 1.65rem;
		color: var(--muted);
		font-size: 0.875rem;
		line-height: 1.55;
	}

	.preview-controls {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	.track-tabs {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.track-tabs button {
		padding: 0.4rem 0.8rem;
		border: 1px solid var(--line);
		border-radius: 999px;
		background: var(--card);
		color: var(--muted);
		font-size: 0.78rem;
		cursor: pointer;
	}

	.track-tabs button[aria-pressed='true'] {
		border-color: var(--ink);
		background: var(--ink);
		color: #fff;
	}

	.hue-control {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		color: var(--muted);
		font-size: 0.76rem;
		cursor: pointer;
	}

	.hue-control input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}

	.hue-swatch {
		display: block;
		width: 2rem;
		height: 1.1rem;
		border: 1px solid var(--line-strong);
		border-radius: 999px;
		background: linear-gradient(90deg, var(--correct-fill), var(--incorrect-fill));
	}

	.hue-swatch::after {
		display: block;
		width: 0.72rem;
		height: 0.72rem;
		margin: 0.13rem;
		border-radius: 50%;
		background: var(--ink);
		content: '';
		transition: transform 120ms ease;
	}

	.hue-control input:checked + .hue-swatch {
		filter: grayscale(1);
	}

	.hue-control input:checked + .hue-swatch::after {
		transform: translateX(0.9rem);
	}

	.hue-control input:focus-visible + .hue-swatch {
		outline: 3px solid rgb(230 201 77 / 55%);
		outline-offset: 3px;
	}

	.preview-label {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.6rem;
		color: var(--muted);
		font-family: var(--font-mono);
		font-size: 0.68rem;
	}

	.preview.without-hue {
		filter: grayscale(1);
	}

	.state-key {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
		margin-top: 2.25rem;
	}

	.state-key article {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.8rem;
		border: 1px solid var(--line);
		border-radius: 0.625rem;
		background: var(--card);
		font-family: var(--font-sans);
	}

	.state-key b,
	.state-key small {
		display: block;
	}

	.state-key b {
		font-size: 0.78rem;
	}

	.state-key small {
		margin-top: 0.16rem;
		color: var(--muted);
		font-size: 0.68rem;
	}

	.spec-note {
		max-width: 76ch;
		margin: 2rem 0 0;
		padding-top: 0.8rem;
		border-top: 1px dashed var(--line);
		color: #77736c;
		font-family: var(--font-mono);
		font-size: 0.72rem;
		line-height: 1.6;
	}

	@media (max-width: 680px) {
		main {
			width: min(calc(100% - 1.25rem), 58.75rem);
		}

		.state-key {
			grid-template-columns: 1fr;
		}
	}
</style>
