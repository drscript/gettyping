<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>{data.player ? `Welcome back, ${data.player.nickname}` : 'Choose your path'} · GetTyping</title>
	<meta
		name="description"
		content="Learn to type from the beginning or improve your speed with targeted practice."
	/>
</svelte:head>

{#if data.player}
	<main class="home-shell">
		<p class="home-greeting">Welcome back</p>
		<h1 class="player-name">{data.player.nickname}</h1>
		<section class="continue-card">
			<div>
				<p class="eyebrow">Ready when you are</p>
				<h2>Carry on typing</h2>
				<p>Your next activity is one tap away.</p>
			</div>
			<a class="continue-button" href={data.continueHref}>Continue</a>
		</section>

		<section class="stage-path" aria-labelledby="stage-path-heading">
			<div class="stage-heading">
				<div>
					<p class="eyebrow">Learn path</p>
					<h2 id="stage-path-heading">Your 21 Stages</h2>
				</div>
				<p>Cleared Stages stay open for replay.</p>
			</div>
			<ol class="stage-grid">
				{#each data.stages ?? [] as stage}
					<li data-stage-state={stage.state}>
						{#if stage.state === 'locked'}
							<span class="stage-tile locked" aria-label={`Stage ${stage.id}, ${stage.name}, locked`}>
								<span class="stage-icon" aria-hidden="true">◆</span>
								<strong>{stage.id}</strong>
								<small>Locked</small>
							</span>
						{:else}
							<a class:cleared={stage.state === 'cleared'} class:current={stage.state === 'current'} href={`/learn/stages/${stage.id}`} aria-label={`Stage ${stage.id}, ${stage.name}, ${stage.state === 'cleared' ? 'cleared, replay' : 'current'}`}>
								<span class="stage-icon" aria-hidden="true">{stage.state === 'cleared' ? '✓' : '●'}</span>
								<strong>{stage.id}</strong>
								<small>{stage.state === 'cleared' ? 'Replay' : 'Next'}</small>
							</a>
						{/if}
					</li>
				{/each}
			</ol>
		</section>
	</main>
{:else}
	<main class="welcome-shell">
		<header>
			<p class="eyebrow">GetTyping</p>
			<h1>What would you like to do?</h1>
			<p class="intro">Choose what you want to work on. You can change direction later.</p>
		</header>

		<div class="track-doors">
		<a class="track-door learn" href="/nickname?track=learn">
			<span class="door-glyph" aria-hidden="true">🌱</span>
			<span class="door-copy">
				<strong>I want to learn to type</strong>
				<small>Start at the beginning and work through it one step at a time.</small>
			</span>
			<span class="door-arrow" aria-hidden="true">→</span>
		</a>

		<a class="track-door speed" href="/nickname?track=speed-test-practice">
			<span class="door-glyph" aria-hidden="true">⚡</span>
			<span class="door-copy">
				<strong>I want to get faster</strong>
				<small>Take a Speed Test, then practise the keys that slow you down.</small>
			</span>
			<span class="door-arrow" aria-hidden="true">→</span>
		</a>
		</div>
	</main>
{/if}

<style>
	.welcome-shell {
		width: min(calc(100% - 2rem), 56rem);
		margin: 0 auto;
		padding: clamp(6.5rem, 14vh, 9rem) 0 5rem;
	}

	.home-shell {
		width: min(calc(100% - 2rem), 48rem);
		margin: 0 auto;
		padding: clamp(6.5rem, 14vh, 9rem) 0 5rem;
	}

	.home-greeting {
		margin: 0 0 0.2rem;
		color: var(--muted);
		font-size: 0.9rem;
	}

	.player-name {
		margin: 0 0 1.5rem;
		font-family: var(--font-rounded);
		font-size: clamp(2.2rem, 6vw, 3.25rem);
		line-height: 1;
	}

	.continue-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
		padding: 1.5rem;
		border: 1px solid var(--line);
		border-radius: 1rem;
		background: var(--card);
		box-shadow: 0 1px 3px rgb(0 0 0 / 5%);
	}

	.stage-path {
		margin-top: 2.4rem;
	}

	.stage-heading {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.stage-heading h2,
	.stage-heading p {
		margin: 0;
	}

	.stage-heading > p {
		color: var(--muted);
		font-size: 0.76rem;
	}

	.stage-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(5.25rem, 1fr));
		gap: 0.65rem;
		padding: 0;
		margin: 0;
		list-style: none;
	}

	.stage-tile,
	.stage-grid a {
		display: grid;
		min-height: 6.2rem;
		place-items: center;
		align-content: center;
		gap: 0.15rem;
		border: 1px solid var(--line);
		border-radius: 1rem;
		background: var(--card);
		text-decoration: none;
	}

	.stage-grid a.cleared {
		border-radius: 1rem 1rem 1rem 0.35rem;
		border-color: var(--correct-line);
		background: var(--correct-fill);
	}

	.stage-grid a.current {
		border-width: 2px;
		border-color: var(--focus-line);
		border-radius: 50%;
		background: var(--focus);
	}

	.stage-tile.locked {
		border-style: dashed;
		color: var(--muted);
		clip-path: polygon(12% 0, 88% 0, 100% 50%, 88% 100%, 12% 100%, 0 50%);
	}

	.stage-icon {
		font-size: 1rem;
	}

	.stage-grid strong {
		font-family: var(--font-rounded);
		font-size: 1.25rem;
	}

	.stage-grid small {
		font-size: 0.66rem;
		text-transform: uppercase;
	}

	.continue-card h2 {
		margin: 0;
		font-size: 1.2rem;
	}

	.continue-card p:last-child {
		margin: 0.35rem 0 0;
		color: var(--muted);
		font-size: 0.82rem;
	}

	.continue-button {
		padding: 0.72rem 1.2rem;
		border: 1px solid var(--ink);
		border-radius: 999px;
		background: var(--ink);
		color: #fff;
		font-weight: 700;
		text-decoration: none;
	}

	header {
		max-width: 39rem;
		margin-bottom: 2rem;
	}

	.eyebrow {
		margin: 0 0 0.65rem;
		color: var(--muted);
		font-family: var(--font-mono);
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0;
		font-family: var(--font-rounded);
		font-size: clamp(2rem, 5vw, 3.25rem);
		line-height: 1.05;
	}

	.intro {
		margin: 0.8rem 0 0;
		color: var(--muted);
		font-size: 1rem;
		line-height: 1.55;
	}

	.track-doors {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
	}

	.track-door {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 1rem;
		min-height: 10.5rem;
		padding: 1.4rem;
		border: 1px solid var(--line);
		border-radius: 1rem;
		background: var(--card);
		box-shadow: 0 1px 3px rgb(0 0 0 / 5%);
		text-decoration: none;
		transition:
			border-color 140ms ease,
			box-shadow 140ms ease,
			transform 140ms ease;
	}

	.track-door:hover {
		border-color: var(--line-strong);
		box-shadow: 0 0.5rem 1.5rem rgb(28 27 25 / 8%);
		transform: translateY(-2px);
	}

	.track-door.learn:hover {
		border-color: var(--correct-line);
	}

	.track-door.speed:hover {
		border-color: var(--focus-line);
	}

	.door-glyph {
		display: grid;
		width: 3.6rem;
		height: 3.6rem;
		place-items: center;
		border: 1px solid var(--line);
		border-radius: 0.9rem;
		background: var(--paper);
		font-size: 1.65rem;
	}

	.door-copy strong,
	.door-copy small {
		display: block;
	}

	.door-copy strong {
		font-size: 1.15rem;
		line-height: 1.25;
	}

	.door-copy small {
		margin-top: 0.4rem;
		color: var(--muted);
		font-size: 0.82rem;
		line-height: 1.45;
	}

	.door-arrow {
		color: var(--muted);
		font-size: 1.35rem;
	}

	@media (max-width: 680px) {
		.welcome-shell,
		.home-shell {
			width: min(calc(100% - 1.25rem), 56rem);
			padding-top: 6rem;
		}

		.track-doors {
			grid-template-columns: 1fr;
		}

		.track-door {
			min-height: 8.75rem;
		}

		.continue-card {
			align-items: stretch;
			flex-direction: column;
		}

		.continue-button {
			text-align: center;
		}

		.stage-heading {
			align-items: start;
			flex-direction: column;
		}
	}
</style>
