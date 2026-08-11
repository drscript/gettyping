<script lang="ts">
	let { form } = $props();
</script>

<svelte:head>
	<title>Admin login · GetTyping</title>
</svelte:head>

<main>
	<form method="POST">
		<h1>Admin login</h1>
		<label for="token">Admin token</label>
		<input id="token" name="token" type="password" autocomplete="current-password" required />
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
		background: #f2f0ff;
	}

	form {
		display: flex;
		width: 20rem;
		flex-direction: column;
		gap: 0.75rem;
		padding: 2rem;
		border-radius: 0.75rem;
		background: #ffffff;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
	}

	h1 {
		margin: 0 0 0.5rem;
		font-size: 1.25rem;
	}

	input {
		padding: 0.5rem;
		border: 1px solid #c9c3ec;
		border-radius: 0.375rem;
	}

	button {
		padding: 0.5rem;
		border: none;
		border-radius: 0.375rem;
		background: #4b44bd;
		color: #ffffff;
		cursor: pointer;
	}

	.form-message {
		margin: 0;
		color: #d84a35;
	}
</style>
