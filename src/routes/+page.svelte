<!--
THESIS: GetTyping is a school desk expanded into a world; it refuses the category's neutral card-grid home screen.
OWN-WORLD: Deep indigo room, flowing periwinkle paper, original soft 3D school objects, arched Track doors, raised key controls, Fredoka display type, and Nunito body copy.
STORY: A Player sees the two Tracks as tangible paths, chooses one immediately, then understands how staged learning and diagnostic practice continue below.
FIRST VIEWPORT: Wordmark and question sit in the upper-left of an illustrated keyboard-desk landscape; two large semantic doors rise from the lower-middle; utilities remain top-right.
FORM: Learning Landscape, the user-approved first composition; full-bleed illustrated staging with a curved second-fold handoff. Direction was user-pinned, so no seed roll was used.
-->
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

{#snippet lockGlyph()}
	<svg class="lock-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
		<path d="M8 10V7.5a4 4 0 0 1 8 0V10" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
		<rect x="5" y="10" width="14" height="10" rx="2.6" fill="currentColor" />
	</svg>
{/snippet}

{#if data.player}
	<main class="home-shell returning-home">
		<section class="learning-landscape returning-landscape">
			<div class="desk-art" aria-hidden="true"></div>
			<a class="brand-mark" href="/" aria-label="GetTyping home">Get<span>Typing</span></a>

			<header class="welcome-copy">
				<p class="home-greeting">Welcome back</p>
				<h1 class="player-name">{data.player.nickname}</h1>
				<p>Your next activity is ready on the desk.</p>
			</header>

			<div class="desk-props" aria-hidden="true">
				<span class="prop-key">A</span>
				<span class="prop-star">★</span>
			</div>

			<div class="continue-dock">
				<a class="track-door learn continue-door" href={data.continueHref}>
					<span class="door-medallion" aria-hidden="true">⌨</span>
					<span class="door-copy">
						<strong>Carry on typing</strong>
						<small>Your next activity is one tap away</small>
					</span>
					<span class="continue-cta">Continue<span aria-hidden="true"> →</span></span>
					<span class="door-knob" aria-hidden="true"></span>
				</a>
			</div>
		</section>

		<section class="returning-room" aria-labelledby="stage-path-heading">
			<div class="stage-path">
			<div class="stage-heading">
				<h2 id="stage-path-heading">Your 21 Stages</h2>
				<p>Cleared Stages stay open for replay.</p>
			</div>
			<ol class="stage-grid">
				{#each data.stages ?? [] as stage}
					<li data-stage-state={stage.state}>
						{#if stage.state === 'locked'}
							<span class="stage-token locked" role="img" aria-label={`Stage ${stage.id}, ${stage.name}, locked`}>
								<strong>{stage.id}</strong>
								{@render lockGlyph()}
							</span>
						{:else}
							<a class="stage-token" class:cleared={stage.state === 'cleared'} class:current={stage.state === 'current'} href={`/learn/stages/${stage.id}`} aria-label={`Stage ${stage.id}, ${stage.name}, ${stage.state === 'cleared' ? 'cleared, replay' : 'current'}`}>
								<strong>{stage.id}</strong>
								{#if stage.state === 'cleared'}
									<span class="token-mark" aria-hidden="true">✓</span>
								{:else}
									<span class="token-next" aria-hidden="true">Next</span>
								{/if}
							</a>
						{/if}
					</li>
				{/each}
			</ol>
			</div>

			<nav class="home-secondary" aria-label="Player options">
				<a href="/history">Your history</a>
				<a href="/players">Not you?</a>
			</nav>
		</section>

		<footer class="welcome-close">
			<div class="close-inner">
				<div>
					<p class="close-mark">Get<span>Typing</span></p>
					<p class="close-note">Progress lives in this browser. There are no accounts to make.</p>
				</div>
				<a class="close-link" href="/grown-ups">For grown-ups</a>
			</div>
			<div class="close-keys" aria-hidden="true"><span>G</span><span>E</span><span>T</span></div>
		</footer>
	</main>
{:else}
	<main class="welcome-shell">
		<section class="learning-landscape">
			<div class="desk-art" aria-hidden="true"></div>
			<a class="brand-mark" href="/" aria-label="GetTyping home">Get<span>Typing</span></a>

			<header class="welcome-copy">
				<h1>What would you like to do?</h1>
				<p>Choose your path. We’ll help you build a typing rhythm that feels natural.</p>
			</header>

			<div class="desk-props" aria-hidden="true">
				<span class="prop-key">A</span>
				<span class="prop-star">★</span>
			</div>

			<nav class="track-doors" aria-label="Choose a typing Track">
				<a class="track-door learn" href="/nickname?track=learn">
					<span class="door-medallion" aria-hidden="true">⌨</span>
					<span class="door-copy">
						<strong>I want to learn to type</strong>
						<small>Start with Stage 1</small>
					</span>
					<span class="door-arrow" aria-hidden="true">→</span>
					<span class="door-knob" aria-hidden="true"></span>
				</a>

				<a class="track-door speed" href="/nickname?track=speed-test-practice">
					<span class="door-medallion" aria-hidden="true">⚡</span>
					<span class="door-copy">
						<strong>I want to get faster</strong>
						<small>Begin with a Speed Test</small>
					</span>
					<span class="door-arrow" aria-hidden="true">→</span>
					<span class="door-knob" aria-hidden="true"></span>
				</a>
			</nav>
		</section>

		<section class="track-bands" aria-label="What each Track includes">
			<div class="band-inner">
				<div class="band-learn">
					<p class="scene-label">Learn</p>
					<h2>21 Stages, one clear step at a time</h2>
					<p>Begin with the first keys. Clear each Stage to open the next.</p>
					<a class="preview-action learn-action" href="/nickname?track=learn">Start learning</a>
				</div>

				<ol class="stage-trail" aria-label="How the Learn path begins and ends">
					{#each (data.previewStages ?? []).filter((stage) => stage.id !== 21) as stage}
						<li class="trail-stage">
							<span class="trail-badge">{stage.id}</span>
							<strong>{stage.name}</strong>
						</li>
					{/each}
					<li class="trail-gap">
						<span aria-hidden="true">🔒</span>
						<b aria-hidden="true">4–20</b>
						<span class="sr-only">Stages 4 to 20 open as you clear the Stage before them</span>
					</li>
					{#each (data.previewStages ?? []).filter((stage) => stage.id === 21) as stage}
						<li class="trail-stage trail-final">
							<span class="trail-badge">{stage.id}</span>
							<strong>{stage.name}</strong>
							<em>Final Stage</em>
						</li>
					{/each}
				</ol>

				<div class="band-speed">
					<div class="speed-object" aria-hidden="true">
						<span class="dial-hand"></span>
						<span class="dial-center"></span>
					</div>
					<p class="scene-label">Speed Test &amp; Practice</p>
					<h2>Find the keys that slow you down</h2>
					<p>Measure WPM and accuracy, then practise the keys in your Weak-key Profile.</p>
					<a class="preview-action speed-action" href="/nickname?track=speed-test-practice">Take a Speed Test</a>
				</div>
			</div>
		</section>

		<footer class="welcome-close">
			<div class="close-inner">
				<div>
					<p class="close-mark">Get<span>Typing</span></p>
					<p class="close-note">Progress lives in this browser. There are no accounts to make.</p>
				</div>
				<a class="close-link" href="/grown-ups">For grown-ups</a>
			</div>
			<div class="close-keys" aria-hidden="true"><span>G</span><span>E</span><span>T</span></div>
		</footer>
	</main>
{/if}

<style>
	.welcome-shell {
		display: flex;
		min-height: 100vh;
		flex-direction: column;
		overflow: hidden;
		background: var(--night);
	}

	/*
	 * The landscape is one grid: the question owns the left, the two Track doors
	 * stand on the terrain at the right. Grid columns keep them from ever colliding,
	 * which absolute placement could not guarantee at short viewport heights.
	 */
	.learning-landscape {
		position: relative;
		z-index: 1;
		display: grid;
		min-height: min(56rem, max(100svh, 40rem));
		align-items: start;
		overflow: hidden;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
		column-gap: clamp(1rem, 3vw, 3rem);
		padding: clamp(7rem, 15vh, 10rem) clamp(1.25rem, 6vw, 6.5rem) clamp(2.5rem, 5vh, 4rem);
		background: var(--night);
		color: #fff;
		isolation: isolate;
	}

	.learning-landscape::after {
		position: absolute;
		z-index: -1;
		right: -8vw;
		bottom: -6.5rem;
		left: -8vw;
		height: 18rem;
		border-radius: 48% 52% 0 0 / 24% 28% 0 0;
		background: var(--lesson-blue);
		content: '';
		transform: rotate(-1.5deg);
	}

	.brand-mark {
		position: absolute;
		z-index: 5;
		top: 1.7rem;
		left: clamp(1.25rem, 4vw, 4rem);
		color: #fff;
		font-family: var(--font-rounded);
		font-size: clamp(1.65rem, 3vw, 2.45rem);
		font-weight: 700;
		letter-spacing: -0.035em;
		line-height: 1;
		text-decoration: none;
		text-shadow: 0 3px 0 rgb(24 16 86 / 28%);
	}

	.brand-mark span {
		color: var(--sun);
	}

	/* Anything focusable on a saturated field takes a white ring: the default
	   Active Indigo ring only reaches 2.1:1 against Night Indigo. */
	.brand-mark:focus-visible,
	.band-learn .preview-action:focus-visible,
	.band-speed .preview-action:focus-visible {
		outline-color: #fff;
		outline-offset: 4px;
	}

	.welcome-copy {
		position: relative;
		z-index: 4;
		grid-column: 1;
		grid-row: 1;
	}

	.welcome-copy h1 {
		max-width: 10ch;
		margin: 0;
		font-family: var(--font-rounded);
		font-size: clamp(2.9rem, 6.4vw, 5.4rem);
		font-weight: 700;
		letter-spacing: -0.035em;
		line-height: 0.94;
		text-shadow: 0 5px 0 rgb(24 16 86 / 32%);
		text-wrap: balance;
	}

	.welcome-copy p {
		max-width: 31ch;
		margin: 1.25rem 0 0;
		color: var(--on-night);
		font-size: clamp(1rem, 1.5vw, 1.14rem);
		font-weight: 600;
		line-height: 1.55;
	}

	.desk-art {
		position: absolute;
		z-index: -2;
		inset: 0;
		/* The scrim has to carry the copy column to 4.5:1 over the artwork, not just tint it. */
		background-image: linear-gradient(90deg, rgb(33 24 95 / 88%) 0%, rgb(33 24 95 / 62%) 38%, rgb(33 24 95 / 16%) 64%, transparent 80%), url('/assets/gettyping/hero-desk-desktop.webp');
		background-position: center;
		background-size: cover;
		animation: scene-settle 900ms var(--ease-pop) both;
	}

	@keyframes scene-settle {
		from { filter: blur(4px) saturate(0.88); transform: scale(1.015); }
		to { filter: blur(0) saturate(1); transform: scale(1); }
	}

	/* One composed prop cluster resting on the terrain, never scattered ornament. */
	.desk-props {
		z-index: 2;
		display: flex;
		align-items: flex-end;
		align-self: end;
		grid-column: 1;
		grid-row: 1;
		gap: 0.55rem;
		padding-bottom: 2rem;
	}

	.prop-key,
	.prop-star {
		display: grid;
		place-items: center;
		box-shadow: var(--shadow-key);
	}

	.prop-key {
		width: 4.4rem;
		height: 4.4rem;
		border-radius: 1.05rem;
		background: var(--sun);
		color: var(--night);
		font: 700 1.7rem var(--font-rounded);
		transform: rotate(-12deg);
	}

	.prop-star {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		background: var(--mint);
		color: var(--night);
		font-size: 1.05rem;
		transform: translateY(-0.35rem) rotate(8deg);
	}

	/* Two freestanding doors planted on the terrain, deliberately far apart. */
	.track-doors {
		z-index: 4;
		display: flex;
		align-items: flex-end;
		align-self: end;
		justify-content: space-between;
		grid-column: 2;
		grid-row: 1;
		gap: clamp(0.9rem, 3vw, 3.5rem);
	}

	.track-door {
		position: relative;
		display: grid;
		width: clamp(10.5rem, 21vw, 15rem);
		min-height: clamp(14.5rem, 30vh, 17.5rem);
		padding: 1.2rem 1rem 1.4rem;
		align-content: start;
		place-items: center;
		border: 0.42rem solid #fff;
		border-radius: 7.5rem 7.5rem 1.7rem 1.7rem;
		color: var(--night);
		text-align: center;
		text-decoration: none;
		box-shadow: inset 0 5px 0 rgb(255 255 255 / 38%), 0 10px 0 rgb(18 13 66 / 40%), 0 24px 36px rgb(20 13 75 / 28%);
		transition: transform 150ms var(--ease-pop), box-shadow 150ms var(--ease-pop);
	}

	/* The paper pad each door stands on, so it reads as planted rather than pasted. */
	.track-door::after {
		position: absolute;
		z-index: -1;
		bottom: -1.35rem;
		left: 50%;
		width: 124%;
		height: 2.1rem;
		border-radius: 50%;
		background: rgb(226 232 255 / 34%);
		content: '';
		filter: blur(6px);
		transform: translateX(-50%);
	}

	.track-door.learn { background: var(--sun); margin-bottom: clamp(1rem, 4vh, 3rem); }
	.track-door.speed { background: var(--coral); }

	.door-knob {
		position: absolute;
		right: 0.75rem;
		bottom: 3.4rem;
		width: 0.85rem;
		height: 0.85rem;
		border-radius: 50%;
		background: var(--indigo-active);
		box-shadow: inset 0 -2px 0 rgb(16 10 62 / 40%);
	}

	.track-door:hover {
		transform: translateY(-8px) rotate(-1deg);
	}

	.track-door.speed:hover {
		transform: translateY(-8px) rotate(1deg);
	}

	.track-door:active {
		box-shadow: inset 0 5px 0 rgb(255 255 255 / 30%), 0 2px 0 rgb(18 13 66 / 36%), 0 10px 18px rgb(20 13 75 / 20%);
		transform: translateY(8px);
	}

	/*
	 * The doors stand on pale periwinkle terrain, where a white ring alone reaches
	 * only 2.3:1. A Night Indigo outer ring makes the pair read on any ground.
	 */
	.track-door:focus-visible {
		outline: 3px solid #fff;
		outline-offset: 3px;
		box-shadow: inset 0 5px 0 rgb(255 255 255 / 38%), 0 10px 0 rgb(18 13 66 / 40%), 0 24px 36px rgb(20 13 75 / 28%), 0 0 0 9px var(--night);
	}

	.door-medallion {
		display: grid;
		width: clamp(3.4rem, 7vw, 4.4rem);
		height: clamp(3.4rem, 7vw, 4.4rem);
		margin-bottom: 0.75rem;
		place-items: center;
		border-radius: 50%;
		background: #fff;
		font-size: clamp(1.5rem, 3vw, 1.95rem);
		box-shadow: var(--shadow-key);
	}

	.door-copy strong {
		display: block;
		max-width: 13ch;
		margin-inline: auto;
		font-family: var(--font-rounded);
		font-size: clamp(1.1rem, 1.8vw, 1.6rem);
		letter-spacing: -0.02em;
		line-height: 1.05;
		text-wrap: balance;
	}

	.door-copy small {
		display: block;
		margin-top: 0.6rem;
		font-size: 0.72rem;
		font-weight: 800;
	}

	.door-arrow {
		display: grid;
		width: 2.9rem;
		height: 2.9rem;
		margin-top: 0.8rem;
		place-items: center;
		border-radius: 50%;
		background: #fff;
		font-size: 1.4rem;
		box-shadow: var(--shadow-key);
	}

	/*
	 * The second fold stays inside the landscape: the same indigo field carries the
	 * Learn trail and the Speed panel, so the page never becomes a card grid on grey.
	 */
	.track-bands {
		position: relative;
		z-index: 2;
		display: flex;
		flex: 1;
		flex-direction: column;
		justify-content: center;
		padding: clamp(3.5rem, 8vh, 6rem) 0 clamp(3.5rem, 7vh, 5.5rem);
		background: var(--indigo);
		color: #fff;
	}

	/* The indigo room rises back through the paper terrain: one landscape, two folds. */
	.track-bands::before {
		position: absolute;
		z-index: -1;
		top: -4.5rem;
		right: -8vw;
		left: -8vw;
		height: 7rem;
		border-radius: 50% 50% 0 0 / 100% 100% 0 0;
		background: var(--indigo);
		content: '';
	}

	.band-inner {
		display: grid;
		width: min(calc(100% - 2rem), 76rem);
		align-items: center;
		grid-template-columns: minmax(10rem, 0.7fr) minmax(0, 2.1fr) minmax(12.5rem, 0.85fr);
		gap: clamp(1.25rem, 2.5vw, 2.25rem);
		margin: 0 auto;
	}

	.band-learn h2,
	.band-speed h2,
	.stage-heading h2 {
		margin: 0;
		font-family: var(--font-rounded);
		font-size: clamp(1.5rem, 2.4vw, 2.15rem);
		letter-spacing: -0.025em;
		line-height: 1.05;
		text-wrap: balance;
	}

	.band-learn > p:not(.scene-label),
	.band-speed > p:not(.scene-label) {
		max-width: 34ch;
		margin: 0.75rem 0 0;
		color: var(--on-night);
		font-size: 0.92rem;
		line-height: 1.55;
	}

	.band-speed {
		position: relative;
		padding-left: clamp(1.5rem, 3vw, 2.75rem);
	}

	.band-speed::before {
		position: absolute;
		top: 0.25rem;
		bottom: 0.25rem;
		left: 0;
		width: 2px;
		border-radius: 999px;
		background: rgb(255 255 255 / 22%);
		content: '';
	}

	.scene-label {
		margin: 0 0 0.55rem;
		color: var(--sun);
		font-size: 0.72rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.preview-action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.78rem 1.25rem;
		border-radius: 999px;
		margin-top: 1.35rem;
		font-weight: 800;
		text-decoration: none;
		transition: transform 140ms var(--ease-pop), box-shadow 140ms var(--ease-pop);
	}

	.learn-action {
		background: var(--sun);
		box-shadow: 0 5px 0 var(--sun-deep);
	}

	.speed-action {
		background: var(--mint);
		color: var(--night);
		box-shadow: 0 5px 0 var(--mint-deep);
	}

	.preview-action:hover { transform: translateY(-2px); }
	.preview-action:active { transform: translateY(4px); box-shadow: none; }

	/* Real Stage tokens on a paper trail — the sequence itself is the information. */
	.stage-trail {
		position: relative;
		display: flex;
		align-items: flex-end;
		gap: 0.55rem;
		padding: 1.6rem 0 0.5rem;
		margin: 0;
		list-style: none;
	}

	.stage-trail::before {
		position: absolute;
		right: 1.5rem;
		bottom: 2.1rem;
		left: 1.5rem;
		height: 0.55rem;
		border-radius: 999px;
		background: rgb(255 255 255 / 14%);
		content: '';
	}

	.trail-stage {
		position: relative;
		display: grid;
		flex: 1 1 0;
		min-width: 0;
		padding: 1.5rem 0.6rem 0.95rem;
		gap: 0.3rem;
		border-radius: 1.1rem;
		background: #fff;
		color: var(--ink);
		text-align: center;
		box-shadow: 0 6px 0 rgb(16 10 62 / 34%), 0 16px 26px rgb(16 10 62 / 26%);
	}

	.trail-badge {
		position: absolute;
		top: -1.1rem;
		left: 50%;
		display: grid;
		width: 2.3rem;
		height: 2.3rem;
		place-items: center;
		border-radius: 50%;
		background: var(--sun);
		color: var(--night);
		font: 700 0.95rem var(--font-rounded);
		box-shadow: 0 4px 0 var(--sun-deep);
		transform: translateX(-50%);
	}

	.trail-stage strong {
		font-family: var(--font-rounded);
		font-size: 0.85rem;
		line-height: 1.15;
		text-wrap: balance;
	}

	.trail-final {
		padding-top: 1.7rem;
		border-radius: 3rem 3rem 1.1rem 1.1rem;
		background: var(--mint);
	}

	.trail-final .trail-badge { background: var(--indigo-active); color: #fff; box-shadow: 0 4px 0 var(--night); }
	.trail-final em { color: var(--night); font-size: 0.66rem; font-style: normal; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; }

	/* The locked span is a marker on the trail, not a Stage: narrow, quiet, unpressable. */
	.trail-gap {
		display: grid;
		flex: 0 0 auto;
		align-self: center;
		gap: 0.25rem;
		padding: 0.7rem 0.55rem;
		place-items: center;
		border-radius: 999px;
		background: rgb(255 255 255 / 12%);
		color: var(--on-night);
		font-size: 0.75rem;
		line-height: 1;
	}

	.trail-gap b { font: 800 0.7rem var(--font-mono); letter-spacing: 0.02em; }

	.speed-object {
		position: relative;
		width: 7.5rem;
		height: 7.5rem;
		margin-bottom: 1.25rem;
		border: 0.8rem solid #fff;
		border-radius: 50%;
		background: conic-gradient(var(--coral) 0 24%, var(--sun) 24% 48%, var(--mint) 48% 72%, var(--lesson-blue) 72%);
		box-shadow: 0 9px 0 rgb(25 18 88 / 38%), 0 18px 30px rgb(25 18 88 / 30%);
	}

	.speed-object::before {
		position: absolute;
		inset: 0.9rem;
		border-radius: 50%;
		background: #fff;
		content: '';
	}

	.dial-hand {
		position: absolute;
		z-index: 1;
		top: 49%;
		left: 50%;
		width: 2.35rem;
		height: 0.4rem;
		border-radius: 999px;
		background: var(--night);
		transform: rotate(-38deg);
		transform-origin: 0 50%;
	}

	.dial-center {
		position: absolute;
		z-index: 2;
		top: 50%;
		left: 50%;
		width: 1rem;
		height: 1rem;
		border-radius: 50%;
		background: var(--night);
		transform: translate(-50%, -50%);
	}

	/*
	 * The close stays its own height. On a viewport taller than the page it is the
	 * indigo room above that absorbs the slack, not a growing band of empty night.
	 */
	.welcome-close {
		position: relative;
		z-index: 3;
		overflow: hidden;
		padding: 4rem 0 3.5rem;
		background: var(--night);
		color: #fff;
	}

	.welcome-close::before {
		position: absolute;
		top: -4rem;
		right: -8vw;
		left: -8vw;
		height: 8rem;
		border-radius: 50% 50% 0 0 / 100% 100% 0 0;
		background: var(--night);
		content: '';
	}

	.close-inner {
		position: relative;
		z-index: 1;
		display: flex;
		width: min(calc(100% - 2rem), 76rem);
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
		margin: 0 auto;
	}

	.close-mark {
		margin: 0;
		font-family: var(--font-rounded);
		font-size: 1.5rem;
		font-weight: 700;
		letter-spacing: -0.03em;
	}

	.close-mark span {
		color: var(--sun);
	}

	.close-note {
		max-width: 34ch;
		margin: 0.4rem 0 0;
		color: var(--on-night);
		font-size: 0.86rem;
		line-height: 1.5;
	}

	.close-link {
		padding: 0.7rem 1.1rem;
		border-radius: 999px;
		background: #fff;
		color: var(--ink);
		font-size: 0.8rem;
		font-weight: 800;
		text-decoration: none;
		box-shadow: 0 5px 0 rgb(255 255 255 / 26%);
		transition: transform 140ms var(--ease-pop), box-shadow 140ms var(--ease-pop);
		white-space: nowrap;
	}

	.close-link:hover { transform: translateY(-2px); }
	.close-link:active { box-shadow: none; transform: translateY(4px); }
	.close-link:focus-visible { outline-color: var(--sun); }

	/* A single cluster of keycaps resting at the horizon. */
	.close-keys {
		position: absolute;
		right: clamp(1rem, 6vw, 6rem);
		bottom: 1.4rem;
		display: flex;
		align-items: flex-end;
		gap: 0.5rem;
	}

	.close-keys span {
		display: grid;
		width: 3.1rem;
		height: 3.1rem;
		place-items: center;
		border-radius: 0.8rem;
		background: var(--indigo-active);
		color: #fff;
		font: 700 1.15rem var(--font-rounded);
		box-shadow: inset 0 3px 0 rgb(255 255 255 / 22%);
	}

	.close-keys span:nth-child(2) { background: var(--sun); color: var(--night); transform: translateY(-0.5rem); }

	/* Returning Player: the same landscape, with one door instead of two. */
	.returning-home {
		display: flex;
		min-height: 100vh;
		flex-direction: column;
		overflow: hidden;
		background: var(--night);
	}

	.returning-landscape {
		min-height: min(44rem, max(80svh, 34rem));
		grid-template-columns: minmax(0, 1fr) minmax(0, 0.9fr);
	}

	.home-greeting {
		margin: 0 0 0.35rem;
		color: var(--sun);
		font-size: 0.95rem;
		font-weight: 800;
	}

	.player-name {
		max-width: 11ch;
		margin: 0;
		font-family: var(--font-rounded);
		font-size: clamp(2.6rem, 6.4vw, 5rem);
		font-weight: 700;
		letter-spacing: -0.035em;
		line-height: 0.94;
		overflow-wrap: anywhere;
		text-shadow: 0 5px 0 rgb(24 16 86 / 32%);
	}

	.continue-dock {
		z-index: 4;
		display: flex;
		align-self: end;
		justify-content: flex-end;
		grid-column: 2;
		grid-row: 1;
	}

	.continue-door {
		width: clamp(12rem, 24vw, 16.5rem);
	}

	.continue-door .door-copy small { max-width: 16ch; margin-inline: auto; line-height: 1.3; }

	.continue-cta {
		display: inline-flex;
		align-items: center;
		padding: 0.6rem 1.05rem;
		border-radius: 999px;
		margin-top: 1rem;
		background: #fff;
		color: var(--ink);
		font-size: 0.82rem;
		font-weight: 800;
		box-shadow: var(--shadow-key);
	}

	.home-secondary {
		display: flex;
		width: min(calc(100% - 2rem), 68rem);
		gap: 0.7rem;
		margin: 1.5rem auto 0;
		flex-wrap: wrap;
	}

	.home-secondary a {
		padding: 0.68rem 1rem;
		border-radius: 999px;
		background: #fff;
		color: var(--ink);
		font-size: 0.82rem;
		font-weight: 800;
		text-decoration: none;
		box-shadow: 0 5px 0 var(--pencil-line);
		transition: transform 140ms var(--ease-pop), box-shadow 140ms var(--ease-pop);
	}

	.home-secondary a:hover { transform: translateY(-2px); }
	.home-secondary a:active { box-shadow: none; transform: translateY(4px); }

	/* These pills sit on Playground Indigo, where the Active Indigo ring is 1.47:1. */
	.home-secondary a:focus-visible {
		outline-color: #fff;
		outline-offset: 4px;
	}

	/*
	 * The returning home stays inside the landscape too: the Stage path is paper laid
	 * over the same indigo room, not a card stranded on flat lavender.
	 */
	.returning-room {
		position: relative;
		z-index: 2;
		display: flex;
		flex: 1;
		flex-direction: column;
		justify-content: center;
		padding: clamp(3.5rem, 8vh, 5.5rem) 0 clamp(3rem, 6vh, 4.5rem);
		background: var(--indigo);
	}

	.returning-room::before {
		position: absolute;
		z-index: -1;
		top: -4.5rem;
		right: -8vw;
		left: -8vw;
		height: 7rem;
		border-radius: 50% 50% 0 0 / 100% 100% 0 0;
		background: var(--indigo);
		content: '';
	}

	.stage-path {
		position: relative;
		width: min(calc(100% - 2rem), 68rem);
		padding: clamp(1.5rem, 4vw, 2.25rem);
		margin: 0 auto;
		border-radius: 1.75rem;
		background: #fff;
		box-shadow: var(--shadow-paper);
	}

	.stage-heading {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.75rem;
	}

	.stage-heading h2,
	.stage-heading p { margin: 0; }
	.stage-heading > p { color: var(--muted); font-size: 0.82rem; }

	/*
	 * Stages are physical tokens on a paper trail. The dashed connector runs behind
	 * the row and is clipped at the panel edge, so a wrapped path still reads as one.
	 */
	.stage-grid {
		display: grid;
		overflow: hidden;
		grid-template-columns: repeat(auto-fill, minmax(4.6rem, 1fr));
		gap: 1.5rem 0.5rem;
		/* Bottom padding clears the current token's scale, its Next pill, and its focus
		   ring; `overflow: hidden` is only here to clip the trail at the panel edge. */
		padding: 0.35rem 0 1.75rem;
		margin: 0;
		list-style: none;
	}

	.stage-grid li {
		position: relative;
		display: grid;
		place-items: center;
	}

	.stage-grid li::before {
		position: absolute;
		top: 2.05rem;
		right: -1rem;
		left: 50%;
		height: 0.32rem;
		border-radius: 999px;
		background: repeating-linear-gradient(90deg, var(--pencil-line) 0 0.35rem, transparent 0.35rem 0.75rem);
		content: '';
	}

	.stage-grid li:last-child::before { display: none; }

	.stage-token {
		position: relative;
		z-index: 1;
		display: grid;
		width: 4.15rem;
		height: 4.15rem;
		place-items: center;
		border-radius: 50%;
		background: var(--paper-deep);
		color: var(--muted);
		text-decoration: none;
		box-shadow: 0 5px 0 var(--pencil-line);
		transition: transform 140ms var(--ease-pop), box-shadow 140ms var(--ease-pop);
	}

	.stage-token strong { font: 700 1.4rem var(--font-rounded); }

	a.stage-token:hover { transform: translateY(-3px); }
	a.stage-token:active { box-shadow: none; transform: translateY(5px); }

	.stage-token.cleared {
		background: var(--mint);
		color: var(--night);
		box-shadow: 0 5px 0 var(--mint-deep);
	}

	.stage-token.current {
		background: var(--sun);
		color: var(--night);
		box-shadow: 0 6px 0 var(--sun-deep);
		transform: scale(1.14);
	}

	.stage-token.current:hover { transform: scale(1.14) translateY(-3px); }
	.stage-token.current:active { box-shadow: none; transform: scale(1.14) translateY(4px); }

	.token-mark {
		position: absolute;
		right: -0.15rem;
		bottom: -0.15rem;
		display: grid;
		width: 1.5rem;
		height: 1.5rem;
		place-items: center;
		border: 2px solid #fff;
		border-radius: 50%;
		background: var(--mint-deep);
		color: #fff;
		font-size: 0.7rem;
		font-weight: 800;
	}

	.token-next {
		position: absolute;
		bottom: -1.1rem;
		padding: 0.15rem 0.45rem;
		border-radius: 999px;
		background: var(--night);
		color: #fff;
		font-size: 0.58rem;
		font-weight: 800;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.stage-token.locked { color: var(--muted); }
	.lock-glyph { position: absolute; right: 0.35rem; bottom: 0.3rem; width: 0.95rem; height: 0.95rem; }

	@media (max-width: 1040px) {
		.desk-art { background-position: 62% center; opacity: 0.82; }
		.band-inner { grid-template-columns: minmax(0, 1fr) minmax(14rem, 0.85fr); }
		.band-learn { grid-column: 1; }
		.stage-trail { grid-column: 1; grid-row: 2; }
		.band-speed { grid-column: 2; grid-row: 1 / span 2; align-self: start; }
	}

	/* Below the stacking point the scene becomes a vertical reading order. */
	@media (max-width: 720px) {
		.learning-landscape {
			min-height: 0;
			grid-template-columns: minmax(0, 1fr);
			padding: 6.5rem 1.25rem 3rem;
			row-gap: 20rem;
		}
		.learning-landscape::after { bottom: -3rem; height: 22rem; }
		.brand-mark { top: 1.25rem; }
		.welcome-copy h1 { max-width: 9ch; font-size: clamp(2.8rem, 13vw, 4.4rem); }
		.welcome-copy p { max-width: 30ch; }
		.desk-art {
			/* The art must start below the copy block even when the question wraps to
			   four lines, so the lead never sits on the illustration. */
			inset: clamp(20rem, 34vh, 22rem) 0 14rem;
			background-image: linear-gradient(180deg, rgb(33 24 95 / 88%) 0%, rgb(33 24 95 / 55%) 22%, transparent 55%), url('/assets/gettyping/hero-desk-mobile.webp');
			background-position: center;
			background-size: cover;
			opacity: 0.72;
		}
		.desk-props { display: none; }
		.track-doors { grid-column: 1; grid-row: 2; gap: 0.8rem; }
		.track-door { width: auto; min-height: 15rem; flex: 1 1 0; padding-inline: 0.65rem; border-width: 0.32rem; }
		.track-door.learn { margin-bottom: 0; }
		.track-door::after { display: none; }
		.door-copy strong { font-size: 1.2rem; }
		.door-copy small { min-height: 2.2em; }
		.door-knob { display: none; }
		.band-inner { width: min(calc(100% - 1.5rem), 76rem); grid-template-columns: minmax(0, 1fr); gap: 2rem; }
		.band-learn,
		.stage-trail,
		.band-speed { grid-column: 1; grid-row: auto; }
		.stage-trail { overflow-x: auto; padding: 1.6rem 0.25rem 0.75rem; }
		.stage-trail::before { display: none; }
		.trail-stage { flex: 0 0 8.5rem; }
		.trail-gap { flex: 0 0 8.5rem; align-self: stretch; }
		.band-speed { padding-top: 1.75rem; padding-left: 0; }
		.band-speed::before { top: 0; right: 0; bottom: auto; left: 0; width: auto; height: 2px; }
		.welcome-close { padding: 3.5rem 0 6rem; }
		.close-inner { align-items: flex-start; flex-direction: column; }
		.close-keys { right: 1rem; bottom: 1.4rem; }
		.close-keys span { width: 2.6rem; height: 2.6rem; }
		.returning-landscape { row-gap: 16rem; }
		.continue-dock { grid-column: 1; grid-row: 2; justify-content: stretch; }
		.continue-door { width: 100%; }
		.returning-room { padding-top: 3rem; }
		.stage-path { width: min(calc(100% - 1.25rem), 68rem); padding: 1.25rem; }
		.stage-heading { align-items: start; flex-direction: column; gap: 0.4rem; }
		.home-secondary { width: min(calc(100% - 1.25rem), 68rem); }
	}

	@media (max-width: 430px) {
		.learning-landscape { row-gap: 17rem; }
		.desk-art { inset: clamp(22rem, 32vh, 23rem) 0 13rem; }
		.track-door { min-height: 13.5rem; border-radius: 5rem 5rem 1.3rem 1.3rem; }
		.door-medallion { width: 3.4rem; height: 3.4rem; font-size: 1.45rem; }
		.door-copy strong { font-size: 1.02rem; }
		.door-arrow { width: 2.6rem; height: 2.6rem; }
	}
</style>
