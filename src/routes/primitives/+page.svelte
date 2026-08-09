<script lang="ts">
	import { onMount } from 'svelte';
	import CharacterFeedback from '$lib/components/CharacterFeedback.svelte';
	import TaskMasthead from '$lib/components/TaskMasthead.svelte';
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
	<TaskMasthead
		back="/"
		backLabel="Back home"
		label="Shared visual primitives"
		title="One visual language, flexed per Track"
		lead="The prompt, feedback, keyboard and persistent controls keep one shape. Switch Tracks to change only the type family and scale; remove hue to inspect the independent shape and glyph feedback."
		tone={track === 'learn' ? 'learn' : 'speed'}
		keys={['F', 'J']}
	/>

	<div class="task-body">
		<section class="preview-controls" aria-label="Primitive preview controls">
			<div class="track-tabs" role="group" aria-label="Track flex">
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
	</div>
</main>

<style>
	main {
		--task-width: 58rem;

		display: flex;
		min-height: 100vh;
		flex-direction: column;
		overflow: hidden;
		background: var(--paper);
	}

	.task-body {
		position: relative;
		width: min(calc(100% - 2rem), var(--task-width));
		flex: 1;
		padding: 2.5rem 0 5rem;
		margin: 0 auto;
	}

	.task-body::before {
		position: absolute;
		z-index: 0;
		right: -18vw;
		bottom: -2.5rem;
		left: -18vw;
		height: 10rem;
		border-radius: 50%;
		background: var(--lesson-blue);
		content: '';
		opacity: 0.22;
		transform: rotate(-2deg);
	}

	.task-body > * { position: relative; z-index: 1; }

	.preview-controls {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.25rem;
		flex-wrap: wrap;
	}

	.track-tabs { display: flex; gap: 0.55rem; flex-wrap: wrap; }

	.track-tabs button {
		padding: 0.6rem 1rem;
		border: 2px solid var(--line);
		border-radius: 999px;
		background: #fff;
		color: var(--muted);
		cursor: pointer;
		font-size: 0.8rem;
		font-weight: 800;
		box-shadow: 0 4px 0 var(--pencil-line);
		transition: transform 140ms var(--ease-pop), box-shadow 140ms var(--ease-pop);
	}

	.track-tabs button:hover { transform: translateY(-2px); }
	.track-tabs button:active { box-shadow: none; transform: translateY(4px); }

	.track-tabs button[aria-pressed='true'] {
		border-color: var(--indigo);
		background: var(--indigo);
		color: #fff;
		box-shadow: 0 4px 0 var(--night);
	}

	.hue-control {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--muted);
		cursor: pointer;
		font-size: 0.78rem;
		font-weight: 700;
	}

	.hue-control input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}

	.hue-swatch {
		display: block;
		width: 2.4rem;
		height: 1.35rem;
		border: 2px solid var(--line-strong);
		border-radius: 999px;
		background: linear-gradient(90deg, var(--correct-fill), var(--incorrect-fill));
	}

	.hue-swatch::after {
		display: block;
		width: 0.85rem;
		height: 0.85rem;
		margin: 0.16rem;
		border-radius: 50%;
		background: var(--ink);
		content: '';
		transition: transform 120ms var(--ease-pop);
	}

	.hue-control input:checked + .hue-swatch { filter: grayscale(1); }
	.hue-control input:checked + .hue-swatch::after { transform: translateX(1.05rem); }

	.hue-control input:focus-visible + .hue-swatch {
		outline: 3px solid var(--indigo-active);
		outline-offset: 3px;
	}

	.preview {
		padding: clamp(1.25rem, 3.5vw, 1.85rem);
		border-radius: 1.6rem;
		background: #fff;
		box-shadow: var(--shadow-paper);
	}

	.preview-label {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding-bottom: 0.85rem;
		border-bottom: 2px solid var(--line);
		margin-bottom: 1.25rem;
		color: var(--muted);
		font: 700 0.7rem var(--font-mono);
		flex-wrap: wrap;
	}

	.preview.without-hue { filter: grayscale(1); }

	.state-key {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.85rem;
		margin-top: 1.25rem;
	}

	.state-key article {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		padding: 1rem;
		border-radius: 1.1rem;
		background: #fff;
		box-shadow: 0 5px 0 var(--pencil-line);
	}

	.state-key b,
	.state-key small { display: block; }
	.state-key b { font-family: var(--font-rounded); font-size: 0.92rem; }
	.state-key small { margin-top: 0.18rem; color: var(--muted); font-size: 0.72rem; }

	.spec-note {
		max-width: 72ch;
		padding: 1rem 1.15rem;
		border-radius: 1.1rem;
		margin: 1.25rem 0 0;
		background: var(--paper-deep);
		color: var(--muted);
		font-size: 0.8rem;
		line-height: 1.65;
	}

	@media (max-width: 680px) {
		.task-body { width: min(calc(100% - 1.5rem), var(--task-width)); }
		.task-body::before { height: 8rem; }
		.state-key { grid-template-columns: minmax(0, 1fr); }
	}
</style>
