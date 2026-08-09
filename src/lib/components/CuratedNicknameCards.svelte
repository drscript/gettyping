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
				<span class="nickname-icon" aria-hidden="true">{candidate.icon}</span>
				<span>{candidate.nickname}</span>
			</button>
		</form>
	{/each}
</div>

<style>
	.nickname-cards {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.75rem;
	}

	.nickname-cards form {
		display: contents;
	}

	.nickname-card {
		display: grid;
		min-height: 8.5rem;
		padding: 1rem 0.65rem;
		place-items: center;
		align-content: center;
		gap: 0.55rem;
		border: 1px solid var(--line);
		border-radius: 0.9rem;
		background: var(--card);
		color: var(--ink);
		font-weight: 700;
		cursor: pointer;
		transition:
			border-color 120ms ease,
			transform 120ms ease;
	}

	.nickname-card:hover {
		border-color: var(--correct-line);
		transform: translateY(-2px);
	}

	.nickname-icon {
		font-size: 2.4rem;
		line-height: 1;
	}

	.nickname-cards.compact .nickname-card {
		min-height: 6.25rem;
	}

	.nickname-cards.compact .nickname-icon {
		font-size: 1.8rem;
	}

	@media (max-width: 620px) {
		.nickname-cards:not(.compact) {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.nickname-card {
			min-height: 7.5rem;
			font-size: 0.88rem;
		}
	}
</style>
