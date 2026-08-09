<script lang="ts">
	import CuratedNicknameCards from '$lib/components/CuratedNicknameCards.svelte';

	let { data } = $props();

	let showTypedNickname = $state(false);
	let candidateOffset = $state(0);
	let isLearn = $derived(data.track === 'learn');
	let candidates = $derived([
		...data.candidates.slice(candidateOffset),
		...data.candidates.slice(0, candidateOffset)
	]);

	function shuffleCandidates() {
		candidateOffset = (candidateOffset + 6) % data.candidates.length;
	}
</script>

<svelte:head>
	<title>{isLearn ? 'Pick a Nickname' : 'Choose a Nickname'} · GetTyping</title>
</svelte:head>

<main class:learn={isLearn}>
	<a class="back-link" href="/" aria-label="Back to Track choice">← Back</a>

	<header>
		<p class="eyebrow">{isLearn ? 'Learn' : 'Speed Test & Practice'}</p>
		<h1>{isLearn ? 'Pick a Nickname' : 'Choose a Nickname'}</h1>
		<p>
			{isLearn
				? 'Tap one you like. There is nothing to type before you start learning.'
				: 'This is the Nickname people will see when you complete the Speed Test.'}
		</p>
	</header>

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
				<button class="secondary-button" type="button" onclick={shuffleCandidates}>↻ Different ones</button>
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
</main>

<style>
	main {
		width: min(calc(100% - 2rem), 46rem);
		margin: 0 auto;
		padding: 5.5rem 0 5rem;
	}

	main.learn {
		font-family: var(--font-rounded);
	}

	.back-link {
		display: inline-block;
		margin-bottom: 2.5rem;
		color: var(--muted);
		font-family: var(--font-sans);
		font-size: 0.8rem;
		text-underline-offset: 0.22rem;
	}

	header {
		max-width: 39rem;
		margin-bottom: 1.7rem;
	}

	.eyebrow {
		margin: 0 0 0.55rem;
		color: var(--muted);
		font-family: var(--font-mono);
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0;
		font-size: clamp(2rem, 7vw, 3rem);
		line-height: 1.05;
	}

	header > p:last-child {
		margin: 0.65rem 0 0;
		color: var(--muted);
		font-family: var(--font-sans);
		font-size: 0.92rem;
		line-height: 1.55;
	}

	.unavailable-notice {
		margin: 0 0 1.4rem;
		padding: 1rem;
		border: 1px solid #ece0b0;
		border-radius: 0.8rem;
		background: #fffbe9;
	}

	.unavailable-notice h2 {
		margin: 0;
		font-family: var(--font-sans);
		font-size: 1rem;
	}

	.unavailable-notice > p {
		margin: 0.3rem 0 0.85rem;
		color: var(--muted);
		font-family: var(--font-sans);
		font-size: 0.8rem;
	}

	.row-actions {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		margin-top: 1.1rem;
		flex-wrap: wrap;
	}

	.secondary-button,
	.primary-button,
	.text-button {
		border-radius: 999px;
		cursor: pointer;
	}

	.secondary-button,
	.primary-button {
		padding: 0.65rem 1.05rem;
	}

	.secondary-button {
		border: 1px solid var(--line);
		background: var(--card);
	}

	.primary-button {
		border: 1px solid var(--ink);
		background: var(--ink);
		color: #fff;
		font-weight: 700;
	}

	.text-button {
		padding: 0.45rem;
		border: 0;
		background: transparent;
		color: var(--muted);
		font-size: 0.8rem;
		text-decoration: underline;
		text-underline-offset: 0.22rem;
	}

	.typed-form {
		max-width: 34rem;
	}

	.typed-form label {
		display: block;
		margin-bottom: 0.45rem;
		font-family: var(--font-sans);
		font-size: 0.78rem;
		font-weight: 700;
	}

	.typed-form input[type='text'] {
		width: 100%;
		padding: 0.85rem 1rem;
		border: 1px solid var(--line-strong);
		border-radius: 0.7rem;
		background: var(--card);
		color: var(--ink);
		font: 1.05rem var(--font-sans);
	}

	.typed-form input[type='text']:focus {
		border-color: var(--focus-line);
		outline: 3px solid rgb(230 201 77 / 24%);
	}

	.public-warning {
		margin: 0.55rem 0 0;
		color: var(--muted);
		font-family: var(--font-sans);
		font-size: 0.75rem;
		line-height: 1.5;
	}

	@media (max-width: 620px) {
		main {
			width: min(calc(100% - 1.25rem), 46rem);
		}

	}
</style>
