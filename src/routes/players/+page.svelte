<script lang="ts">
	import TaskMasthead from '$lib/components/TaskMasthead.svelte';
	import { formatTransferCodeForDisplay, transferCodeLength } from '$lib/transfer-code';

	let { data, form } = $props();

	let pickerDialog: HTMLDialogElement | undefined = $state();
	let codeDialog: HTMLDialogElement | undefined = $state();
	let redeemDialog: HTMLDialogElement | undefined = $state();
	let copied = $state(false);
	let redeemDigits = $state<string[]>(Array(transferCodeLength).fill(''));
	let redeemInputs: (HTMLInputElement | undefined)[] = [];

	const enteredCode = $derived(redeemDigits.join(''));

	function openPicker(): void {
		copied = false;
		pickerDialog?.showModal();
	}

	function openRedeemPicker(): void {
		redeemDialog?.showModal();
		redeemInputs[0]?.focus();
	}

	async function copyCode(code: string): Promise<void> {
		try {
			await navigator.clipboard.writeText(code);
			copied = true;
		} catch {
			copied = false;
		}
	}

	function closeOnBackdropClick(dialog: HTMLDialogElement | undefined) {
		return (event: MouseEvent) => {
			if (event.target === dialog) dialog?.close();
		};
	}

	function handleRedeemDigitInput(index: number) {
		return (event: Event) => {
			const input = event.currentTarget as HTMLInputElement;
			const value = input.value.toUpperCase().slice(-1);
			redeemDigits[index] = value;
			if (value && index < redeemDigits.length - 1) redeemInputs[index + 1]?.focus();
		};
	}

	function handleRedeemDigitKeydown(index: number) {
		return (event: KeyboardEvent) => {
			if (event.key !== 'Backspace' || redeemDigits[index] || index === 0) return;
			event.preventDefault();
			redeemDigits[index - 1] = '';
			redeemInputs[index - 1]?.focus();
		};
	}

	$effect(() => {
		if (form?.code && codeDialog && !codeDialog.open) {
			pickerDialog?.close();
			codeDialog.showModal();
		}
		if (form?.redeemError && redeemDialog && !redeemDialog.open) {
			redeemDialog.showModal();
			redeemInputs[0]?.focus();
		}
	});
</script>

<svelte:head>
	<title>Choose a Player · GetTyping</title>
	<meta name="description" content="Switch the active Player or add another Player on this device." />
</svelte:head>

