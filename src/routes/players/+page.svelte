<script lang="ts">
	let { data, form } = $props();
</script>

<svelte:head>
	<title>Choose a Player · GetTyping</title>
	<meta name="description" content="Switch the active Player or add another Player on this device." />
</svelte:head>

<main>
	<a class="back-link" href="/">← Back home</a>
	<header>
		<p class="eyebrow">This device</p>
		<h1>Who is typing?</h1>
		<p>Each Player keeps their own Stages, Scores, and Weak-key Profile.</p>
	</header>

	<section class="player-list" aria-label="Players on this device">
		{#each data.players as player}
			<form method="POST" action="?/switch">
				<input type="hidden" name="playerId" value={player.id} />
				<button type="submit" class:active={player.id === data.activePlayerId}>
					<strong>{player.nickname}</strong>
					<span>{player.id === data.activePlayerId ? 'Typing now' : 'Switch to this Player'}</span>
				</button>
			</form>
		{/each}
	</section>

	{#if form?.message}<p class="form-message" role="alert">{form.message}</p>{/if}

	<section class="add-player">
		<h2>Add another Player</h2>
		<p>Choose what they want to work on, then they can pick their Nickname.</p>
		<div>
			<a href="/nickname?track=learn">Learn to type</a>
			<a href="/nickname?track=speed-test-practice">Get faster</a>
		</div>
	</section>

	<section class="rename-player">
		<h2>Change your Nickname</h2>
		<p>Earlier Scores keep the Nickname you used when you set them.</p>
		{#if data.nicknameUnavailable}
			<p class="rename-notice" role="alert">Let's use a different Nickname.</p>
		{:else if data.nicknameRenamed}
			<p class="rename-notice success" aria-live="polite">Your new Nickname is ready.</p>
		{/if}
		<form class="typed-rename" method="POST" action="?/rename">
			<input type="hidden" name="source" value="typed" />
			<label for="rename-nickname">Type a new Nickname</label>
			<div>
				<input id="rename-nickname" name="nickname" maxlength="24" autocomplete="off" required />
				<button type="submit">Save</button>
			</div>
			<small>Use a public Nickname that is not your real name.</small>
		</form>
		<div class="curated-renames" aria-label="Curated Nicknames">
			{#each data.candidates as candidate}
				<form method="POST" action="?/rename">
					<input type="hidden" name="source" value="curated" />
					<button type="submit" name="nickname" value={candidate.nickname}>
						<span aria-hidden="true">{candidate.icon}</span>
						{candidate.nickname}
					</button>
				</form>
			{/each}
		</div>
	</section>
</main>

<style>
	main { width: min(calc(100% - 2rem), 42rem); margin: 0 auto; padding: 5.5rem 0 5rem; }
	.back-link { color: var(--muted); font-size: 0.8rem; text-underline-offset: 0.22rem; }
	header { margin: 2.2rem 0 1.5rem; }
	.eyebrow { margin: 0 0 0.5rem; color: var(--muted); font: 700 0.72rem var(--font-mono); letter-spacing: 0.09em; text-transform: uppercase; }
	h1 { margin: 0; font-family: var(--font-rounded); font-size: clamp(2rem, 7vw, 3rem); }
	header > p:last-child,
	.add-player p { color: var(--muted); font-size: 0.86rem; line-height: 1.5; }
	.player-list { display: grid; gap: 0.65rem; }
	.player-list form { margin: 0; }
	.player-list button { display: flex; width: 100%; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.1rem; border: 1px solid var(--line); border-radius: 0.85rem; background: var(--card); color: var(--ink); cursor: pointer; text-align: left; }
	.player-list button.active { border-color: var(--focus-line); background: var(--focus); }
	.player-list strong { font-family: var(--font-rounded); font-size: 1.05rem; }
	.player-list span { color: var(--muted); font-size: 0.72rem; }
	.add-player,
	.rename-player { margin-top: 2.2rem; padding-top: 1.5rem; border-top: 1px solid var(--line); }
	.add-player h2,
	.rename-player h2 { margin: 0; font-size: 1rem; }
	.add-player div { display: flex; gap: 0.7rem; flex-wrap: wrap; margin-top: 0.9rem; }
	.add-player a { padding: 0.65rem 0.9rem; border: 1px solid var(--line-strong); border-radius: 999px; color: var(--ink); font-size: 0.78rem; text-decoration: none; }
	.rename-player > p { color: var(--muted); font-size: 0.8rem; }
	.rename-notice { padding: 0.65rem 0.8rem; border: 1px solid var(--incorrect-line); border-radius: 0.65rem; background: var(--incorrect-fill); color: var(--incorrect-ink) !important; }
	.rename-notice.success { border-color: var(--correct-line); background: var(--correct-fill); color: var(--correct-ink) !important; }
	.typed-rename { margin-top: 1rem; }
	.typed-rename label,
	.typed-rename small { display: block; color: var(--muted); font-size: 0.72rem; }
	.typed-rename > div { display: flex; gap: 0.5rem; margin: 0.35rem 0; }
	.typed-rename input { flex: 1; min-width: 0; padding: 0.68rem 0.8rem; border: 1px solid var(--line-strong); border-radius: 0.65rem; background: var(--card); }
	.typed-rename button,
	.curated-renames button { border: 1px solid var(--line); border-radius: 999px; background: var(--card); color: var(--ink); cursor: pointer; }
	.typed-rename button { padding: 0.65rem 0.9rem; border-color: var(--ink); background: var(--ink); color: white; font-weight: 700; }
	.curated-renames { display: flex; gap: 0.45rem; margin-top: 1rem; flex-wrap: wrap; }
	.curated-renames button { padding: 0.5rem 0.7rem; font-size: 0.72rem; }
	.curated-renames span { margin-right: 0.2rem; }
	.form-message { color: var(--incorrect-ink); font-size: 0.8rem; }
	@media (max-width: 560px) { main { width: min(calc(100% - 1.25rem), 42rem); padding-top: 5rem; } .player-list button { align-items: flex-start; flex-direction: column; } }
</style>
