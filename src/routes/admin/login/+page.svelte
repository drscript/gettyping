<script lang="ts">
	let { form } = $props();
</script>

<svelte:head>
	<title>Admin login · GetTyping</title>
</svelte:head>

<main>
	<form method="POST">
		<p class="kicker">GetTyping — Admin</p>
		<h1>Sign in</h1>
		<div class="field">
			<label for="token">Admin token</label>
			<input id="token" name="token" type="password" autocomplete="current-password" required />
		</div>
		<button type="submit">Sign in</button>
		{#if form?.message}<p class="form-message" role="alert">{form.message}</p>{/if}
	</form>
</main>

<style>
	main {
		display: flex;
		min-height: 100vh;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
	}

	form {
		display: flex;
		width: 100%;
		max-width: 21rem;
		flex-direction: column;
		gap: 1rem;
		padding: 2rem;
		border: 1px solid var(--line);
		border-radius: 0.75rem;
		background: var(--card);
		box-shadow: 0 1px 2px rgb(36 27 99 / 6%), 0 8px 24px rgb(36 27 99 / 8%);
	}

	.kicker {
		margin: 0;
		color: var(--muted);
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0;
		color: var(--ink);
		font-size: 1.3rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	label {
		color: var(--muted);
		font-size: 0.85rem;
		font-weight: 700;
	}

	input {
		padding: 0.55rem 0.7rem;
		border: 1px solid var(--pencil-line);
		border-radius: 0.5rem;
		background: var(--card);
		color: var(--ink);
		font-size: 1rem;
	}

	button {
		padding: 0.6rem 1rem;
		border: none;
		border-radius: 0.5rem;
		background: var(--indigo-active);
		color: #fff;
		cursor: pointer;
		font-size: 0.95rem;
		font-weight: 700;
		transition: background-color 140ms var(--ease-pop);
	}

	button:hover {
		background: var(--night);
	}

	.form-message {
		margin: 0;
		color: var(--incorrect-ink);
		font-size: 0.875rem;
		font-weight: 600;
	}
</style>
