<script lang="ts">
	export interface LeaderboardView {
		exerciseId: number;
		suppressed: boolean;
		distinctRankedPlayers: number;
		rows: Array<{
			rank: number;
			scoreId: number;
			nickname: string;
			netWpm: number;
			accuracy: number;
		}>;
		personal: {
			rank: number | null;
			status: 'ranked' | 'not-ranked';
			scoreId: number;
			nickname: string;
			netWpm: number;
			accuracy: number;
		} | null;
		personalBest: boolean;
	}

	let { leaderboard }: { leaderboard: LeaderboardView } = $props();
	const personalNeedsAppend = $derived(
		leaderboard.personal &&
			(leaderboard.personal.rank === null || leaderboard.personal.rank > leaderboard.rows.length)
	);
</script>

<section class="leaderboard" aria-labelledby={`leaderboard-${leaderboard.exerciseId}`}>
	<header>
		<p>Leaderboard</p>
		<h2 id={`leaderboard-${leaderboard.exerciseId}`}>Best on this Exercise</h2>
	</header>

	{#if leaderboard.suppressed}
		{#if leaderboard.personal}
			<div class="personal-panel">
				<span>Your best</span>
				<strong>{leaderboard.personal.netWpm.toFixed(1)} net WPM</strong>
				<small>
					{leaderboard.personal.status === 'not-ranked'
						? 'Not ranked'
						: `Rank ${leaderboard.personal.rank}`}
				</small>
				{#if leaderboard.personalBest}<em>New personal best ✓</em>{/if}
			</div>
		{/if}
	{:else}
		<ol>
			{#each leaderboard.rows as row}
				<li class:mine={row.scoreId === leaderboard.personal?.scoreId}>
					<span class="rank">{row.rank}</span>
					<strong>{row.nickname}</strong>
					<span>{row.netWpm.toFixed(1)} WPM</span>
					<small>{(row.accuracy * 100).toFixed(1)}%</small>
					{#if row.scoreId === leaderboard.personal?.scoreId && leaderboard.personalBest}
						<em>New personal best ✓</em>
					{/if}
				</li>
			{:else}
				<li class="empty-board">No Scores on this Exercise yet. Yours would be the first.</li>
			{/each}
		</ol>

		{#if personalNeedsAppend && leaderboard.personal}
			<div class="personal-row" class:not-ranked={leaderboard.personal.status === 'not-ranked'}>
				<span class="rank">{leaderboard.personal.rank ?? '—'}</span>
				<strong>{leaderboard.personal.nickname}</strong>
				<span>{leaderboard.personal.netWpm.toFixed(1)} WPM</span>
				<small>{leaderboard.personal.status === 'not-ranked' ? 'Not ranked' : `${(leaderboard.personal.accuracy * 100).toFixed(1)}%`}</small>
				{#if leaderboard.personalBest}<em>New personal best ✓</em>{/if}
			</div>
		{/if}
	{/if}
</section>

<style>
	.leaderboard { margin-top: 2rem; padding: 1.35rem; border-radius: 1.35rem; background: var(--paper-deep); font-family: var(--font-sans); }
	header p { width: fit-content; padding: 0.35rem 0.6rem; margin: 0 0 0.4rem; border-radius: 999px; background: var(--indigo); color: #fff; font-size: 0.66rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
	h2 { margin: 0 0 1rem; font: 700 1.25rem var(--font-rounded); }
	ol { padding: 0; margin: 0; list-style: none; }
	li,
	.personal-row { display: grid; grid-template-columns: 2rem minmax(7rem, 1fr) auto auto; align-items: center; gap: 0.7rem; min-height: 3rem; padding: 0.55rem 0.7rem; font-size: 0.8rem; }
	/* Dividers between rows only — never a trailing rule under the last one. */
	li + li { border-top: 2px solid var(--pencil-line); }
	.empty-board { display: block; padding: 0.75rem 0.7rem; color: var(--muted); line-height: 1.5; }
	li.mine { border-radius: 0.75rem; background: var(--highlight); box-shadow: 0 4px 0 var(--sun-deep); }
	.rank { color: var(--muted); font-family: var(--font-mono); }
	li small,
	.personal-row small { color: var(--muted); }
	em { grid-column: 2 / -1; color: var(--correct-ink); font-size: 0.7rem; font-style: normal; font-weight: 700; }
	.personal-row { margin-top: 0.9rem; border: 0; border-radius: 0.85rem; background: var(--highlight); box-shadow: 0 4px 0 var(--sun-deep); }
	.personal-row.not-ranked { border-style: dashed; background: var(--paper); }
	.personal-panel { display: grid; max-width: 18rem; gap: 0.18rem; padding: 1rem; border-radius: 1rem; background: #fff; box-shadow: 0 5px 0 #c9c3ec; }
	.personal-panel span,
	.personal-panel small { color: var(--muted); font-size: 0.7rem; text-transform: uppercase; }
	.personal-panel strong { font: 700 1.2rem var(--font-mono); }
	.personal-panel em { grid-column: auto; }
	@media (max-width: 560px) {
		li,
		.personal-row { grid-template-columns: 1.6rem 1fr auto; }
		li small,
		.personal-row small { grid-column: 2 / -1; }
	}
</style>
