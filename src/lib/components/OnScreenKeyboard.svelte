<script lang="ts">
	import type { TrackFlex, TypingKey } from '$lib/ui/types';
	import { isSpaceKey } from '$lib/ui/types';
	import {
		fingerPhrase,
		keyboardCapRows,
		keyboardCaps,
		pipCountFor,
		type KeyboardCap
	} from '$lib/ui/keyboard-caps';

	let {
		nextKeys,
		track
	}: {
		nextKeys: TypingKey[];
		track: TrackFlex;
	} = $props();

	const showFingerZones = $derived(track === 'learn');
	const isHomeHighlight = $derived(nextKeys.length > 1);

	function displayKey(key: TypingKey, uppercase: boolean): string {
		const label = isSpaceKey(key) ? 'space' : key;
		return uppercase ? label.toUpperCase() : label;
	}

	function capForKey(key: TypingKey): KeyboardCap | undefined {
		return keyboardCaps.find((cap) => cap.values.includes(key));
	}

	const ariaLabel = $derived.by(() => {
		if (nextKeys.length === 0) return 'On-screen keyboard.';
		const named = nextKeys.map((key) => {
			const cap = capForKey(key);
			const shown = displayKey(key, isHomeHighlight);
			if (!showFingerZones || !cap) return shown;
			return `${shown}, ${fingerPhrase(cap)}`;
		});
		if (isHomeHighlight) return `On-screen keyboard. Home keys: ${named.join(' and ')}.`;
		return `On-screen keyboard. Next key: ${named.join(' and ')}.`;
	});
</script>

