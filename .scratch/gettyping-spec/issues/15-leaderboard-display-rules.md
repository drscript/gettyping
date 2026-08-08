# Settle the Leaderboard display rules

Type: grilling
Status: open

## Question

The Leaderboard is defined in [CONTEXT.md](../../CONTEXT.md) as the top 10 best Scores for a single Exercise, ranked by Net WPM ([08-scoring-formulas.md](./08-scoring-formulas.md)), computed on read by the query in [09-db-schema.md](./09-db-schema.md) and revealed only on completing an Attempt ([06-prototype-visual-design.md](./06-prototype-visual-design.md)). Several display rules remain unspecified, and one of them is a live defect rather than an omission.

**Tie-breaking is undefined.** Both forms of the query end in `ORDER BY net_wpm DESC LIMIT 10` with no secondary sort, and the inner `ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY net_wpm DESC)` has none either. Two Players on 41 net WPM therefore rank in whatever order SQLite happens to return, which can differ between reads — a Leaderboard that visibly reshuffles on refresh without anyone having typed. A deterministic secondary key is needed; the candidates carry real meaning (accuracy rewards the cleaner run, `created_at` rewards whoever got there first, `id` is arbitrary but stable).

**The out-of-top-10 Player.** [07-nickname-uniqueness.md](./07-nickname-uniqueness.md) justified the cookie partly so SSR could "highlight *your row* on a Leaderboard" — but if a Player isn't in the top 10 there is no row to highlight. Does the board show their standing anyway (an appended "you: #47" row), show nothing, or show a rank only? This matters most for the Learn Track, where a beginner's first-ever Score will sit far below ten strangers and the reveal is meant to be a reward.

**Ineligible Scores.** [10-score-integrity.md](./10-score-integrity.md) persists plausibility failures as `leaderboard_eligible = 0` — excluded from the board but still counted for personal history and the Learn gate. Does the Player who produced one get any indication, or does their Score silently not appear? Saying nothing risks a confused Player who beat the top time and sees no change; saying something risks accusing a genuinely fast typist of cheating.

**Thin and empty boards.** What a Leaderboard looks like before 10 Scores exist — and on the very first Attempt at an Exercise, where the Player is alone in first place. Every Exercise starts here, so it is the common case at launch, not an edge case.

**Inherited, do not re-litigate**: [13-gate-failure-flow.md](./13-gate-failure-flow.md) already settled that **Learn Leaderboards require a gate-clearing Score (≥90% accuracy)**, expressed as a predicate on the Learn Leaderboard query and explicitly *not* by setting `leaderboard_eligible = 0`. That decision is fixed; this ticket builds on it.

This is the remainder of the destination's "Leaderboard rules."
