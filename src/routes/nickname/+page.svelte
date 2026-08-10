<script lang="ts">
	import CuratedNicknameCards from '$lib/components/CuratedNicknameCards.svelte';
	import TaskMasthead from '$lib/components/TaskMasthead.svelte';

	let { data } = $props();

	let showTypedNickname = $state(false);
	let candidateOffset = $state(0);
	let isLearn = $derived(data.track === 'learn');
	let candidates = $derived([
		...data.candidates.slice(candidateOffset),
		...data.candidates.slice(0, candidateOffset)
	]);

	let canShuffle = $derived(data.candidates.length > 6);

	function shuffleCandidates() {
		if (data.candidates.length === 0) return;
		candidateOffset = (candidateOffset + 6) % data.candidates.length;
	}
</script>

<svelte:head>
	<title>{isLearn ? 'Pick a Nickname' : 'Choose a Nickname'} · GetTyping</title>
</svelte:head>

<main class:learn={isLearn}>
	<TaskMasthead
		back="/"
		backLabel="Back"
		label={isLearn ? 'Learn' : 'Speed Test & Practice'}
		title={isLearn ? 'Pick a Nickname' : 'Choose a Nickname'}
		lead={isLearn
			? 'Tap one you like. There is nothing to type before you start learning.'
			: 'This is the Nickname people will see when you complete the Speed Test.'}
		tone={isLearn ? 'learn' : 'speed'}
		keys={isLearn ? ['A', 'B', 'C'] : ['W', 'P', 'M']}
	/>

	<div class="task-body">
		{#if data.nicknameUnavailable}
			<section class="unavailable-notice" aria-live="polite">
				<h2>Let's use a different Nickname</h2>
				<p>Choose one of these, or try another of your own.</p>
				<CuratedNicknameCards candidates={candidates.slice(0, 3)} track={data.track} compact />
			</section>
		{/if}

		{#if isLearn && !showTypedNickname}
			<section aria-label="Curated Nicknames">
				<CuratedNicknameCards candidates={candidates.slice(0, 6)} track={data.track} />

				<div class="row-actions">
					{#if canShuffle}
						<button class="secondary-button" type="button" onclick={shuffleCandidates}>↻ Different ones</button>
					{/if}
					<button class="text-button" type="button" onclick={() => (showTypedNickname = true)}>
						Type your own instead
					</button>
				</div>
			</section>
		{:else}
			<form class="typed-form" method="POST" action="?/create">
				<input type="hidden" name="track" value={data.track} />
				<input type="hidden" name="source" value="typed" />

				<label for="nickname">Nickname</label>
				<input
					id="nickname"
					name="nickname"
					type="text"
					autocomplete="off"
					maxlength="24"
					required
					placeholder="your nickname"
				/>
				<p class="public-warning">
					Your Nickname is public on Leaderboards, so pick something that isn't your real name.
				</p>

				<div class="row-actions">
					<button class="primary-button" type="submit">Start</button>
					{#if isLearn}
						<button class="text-button" type="button" onclick={() => (showTypedNickname = false)}>
							Pick one instead
						</button>
					{/if}
				</div>
			</form>
		{/if}
	</div>
</main>

<style>
	main {
		--task-width: 50rem;

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

	/* A low Track-coloured dune closes the page instead of leaving flat paper. */
	.task-body::before {
		position: absolute;
		z-index: 0;
		right: -18vw;
		bottom: -2.5rem;
		left: -18vw;
		height: 10rem;
		border-radius: 50%;
		background: var(--mint);
		content: '';
		opacity: 0.28;
		transform: rotate(-2deg);
	}

	main.learn .task-body::before { background: var(--sun); opacity: 0.34; }

	.task-body > * { position: relative; z-index: 1; }

	.unavailable-notice {
		margin: 0 0 1.6rem;
		padding: 1.15rem;
		border: 2px solid var(--incorrect-line);
		border-radius: 1.35rem;
		background: var(--incorrect-fill);
		box-shadow: 0 6px 0 var(--coral-deep);
	}

	.unavailable-notice h2 {
		margin: 0;
		font-family: var(--font-rounded);
		font-size: 1.15rem;
	}

	.unavailable-notice > p {
		margin: 0.3rem 0 0.95rem;
		color: var(--incorrect-ink);
		font-size: 0.82rem;
	}

	.row-actions {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		margin-top: 1.4rem;
		flex-wrap: wrap;
	}

	.secondary-button,
	.primary-button,
	.text-button {
		border: 0;
		border-radius: 999px;
		cursor: pointer;
		font-weight: 800;
		transition: transform 140ms var(--ease-pop), box-shadow 140ms var(--ease-pop);
	}

	.secondary-button,
	.primary-button {
		padding: 0.7rem 1.15rem;
	}

	.secondary-button {
		background: #fff;
		color: var(--ink);
		box-shadow: 0 5px 0 var(--line-strong);
	}

	/* Learn leads with Sunshine; Speed Test & Practice stays on the cooler mint. */
	.primary-button {
		background: var(--mint);
		color: var(--ink);
		box-shadow: 0 5px 0 var(--mint-deep);
	}

	main.learn .primary-button {
		background: var(--sun);
		box-shadow: 0 5px 0 var(--sun-deep);
	}

	.secondary-button:hover,
	.primary-button:hover { transform: translateY(-2px); }
	.secondary-button:active,
	.primary-button:active { box-shadow: none; transform: translateY(4px); }

	.text-button {
		display: inline-flex;
		min-height: 2.75rem;
		align-items: center;
		padding: 0.5rem 0.75rem;
		background: transparent;
		color: var(--muted);
		font-size: 0.8rem;
		text-decoration: underline;
		text-underline-offset: 0.22rem;
	}

	.typed-form {
		max-width: 34rem;
		padding: clamp(1.4rem, 4vw, 2rem);
		border-radius: 1.5rem;
		background: #fff;
		box-shadow: var(--shadow-card);
	}

	.typed-form label {
		display: block;
		margin-bottom: 0.45rem;
		font-size: 0.78rem;
		font-weight: 800;
	}

	.typed-form input[type='text'] {
		width: 100%;
		padding: 0.9rem 1rem;
		border: 2px solid var(--line-strong);
		border-radius: 1rem;
		background: var(--card);
		color: var(--ink);
		font: 600 1.05rem var(--font-sans);
	}

	.typed-form input[type='text']::placeholder { color: var(--muted); }

	/* `:focus-visible`, not `:focus` — a scoped `:focus` rule outranks the global ring. */
	.typed-form input[type='text']:focus-visible {
		border-color: var(--indigo-active);
		outline: 3px solid var(--indigo-active);
		outline-offset: 3px;
		box-shadow: 0 5px 0 var(--line-strong);
	}

	.public-warning {
		margin: 0.6rem 0 0;
		color: var(--muted);
		font-size: 0.78rem;
		line-height: 1.5;
	}

	@media (max-width: 620px) {
		.task-body { width: min(calc(100% - 1.5rem), var(--task-width)); }
		.task-body::before { height: 8rem; }
	}
</style>
