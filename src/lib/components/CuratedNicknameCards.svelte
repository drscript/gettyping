<script lang="ts">
	import type { CuratedNickname } from '$lib/nicknames';
	import type { TrackFlex } from '$lib/ui/types';

	let {
		candidates,
		track,
		compact = false
	}: { candidates: CuratedNickname[]; track: TrackFlex; compact?: boolean } = $props();
</script>

<div class="nickname-cards" class:compact>
	{#each candidates as candidate (candidate.nickname)}
		<form method="POST" action="?/create">
			<input type="hidden" name="track" value={track} />
			<input type="hidden" name="source" value="curated" />
			<button
				type="submit"
				name="nickname"
				value={candidate.nickname}
				class="nickname-card"
				data-testid="nickname-card"
			>
				<span class="nickname-medallion" aria-hidden="true">{candidate.icon}</span>
				<span class="nickname-name">{candidate.nickname}</span>
			</button>
		</form>
	{/each}
</div>

<style>
	.nickname-cards {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1rem;
	}

	.nickname-cards form {
		display: contents;
	}

	/*
	 * Each Nickname is a raised token, not a card in a grid: a coloured medallion
	 * holds the creature, the tile carries the name, and pressing it moves.
	 */
	.nickname-card {
		display: grid;
		min-height: 9rem;
		padding: 1.15rem 0.65rem 1.1rem;
		align-content: center;
		place-items: center;
		gap: 0.7rem;
		border: 2px solid var(--line);
		border-radius: 1.35rem;
		background: var(--card);
		color: var(--ink);
		cursor: pointer;
		box-shadow: 0 7px 0 #c9c3ec, 0 14px 20px rgb(33 24 95 / 12%);
		transition: border-color 140ms var(--ease-pop), box-shadow 140ms var(--ease-pop), transform 140ms var(--ease-pop);
	}

	.nickname-medallion {
		display: grid;
		width: 3.9rem;
		height: 3.9rem;
		place-items: center;
		border-radius: 50%;
		background: var(--token-fill, var(--sky));
		font-size: 2rem;
		line-height: 1;
		box-shadow: inset 0 -0.45rem 0.6rem rgb(20 13 75 / 14%);
		transition: transform 140ms var(--ease-pop);
	}

	.nickname-name {
		font-family: var(--font-rounded);
		font-size: 1.02rem;
		font-weight: 700;
	}

	/* A rotating palette keeps the row lively without becoming confetti. */
	.nickname-cards form:nth-child(6n + 1) .nickname-medallion { --token-fill: var(--sun); }
	.nickname-cards form:nth-child(6n + 2) .nickname-medallion { --token-fill: var(--coral); }
	.nickname-cards form:nth-child(6n + 3) .nickname-medallion { --token-fill: var(--mint); }
	.nickname-cards form:nth-child(6n + 4) .nickname-medallion { --token-fill: var(--sky); }
	.nickname-cards form:nth-child(6n + 5) .nickname-medallion { --token-fill: var(--sun); }
	.nickname-cards form:nth-child(6n + 6) .nickname-medallion { --token-fill: var(--mint); }

	.nickname-card:hover {
		border-color: var(--correct-line);
		box-shadow: 0 9px 0 var(--mint-deep), 0 18px 24px rgb(33 24 95 / 14%);
		transform: translateY(-4px) rotate(-1deg);
	}

	.nickname-card:hover .nickname-medallion { transform: scale(1.08) rotate(4deg); }

	.nickname-card:active {
		box-shadow: 0 2px 0 var(--mint-deep);
		transform: translateY(5px);
	}

	.nickname-cards.compact .nickname-card {
		min-height: 6.5rem;
	}

	.nickname-cards.compact .nickname-medallion {
		width: 2.6rem;
		height: 2.6rem;
		font-size: 1.3rem;
	}

	.nickname-cards.compact .nickname-name { font-size: 0.88rem; }

	@media (max-width: 620px) {
		.nickname-cards:not(.compact) {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.nickname-card {
			min-height: 8rem;
		}

		.nickname-name { font-size: 0.92rem; }
	}
</style>
