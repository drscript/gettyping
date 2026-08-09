<svelte:head>
	<title>For grown-ups · GetTyping</title>
	<meta
		name="description"
		content="How GetTyping handles Player identity, browser-local progress and public Nicknames."
	/>
</svelte:head>

<main>
	<a class="back-link" href="/">← Back to GetTyping</a>
	<h1>For grown-ups</h1>
	<p class="intro">
		The short version of how GetTyping works, what it keeps, and what your child can share.
	</p>

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
				There is no way to recover progress. Clearing this browser's cookies, moving to another
				browser, or changing device starts a new Player. Previous Scores can remain on Leaderboards,
				but they cannot be reclaimed.
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
</main>

<style>
	main {
		width: min(calc(100% - 2rem), 43rem);
		margin: 0 auto;
		padding: 5.5rem 0 6rem;
		font-family: var(--font-sans);
	}

	.back-link {
		display: inline-block;
		margin-bottom: 2.5rem;
		color: var(--muted);
		font-size: 0.78rem;
		text-underline-offset: 0.22rem;
	}

	h1 {
		margin: 0;
		font-size: clamp(1.8rem, 5vw, 2.35rem);
		line-height: 1.15;
	}

	.intro {
		max-width: 55ch;
		margin: 0.55rem 0 2.5rem;
		color: var(--muted);
		font-size: 0.9rem;
		line-height: 1.6;
	}

	.prose {
		max-width: 62ch;
		color: #3a3833;
		font-size: 0.9rem;
		line-height: 1.7;
	}

	section + section {
		margin-top: 2rem;
	}

	h2 {
		margin: 0 0 0.4rem;
		color: var(--ink);
		font-size: 1rem;
	}

	p {
		margin: 0;
	}

	.warning {
		padding: 0.85rem 1rem;
		border: 1px solid #ece0b0;
		border-radius: 0.65rem;
		background: #fffbe9;
	}

	@media (max-width: 560px) {
		main {
			width: min(calc(100% - 1.25rem), 43rem);
			padding-top: 5rem;
		}
	}
</style>
