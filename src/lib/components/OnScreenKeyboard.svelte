<script lang="ts">
	import type { TypingKey } from '$lib/ui/types';
	import { isSpaceKey } from '$lib/ui/types';

	let { nextKey }: { nextKey: TypingKey } = $props();

	interface KeyboardKey {
		label: string;
		values: TypingKey[];
		wide?: boolean;
	}

	const key = (label: string, ...values: TypingKey[]): KeyboardKey => ({ label, values });
	const rows: KeyboardKey[][] = [
		[
			key('1 !', '1', '!'),
			key('2', '2'),
			key('3', '3'),
			key('4', '4'),
			key('5', '5'),
			key('6', '6'),
			key('7', '7'),
			key('8', '8'),
			key('9', '9'),
			key('0', '0')
		],
		'qwertyuiop'.split('').map((letter) => key(letter, letter as TypingKey)),
		[
			...'asdfghjkl'.split('').map((letter) => key(letter, letter as TypingKey)),
			key('; :', ';', ':'),
			key("'", "'")
		],
		[
			{ ...key('shift', 'shift'), wide: true },
			...'zxcvbnm'.split('').map((letter) => key(letter, letter as TypingKey)),
			key(',', ','),
			key('.', '.'),
			key('/ ?', '/', '?')
		],
		[{ ...key('space', ' '), wide: true }]
	];
</script>

<div class="keyboard" aria-label={`On-screen keyboard. Next key: ${isSpaceKey(nextKey) ? 'space' : nextKey}`}>
	{#each rows as row}
		<div class="keyboard-row">
			{#each row as keyboardKey}
				{@const isNext = keyboardKey.values.includes(nextKey)}
				<kbd class:is-next={isNext} class:is-wide={keyboardKey.wide}>
					{keyboardKey.label}
					{#if isNext}<span class="sr-only"> — next key</span>{/if}
				</kbd>
			{/each}
		</div>
	{/each}
</div>

<style>
	.keyboard {
		display: grid;
		gap: clamp(0.18rem, 1vw, 0.38rem);
		margin-top: 1.65rem;
	}

	.keyboard-row {
		display: flex;
		justify-content: center;
		gap: clamp(0.18rem, 1vw, 0.38rem);
	}

	kbd {
		display: grid;
		width: clamp(1.35rem, 6vw, 2.25rem);
		height: clamp(1.55rem, 6vw, 2.25rem);
		place-items: center;
		border: 1px solid var(--line);
		border-radius: 0.5rem;
		background: var(--card);
		box-shadow: 0 1px 1px rgb(0 0 0 / 4%);
		font-family: var(--font-mono);
		font-size: clamp(0.48rem, 1.5vw, 0.72rem);
		font-weight: 500;
		white-space: nowrap;
	}

	kbd.is-next {
		border-color: var(--focus-line);
		background: var(--focus);
		box-shadow: 0 0 0 2px rgb(230 201 77 / 30%);
		font-weight: 700;
	}

	kbd.is-wide {
		width: min(12.5rem, 42vw);
		color: var(--muted);
		font-size: 0.6rem;
		letter-spacing: 0.06em;
	}

	.keyboard-row:nth-child(4) kbd.is-wide {
		width: clamp(2.8rem, 12vw, 4.75rem);
	}
</style>
