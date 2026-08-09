<script lang="ts">
	import TaskMasthead from '$lib/components/TaskMasthead.svelte';
</script>

<svelte:head>
	<title>Learn complete · GetTyping</title>
	<meta name="description" content="You completed all 21 Learn Stages." />
</svelte:head>

<main>
	<TaskMasthead
		back="/"
		backLabel="Back home"
		label="All 21 Stages cleared"
		title="You learned the whole keyboard ✓"
		lead="Every Stage stays open whenever you want to replay it."
		tone="learn"
		keys={['2', '1']}
	/>

	<div class="task-body">
		<section class="next-step" aria-labelledby="next-step-heading">
			<div class="next-copy">
				<h2 id="next-step-heading">Where to next</h2>
				<p>
					The Speed Test measures where your typing is now and builds the Weak-key Profile that
					Practice draws from.
				</p>
				<div class="actions">
					<a class="primary" href="/speed-test">Take the Speed Test →</a>
					<a class="secondary" href="/">See all Stages</a>
				</div>
			</div>

			<ol class="keyboard-rows" aria-label="The rows you covered">
				<li><span>Home row</span><b aria-hidden="true">ASDF JKL;</b></li>
				<li><span>Top row</span><b aria-hidden="true">QWERTY UIOP</b></li>
				<li><span>Bottom row</span><b aria-hidden="true">ZXCVBNM</b></li>
				<li><span>Shift, punctuation, numbers</span><b aria-hidden="true">?! 1234567890</b></li>
			</ol>
		</section>
	</div>
</main>

<style>
	main {
		--task-width: 56rem;

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
		background: var(--sun);
		content: '';
		opacity: 0.34;
		transform: rotate(-2deg);
	}

	.next-step {
		position: relative;
		z-index: 1;
		display: grid;
		grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
		align-items: center;
		gap: clamp(1.5rem, 4vw, 3rem);
		padding: clamp(1.5rem, 4vw, 2.5rem);
		border-radius: 1.75rem;
		background: #fff;
		box-shadow: var(--shadow-paper);
	}

	h2 {
		margin: 0;
		font-family: var(--font-rounded);
		font-size: clamp(1.5rem, 3vw, 2.1rem);
		letter-spacing: -0.025em;
		line-height: 1.05;
	}

	.next-copy p {
		max-width: 42ch;
		margin: 0.8rem 0 0;
		color: var(--muted);
		font-size: 0.92rem;
		line-height: 1.6;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		margin-top: 1.6rem;
		flex-wrap: wrap;
	}

	.primary,
	.secondary {
		display: inline-flex;
		align-items: center;
		padding: 0.78rem 1.2rem;
		border-radius: 999px;
		font-weight: 800;
		text-decoration: none;
		transition: transform 140ms var(--ease-pop), box-shadow 140ms var(--ease-pop);
	}

	.primary { background: var(--mint); color: var(--ink); box-shadow: 0 5px 0 var(--mint-deep); }
	.secondary { background: #fff; color: var(--ink); box-shadow: 0 5px 0 var(--line-strong); }
	.primary:hover,
	.secondary:hover { transform: translateY(-2px); }
	.primary:active,
	.secondary:active { box-shadow: none; transform: translateY(4px); }

	/* The keyboard the Player just covered, as raised rows rather than a stat block. */
	.keyboard-rows {
		display: grid;
		gap: 0.55rem;
		padding: 0;
		margin: 0;
		list-style: none;
	}

	.keyboard-rows li {
		display: grid;
		gap: 0.3rem;
		padding: 0.8rem 0.95rem;
		border-radius: 1rem;
		background: var(--paper-deep);
		box-shadow: 0 5px 0 var(--pencil-line);
	}

	.keyboard-rows li:nth-child(1) { background: var(--mint); box-shadow: 0 5px 0 var(--mint-deep); }
	.keyboard-rows li:nth-child(2) { background: var(--sun); box-shadow: 0 5px 0 var(--sun-deep); }

	.keyboard-rows span {
		color: var(--night);
		font-size: 0.66rem;
		font-weight: 800;
		letter-spacing: 0.07em;
		text-transform: uppercase;
	}

	.keyboard-rows li:nth-child(n + 3) span { color: var(--muted); }

	.keyboard-rows b {
		color: var(--ink);
		font: 700 0.95rem var(--font-mono);
		letter-spacing: 0.04em;
	}

	@media (max-width: 760px) {
		.next-step { grid-template-columns: minmax(0, 1fr); }
	}

	@media (max-width: 620px) {
		.task-body { width: min(calc(100% - 1.5rem), var(--task-width)); }
		.task-body::before { height: 8rem; }
	}
</style>
