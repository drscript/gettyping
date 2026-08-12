<script lang="ts">
	import TaskMasthead from '$lib/components/TaskMasthead.svelte';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>For grown-ups · GetTyping</title>
	<meta
		name="description"
		content="How GetTyping handles Player identity, browser-local progress and public Nicknames."
	/>
</svelte:head>

<main>
	<TaskMasthead
		back="/"
		backLabel="Back to GetTyping"
		title="For grown-ups"
		lead="The short version of how GetTyping works, what it keeps, and what your child can share."
		keys={['?', '!']}
	/>

	<div class="task-body">
		{#if data.currentStage}
			<section class="override-card">
				<h2>Help past a stuck Stage</h2>
				<p>
					If the Player is genuinely stuck, you can count Stage {data.currentStage.id} as resolved.
					The 90% standard does not change, and no qualifying Score will be invented.
				</p>
				<form method="POST" action="?/resolve-stage">
					<input type="hidden" name="stageId" value={data.currentStage.id} />
					<button type="submit">Resolve Stage {data.currentStage.id}</button>
				</form>
				{#if form?.message}<p class="form-message" role="alert">{form.message}</p>{/if}
			</section>
		{/if}

		<div class="prose">
			<section>
				<h2>There's no account</h2>
				<p>
					GetTyping asks for no email address, password, or date of birth. It stores no personal
					information beyond the public Nickname a Player chooses. A Player is not an account.
				</p>
			</section>

			<section>
				<h2>Progress lives in this browser</h2>
				<p class="warning">
					Clearing this browser's cookies, moving to another browser, or changing device normally
					starts a brand new Player. To bring an existing Player along, generate a short transfer
					code from <a href="/players">/players</a> and type it in on the new device — that links the
					same Player, with their Scores, Stage unlocks, and Weak-key Profile intact. It's a
					deliberate, one-time action, not automatic syncing, and it still asks for no account,
					password, or personal information.
				</p>
			</section>

			<section>
				<h2>Nicknames are public</h2>
				<p>
					A chosen Nickname appears beside Scores on public Leaderboards. That is why the app asks
					Players not to use a real name and gives Learn Players a curated list to choose from.
				</p>
			</section>
		</div>
	</div>
</main>

<style>
	main {
		--task-width: 44rem;

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
		right: -22vw;
		bottom: -2.5rem;
		left: -22vw;
		height: 10rem;
		border-radius: 50%;
		background: var(--lesson-blue);
		content: '';
		opacity: 0.22;
		transform: rotate(-2deg);
	}

	.task-body > * { position: relative; z-index: 1; }

	/* The one action a grown-up can take sits above the reading, clearly separated. */
	.override-card {
		padding: clamp(1.25rem, 3.5vw, 1.75rem);
		border-radius: 1.5rem;
		margin-bottom: 2rem;
		background: var(--indigo);
		color: #fff;
		box-shadow: var(--shadow-paper);
	}

	.override-card h2 { margin: 0; color: #fff; }
	.override-card p { max-width: 56ch; margin: 0.6rem 0 0; color: var(--on-night); }

	.override-card form { margin-top: 1.3rem; }

	.override-card button {
		padding: 0.78rem 1.2rem;
		border: 0;
		border-radius: 999px;
		background: var(--sun);
		color: var(--ink);
		cursor: pointer;
		font-weight: 800;
		box-shadow: 0 5px 0 var(--sun-deep);
		transition: transform 140ms var(--ease-pop), box-shadow 140ms var(--ease-pop);
	}

	.override-card button:hover { transform: translateY(-2px); }
	.override-card button:active { box-shadow: none; transform: translateY(4px); }
	.override-card button:focus-visible { outline-color: #fff; }

	.form-message {
		margin: 0.9rem 0 0;
		color: var(--sun);
		font-size: 0.86rem;
		font-weight: 700;
	}

	/* Read surface: one column, generous measure, quiet rhythm. */
	.prose {
		padding: clamp(1.5rem, 4vw, 2.25rem);
		border-radius: 1.6rem;
		background: #fff;
		box-shadow: var(--shadow-paper);
	}

	h2 {
		margin: 0 0 0.5rem;
		color: var(--ink);
		font-family: var(--font-rounded);
		font-size: 1.35rem;
		letter-spacing: -0.02em;
	}

	p {
		max-width: 62ch;
		margin: 0;
		color: var(--muted);
		font-size: 0.98rem;
		line-height: 1.7;
	}

	section + section {
		padding-top: 1.75rem;
		border-top: 2px solid var(--line);
		margin-top: 1.75rem;
	}

	.warning {
		max-width: none;
		padding: 1rem 1.15rem;
		border: 2px solid var(--sun-deep);
		border-radius: 1rem;
		background: var(--highlight);
		color: var(--ink);
	}

	@media (max-width: 560px) {
		.task-body { width: min(calc(100% - 1.5rem), var(--task-width)); }
		.task-body::before { height: 8rem; }
	}
</style>
