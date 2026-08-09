<svelte:head>
	<title>Learn complete · GetTyping</title>
	<meta name="description" content="You completed all 21 Learn Stages." />
</svelte:head>

<main>
	<section class="completion-card">
		<p class="eyebrow">All 21 Stages cleared</p>
		<h1>You learned the whole keyboard ✓</h1>
		<p>Every Stage stays open whenever you want to replay it.</p>
		<div class="actions">
			<a class="primary" href="/speed-test">Take the Speed Test →</a>
			<a href="/">See all Stages</a>
		</div>
	</section>
</main>

<style>
	main { width: min(calc(100% - 2rem), 52rem); margin: 0 auto; padding: clamp(6.5rem, 14vh, 9rem) 0 5rem; font-family: var(--font-rounded); }
	.completion-card { padding: clamp(1.5rem, 6vw, 3rem); border: 1px solid var(--correct-line); border-radius: 1.2rem; background: var(--card); }
	.eyebrow { margin: 0 0 0.6rem; color: var(--muted); font: 700 0.72rem var(--font-sans); letter-spacing: 0.08em; text-transform: uppercase; }
	h1 { max-width: 12ch; margin: 0; font-size: clamp(2.2rem, 7vw, 4.4rem); line-height: 0.98; }
	p { color: var(--muted); }
	.actions { display: flex; align-items: center; gap: 1rem; margin-top: 1.8rem; flex-wrap: wrap; }
	.actions a { font-family: var(--font-sans); font-size: 0.84rem; }
	.primary { padding: 0.8rem 1.25rem; border-radius: 999px; background: var(--ink); color: white; font-weight: 700; text-decoration: none; }
</style>