<main>
	<TaskMasthead
		back="/"
		backLabel="Back home"
		label="This device"
		title="Who is typing?"
		lead="Each Player keeps their own Stages, Scores, and Weak-key Profile."
		keys={['P', 'L']}
	/>

	<div class="task-body">
		{#if data.players.length > 0}
			<section class="panel transfer-cta">
				<h2>Move to another device</h2>
				<p>Generate a short code, then enter it on the other device to bring a Player along.</p>
				<div class="transfer-cta-actions">
					<button type="button" class="transfer-cta-button" onclick={openPicker}>Get a code</button>
					<button type="button" class="transfer-cta-button secondary" onclick={openRedeemPicker}>
						I have a code
					</button>
				</div>
			</section>
		{/if}

		<section class="player-list" aria-label="Players on this device">
			{#each data.players as player}
				<form method="POST" action="?/switch">
					<input type="hidden" name="playerId" value={player.id} />
					<button type="submit" class:active={player.id === data.activePlayerId}>
						<span class="player-avatar" aria-hidden="true">{player.nickname.slice(0, 1)}</span>
						<strong>{player.nickname}</strong>
						<span class="player-state">{player.id === data.activePlayerId ? 'Typing now' : 'Switch to this Player'}</span>
					</button>
				</form>
			{:else}
				<p class="empty-players">
					No Players on this device yet. Add one below and they can pick their Nickname.
				</p>
			{/each}
		</section>

		{#if form?.message}<p class="form-message" role="alert">{form.message}</p>{/if}

		<section class="panel">
			<h2>Add another Player</h2>
			<p>Choose what they want to work on, then they can pick their Nickname.</p>
			<div class="track-links">
				<a class="learn-link" href="/nickname?track=learn">Learn to type</a>
				<a class="speed-link" href="/nickname?track=speed-test-practice">Get faster</a>
			</div>
		</section>

		<section class="panel">
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
				<div class="rename-row">
					<input id="rename-nickname" name="nickname" maxlength="24" autocomplete="off" required />
					<button type="submit">Save</button>
				</div>
				<small>Use a public Nickname that is not your real name.</small>
			</form>

			<div class="curated-renames" role="group" aria-label="Curated Nicknames">
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
	</div>
</main>

<dialog
	bind:this={pickerDialog}
	class="transfer-dialog"
	aria-labelledby="transfer-picker-title"
	onclick={closeOnBackdropClick(pickerDialog)}
>
	<h2 id="transfer-picker-title">Get a code for…</h2>
	<p>Pick which Player you want to move to another device.</p>
	<ul class="transfer-picker-list">
		{#each data.players as player}
			<li>
				<form method="POST" action="?/generate">
					<input type="hidden" name="playerId" value={player.id} />
					<button type="submit">{player.nickname}</button>
				</form>
			</li>
		{/each}
	</ul>
	<button type="button" class="transfer-dialog-close" onclick={() => pickerDialog?.close()}>
		Cancel
	</button>
</dialog>

<dialog
	bind:this={codeDialog}
	class="transfer-dialog"
	aria-labelledby="transfer-code-title"
	onclick={closeOnBackdropClick(codeDialog)}
>
	{#if form?.code}
		<h2 id="transfer-code-title">{form.nickname}'s code</h2>
		<p>Enter this on the other device within 10 minutes.</p>
		<p class="transfer-code" aria-live="polite">{formatTransferCodeForDisplay(form.code)}</p>
		<button type="button" class="transfer-copy" onclick={() => copyCode(form?.code ?? '')}>
			{copied ? 'Copied!' : 'Copy code'}
		</button>
	{/if}
	<button type="button" class="transfer-dialog-close" onclick={() => codeDialog?.close()}>
		Done
	</button>
</dialog>

<dialog
	bind:this={redeemDialog}
	class="transfer-dialog"
	aria-labelledby="transfer-redeem-title"
	onclick={closeOnBackdropClick(redeemDialog)}
>
	<h2 id="transfer-redeem-title">I have a code</h2>
	<p>Enter the 8-character code from the other device.</p>
	{#if form?.redeemError}<p class="redeem-error" role="alert">{form.redeemError}</p>{/if}
	<form method="POST" action="?/redeem">
		<input type="hidden" name="code" value={enteredCode} />
		<div class="code-boxes" role="group" aria-label="8-character transfer code">
			{#each redeemDigits as digit, index}
				<input
					class="code-box"
					type="text"
					inputmode="text"
					autocapitalize="characters"
					autocomplete="off"
					spellcheck="false"
					maxlength="1"
					value={digit}
					bind:this={redeemInputs[index]}
					oninput={handleRedeemDigitInput(index)}
					onkeydown={handleRedeemDigitKeydown(index)}
					aria-label={`Character ${index + 1} of 8`}
				/>
			{/each}
		</div>
		<button type="submit" class="transfer-cta-button" disabled={enteredCode.length < transferCodeLength}>
			Redeem code
		</button>
	</form>
	<button type="button" class="transfer-dialog-close" onclick={() => redeemDialog?.close()}>
		Cancel
	</button>
</dialog>

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
		opacity: 0.24;
		transform: rotate(-2deg);
	}

	.task-body > * { position: relative; z-index: 1; }

	.empty-players {
		margin: 0;
		padding: 1.1rem 1.2rem;
		border-radius: 1.25rem;
		background: #fff;
		color: var(--muted);
		font-size: 0.88rem;
		line-height: 1.55;
		box-shadow: var(--shadow-paper);
	}

	/* Each Player is a nameplate you press, with the active one clearly seated. */
	.player-list { display: grid; gap: 0.75rem; }
	.player-list form { margin: 0; }

	.player-list button {
		display: grid;
		width: 100%;
		align-items: center;
		grid-template-columns: 3.1rem 1fr auto;
		gap: 0.35rem 1rem;
		padding: 0.95rem 1.1rem;
		border: 2px solid var(--line);
		border-radius: 1.25rem;
		background: #fff;
		color: var(--ink);
		cursor: pointer;
		text-align: left;
		box-shadow: 0 6px 0 var(--pencil-line);
		transition: transform 140ms var(--ease-pop), box-shadow 140ms var(--ease-pop);
	}

	.player-list button:hover { transform: translateY(-2px); }
	.player-list button:active { box-shadow: none; transform: translateY(5px); }

	.player-avatar {
		display: grid;
		width: 3.1rem;
		height: 3.1rem;
		place-items: center;
		border-radius: 50%;
		background: var(--sky);
		color: var(--night);
		font: 700 1.35rem var(--font-rounded);
		grid-row: span 2;
		text-transform: uppercase;
	}

	.player-list strong { align-self: end; font-family: var(--font-rounded); font-size: 1.2rem; }
	.player-state { align-self: start; grid-column: 2 / -1; color: var(--muted); font-size: 0.76rem; font-weight: 700; }

	.player-list button.active {
		border-color: var(--sun-deep);
		background: var(--highlight);
		box-shadow: 0 6px 0 var(--sun-deep);
	}

	.player-list button.active .player-avatar { background: var(--sun); }
	.player-list button.active .player-state { color: var(--night); }

	.panel {
		padding: clamp(1.25rem, 3.5vw, 1.75rem);
		border-radius: 1.6rem;
		margin-top: 1.25rem;
		background: #fff;
		box-shadow: var(--shadow-paper);
	}

	.panel h2 {
		margin: 0;
		font-family: var(--font-rounded);
		font-size: 1.3rem;
		letter-spacing: -0.02em;
	}

	.panel > p {
		max-width: 46ch;
		margin: 0.4rem 0 0;
		color: var(--muted);
		font-size: 0.86rem;
		line-height: 1.55;
	}

	.transfer-cta { margin-top: 0; margin-bottom: 1.25rem; }

	.transfer-cta-button {
		padding: 0.75rem 1.15rem;
		border: 0;
		border-radius: 999px;
		margin-top: 1.1rem;
		background: var(--indigo);
		color: #fff;
		cursor: pointer;
		font-weight: 800;
		box-shadow: 0 5px 0 var(--night);
		transition: transform 140ms var(--ease-pop), box-shadow 140ms var(--ease-pop);
	}

	.transfer-cta-button:hover { transform: translateY(-2px); }
	.transfer-cta-button:active { box-shadow: none; transform: translateY(4px); }
	.transfer-cta-button:disabled { cursor: not-allowed; opacity: 0.5; transform: none; box-shadow: 0 5px 0 var(--night); }

	.transfer-cta-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1.1rem; }
	.transfer-cta-actions .transfer-cta-button { margin-top: 0; }

	.transfer-cta-button.secondary {
		background: #fff;
		color: var(--indigo);
		box-shadow: 0 5px 0 var(--line-strong);
	}

	.code-boxes { display: flex; gap: 0.5rem; margin: 1.1rem 0; justify-content: center; }

	.code-box {
		width: 2.4rem;
		height: 2.9rem;
		padding: 0;
		border: 2px solid var(--line-strong);
		border-radius: 0.75rem;
		background: var(--card);
		color: var(--ink);
		font: 700 1.3rem var(--font-mono);
		text-align: center;
		text-transform: uppercase;
	}

	.code-box:focus-visible {
		border-color: var(--indigo-active);
		outline: 3px solid var(--indigo-active);
		outline-offset: 2px;
	}

	.redeem-error {
		padding: 0.75rem 0.95rem;
		border-radius: 0.9rem;
		margin: 1rem 0 0;
		background: var(--incorrect-fill);
		color: var(--incorrect-ink);
		font-size: 0.85rem;
		font-weight: 700;
	}

	.transfer-dialog {
		width: min(92vw, 26rem);
		padding: 1.5rem;
		border: 0;
		border-radius: 1.5rem;
		background: var(--card);
		color: var(--ink);
		box-shadow: var(--shadow-paper);
	}

	.transfer-dialog::backdrop { background: rgb(33 24 95 / 45%); }

	.transfer-dialog h2 { margin: 0; font-family: var(--font-rounded); font-size: 1.2rem; }
	.transfer-dialog > p { margin: 0.5rem 0 0; color: var(--muted); font-size: 0.86rem; line-height: 1.5; }

	.transfer-picker-list { display: grid; gap: 0.6rem; padding: 0; margin: 1.1rem 0 0; list-style: none; }
	.transfer-picker-list form { margin: 0; }

	.transfer-picker-list button {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 2px solid var(--line);
		border-radius: 1rem;
		background: #fff;
		color: var(--ink);
		cursor: pointer;
		font-weight: 700;
		text-align: left;
	}

	.transfer-code {
		padding: 0.9rem 1rem;
		border-radius: 1rem;
		margin: 1rem 0 0;
		background: var(--paper-deep);
		color: var(--ink);
		font: 700 1.4rem var(--font-mono);
		letter-spacing: 0.08em;
		text-align: center;
	}

	.transfer-copy {
		width: 100%;
		padding: 0.75rem 1.15rem;
		border: 0;
		border-radius: 999px;
		margin-top: 1rem;
		background: var(--mint);
		color: var(--night);
		cursor: pointer;
		font-weight: 800;
		box-shadow: 0 5px 0 var(--mint-deep);
	}

	.transfer-dialog-close {
		width: 100%;
		padding: 0.65rem 1rem;
		border: 2px solid var(--line);
		border-radius: 999px;
		margin-top: 0.75rem;
		background: transparent;
		color: var(--muted);
		cursor: pointer;
		font-weight: 700;
	}

	.track-links { display: flex; gap: 0.75rem; margin-top: 1.1rem; flex-wrap: wrap; }

	.track-links a {
		padding: 0.72rem 1.1rem;
		border-radius: 999px;
		color: var(--ink);
		font-size: 0.82rem;
		font-weight: 800;
		text-decoration: none;
		transition: transform 140ms var(--ease-pop), box-shadow 140ms var(--ease-pop);
	}

	.learn-link { background: var(--sun); box-shadow: 0 5px 0 var(--sun-deep); }
	.speed-link { background: var(--mint); box-shadow: 0 5px 0 var(--mint-deep); }
	.track-links a:hover { transform: translateY(-2px); }
	.track-links a:active { box-shadow: none; transform: translateY(4px); }

	.rename-notice {
		margin: 1.1rem 0 0;
		padding: 0.75rem 0.95rem;
		border: 2px solid var(--incorrect-line);
		border-radius: 0.9rem;
		background: var(--incorrect-fill);
		color: var(--incorrect-ink) !important;
		font-size: 0.85rem;
		font-weight: 700;
	}

	.rename-notice.success {
		border-color: var(--correct-line);
		background: var(--correct-fill);
		color: var(--correct-ink) !important;
	}

	.typed-rename { margin-top: 1.2rem; }

	.typed-rename label {
		display: block;
		margin-bottom: 0.45rem;
		font-size: 0.76rem;
		font-weight: 800;
	}

	.typed-rename small { display: block; margin-top: 0.5rem; color: var(--muted); font-size: 0.74rem; }

	.rename-row { display: flex; gap: 0.6rem; }

	.typed-rename input {
		flex: 1;
		min-width: 0;
		padding: 0.8rem 0.95rem;
		border: 2px solid var(--line-strong);
		border-radius: 0.9rem;
		background: var(--card);
		color: var(--ink);
		font: 600 1rem var(--font-sans);
	}

	/* `:focus-visible`, not `:focus` — a scoped `:focus` rule outranks the global ring. */
	.typed-rename input:focus-visible {
		border-color: var(--indigo-active);
		outline: 3px solid var(--indigo-active);
		outline-offset: 3px;
	}

	.typed-rename button {
		padding: 0.75rem 1.15rem;
		border: 0;
		border-radius: 999px;
		background: var(--indigo);
		color: #fff;
		cursor: pointer;
		font-weight: 800;
		box-shadow: 0 5px 0 var(--night);
		transition: transform 140ms var(--ease-pop), box-shadow 140ms var(--ease-pop);
	}

	.typed-rename button:hover { transform: translateY(-2px); }
	.typed-rename button:active { box-shadow: none; transform: translateY(4px); }

	.curated-renames { display: flex; gap: 0.55rem; margin-top: 1.35rem; flex-wrap: wrap; }

	.curated-renames button {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.55rem 0.85rem;
		border: 2px solid var(--line);
		border-radius: 999px;
		background: #fff;
		color: var(--ink);
		cursor: pointer;
		font-size: 0.78rem;
		font-weight: 800;
		box-shadow: 0 4px 0 var(--pencil-line);
		transition: transform 140ms var(--ease-pop), box-shadow 140ms var(--ease-pop);
	}

	.curated-renames button:hover { transform: translateY(-2px); }
	.curated-renames button:active { box-shadow: none; transform: translateY(4px); }

	.form-message {
		margin: 1rem 0 0;
		padding: 0.75rem 0.95rem;
		border-radius: 0.9rem;
		background: var(--incorrect-fill);
		color: var(--incorrect-ink);
		font-size: 0.84rem;
		font-weight: 700;
	}

	@media (max-width: 560px) {
		.task-body { width: min(calc(100% - 1.5rem), var(--task-width)); }
		.task-body::before { height: 8rem; }
		.rename-row { align-items: stretch; flex-direction: column; }
		.typed-rename button { width: 100%; }
	}
</style>