<div class="keyboard" role="img" aria-label={ariaLabel}>
	{#each keyboardCapRows as row}
		<div class="keyboard-row">
			{#each row as cap}
				{@const isNext = nextKeys.some((key) => cap.values.includes(key))}
				<kbd
					class:is-next={isNext}
					class:is-wide={cap.wide}
					class:is-home={showFingerZones && Boolean(cap.home)}
					data-finger={showFingerZones ? cap.finger : undefined}
					data-hand={showFingerZones ? cap.hand : undefined}
				>
					{#if showFingerZones}
						{#if cap.finger === 'thumb'}
							<span class="finger-badge thumb-badge" aria-hidden="true"
								><span class="thumb-bar"></span></span
							>
						{:else}
							<span class="finger-badge" aria-hidden="true">
								<span class="chevron"></span>
								<span class="pips">
									{#each Array.from({ length: pipCountFor(cap.finger) }, (_, index) => index) as pipIndex (pipIndex)}
										<span class="pip"></span>
									{/each}
								</span>
							</span>
						{/if}
					{/if}
					{cap.label}
					{#if isNext}
						<span class="sr-only">
							{' '}— {isHomeHighlight ? 'home key' : 'next key'}{showFingerZones
								? `, ${fingerPhrase(cap)}`
								: ''}</span
						>
					{/if}
				</kbd>
			{/each}
		</div>
	{/each}
</div>

<style>
	/*
	 * Keys are sized against the keyboard's own width, not the viewport, so eleven
	 * columns always fit whatever gutters the shell around it happens to use.
	 * Finger badges match .scratch/finger-assignment/prototypes/keyboard-finger-zones.html.
	 */
	.keyboard {
		display: grid;
		container-type: inline-size;
		gap: clamp(0.28rem, 1vw, 0.48rem);
		padding: clamp(0.75rem, 2vw, 1.2rem);
		margin-top: 1.65rem;
		border-radius: 1.4rem;
		background: #d9d5f2;
		box-shadow: inset 0 4px 0 rgb(255 255 255 / 58%), 0 10px 0 var(--key-edge-deep), 0 18px 28px rgb(33 24 95 / 14%);
		--pinky: var(--sky);
		--ring: var(--lesson-blue);
		--middle: var(--indigo);
		--index: var(--indigo-active);
		--thumb: var(--mint);
	}

	.keyboard-row {
		display: flex;
		justify-content: center;
		gap: min(0.42rem, 0.85cqw);
	}

	kbd {
		position: relative;
		display: grid;
		width: min(2.25rem, 8cqw);
		height: min(2.25rem, 8cqw);
		place-items: center;
		padding-top: 0.28rem;
		border: 0;
		border-radius: 0.72rem;
		background: var(--card);
		box-shadow: 0 4px 0 var(--key-edge), 0 7px 10px rgb(33 24 95 / 13%);
		color: var(--ink);
		font-family: var(--font-mono);
		font-size: min(0.75rem, max(0.55rem, 3cqw));
		font-weight: 500;
		white-space: nowrap;
	}

	/* DESIGN.md commits the next key to Sunshine; the pale --highlight tint read at 1.14:1
	   against the neighbouring white caps, which is not a teaching affordance. */
	kbd.is-next {
		background: var(--sun);
		color: var(--ink);
		box-shadow: 0 6px 0 var(--sun-deep), 0 10px 16px rgb(33 24 95 / 18%);
		font-weight: 700;
		transform: translateY(-4px) scale(1.06);
	}

	kbd.is-wide {
		width: min(12.5rem, 42cqw);
		color: var(--muted);
		font-size: min(0.6rem, max(0.55rem, 2.6cqw));
		letter-spacing: 0.06em;
	}

	.keyboard-row:nth-child(4) kbd.is-wide {
		width: min(4.75rem, 11cqw);
	}

	kbd.is-home::after {
		position: absolute;
		bottom: 0.22rem;
		left: 50%;
		width: 38%;
		height: 0.16rem;
		border-radius: 999px;
		background: var(--ink);
		transform: translateX(-50%);
		content: '';
	}

	.finger-badge {
		position: absolute;
		top: 0.18rem;
		left: 50%;
		display: flex;
		align-items: center;
		gap: 0.08rem;
		padding: 0.07rem 0.16rem 0.07rem 0.12rem;
		border: 1.5px solid var(--ink);
		border-radius: 999px;
		transform: translateX(-50%);
		pointer-events: none;
	}

	.finger-badge.thumb-badge {
		background: transparent;
		border: 0;
		padding: 0;
	}

	kbd[data-hand='right'] .finger-badge {
		flex-direction: row-reverse;
		padding: 0.07rem 0.12rem 0.07rem 0.16rem;
	}

	kbd.is-wide .finger-badge {
		top: 0.28rem;
	}

	.chevron {
		width: 0;
		height: 0;
		border-top: 0.18rem solid transparent;
		border-bottom: 0.18rem solid transparent;
	}

	kbd[data-hand='left'] .chevron {
		border-right: 0.28rem solid var(--ink);
	}

	kbd[data-hand='right'] .chevron {
		border-left: 0.28rem solid var(--ink);
	}

	.pips {
		display: flex;
		gap: 0.07rem;
	}

	.pip {
		width: 0.22rem;
		height: 0.22rem;
		border-radius: 50%;
		background: var(--ink);
	}

	.thumb-bar {
		width: 1.15rem;
		height: 0.28rem;
		border: 1.5px solid var(--ink);
		border-radius: 999px;
		background: var(--thumb);
	}

	kbd[data-finger='pinky'] .finger-badge {
		background: var(--pinky);
	}

	kbd[data-finger='ring'] .finger-badge {
		background: var(--ring);
	}

	kbd[data-finger='middle'] .finger-badge {
		background: var(--middle);
	}

	kbd[data-finger='index'] .finger-badge {
		background: var(--index);
	}

	kbd[data-finger='ring'] .pip,
	kbd[data-finger='middle'] .pip,
	kbd[data-finger='index'] .pip {
		background: var(--card);
	}

	kbd[data-finger='ring'] .chevron {
		border-right-color: var(--card);
	}

	kbd[data-hand='right'][data-finger='ring'] .chevron {
		border-left-color: var(--card);
		border-right-color: transparent;
	}

	kbd[data-finger='middle'] .chevron,
	kbd[data-finger='index'] .chevron {
		border-right-color: var(--card);
	}

	kbd[data-hand='right'][data-finger='middle'] .chevron,
	kbd[data-hand='right'][data-finger='index'] .chevron {
		border-left-color: var(--card);
		border-right-color: transparent;
	}

	@media (max-width: 560px) {
		.keyboard {
			padding: 0.6rem 0.45rem;
			border-radius: 1rem;
		}
		kbd {
			border-radius: 0.5rem;
		}
		.pip {
			width: 0.16rem;
			height: 0.16rem;
		}
	}
</style>
