# Settle the Leaderboard display rules

Type: grilling
Status: resolved
Assignee: Claude

## Question

The Leaderboard is defined in [CONTEXT.md](../../CONTEXT.md) as the top 10 best Scores for a single Exercise, ranked by Net WPM ([08-scoring-formulas.md](./08-scoring-formulas.md)), computed on read by the query in [09-db-schema.md](./09-db-schema.md) and revealed only on completing an Attempt ([06-prototype-visual-design.md](./06-prototype-visual-design.md)). Several display rules remain unspecified, and one of them is a live defect rather than an omission.

**Tie-breaking is undefined.** Both forms of the query end in `ORDER BY net_wpm DESC LIMIT 10` with no secondary sort, and the inner `ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY net_wpm DESC)` has none either. Two Players on 41 net WPM therefore rank in whatever order SQLite happens to return, which can differ between reads — a Leaderboard that visibly reshuffles on refresh without anyone having typed. A deterministic secondary key is needed; the candidates carry real meaning (accuracy rewards the cleaner run, `created_at` rewards whoever got there first, `id` is arbitrary but stable).

**The out-of-top-10 Player.** [07-nickname-uniqueness.md](./07-nickname-uniqueness.md) justified the cookie partly so SSR could "highlight *your row* on a Leaderboard" — but if a Player isn't in the top 10 there is no row to highlight. Does the board show their standing anyway (an appended "you: #47" row), show nothing, or show a rank only? This matters most for the Learn Track, where a beginner's first-ever Score will sit far below ten strangers and the reveal is meant to be a reward.

**Ineligible Scores.** [10-score-integrity.md](./10-score-integrity.md) persists plausibility failures as `leaderboard_eligible = 0` — excluded from the board but still counted for personal history and the Learn gate. Does the Player who produced one get any indication, or does their Score silently not appear? Saying nothing risks a confused Player who beat the top time and sees no change; saying something risks accusing a genuinely fast typist of cheating.

**Thin and empty boards.** What a Leaderboard looks like before 10 Scores exist — and on the very first Attempt at an Exercise, where the Player is alone in first place. Every Exercise starts here, so it is the common case at launch, not an edge case.

**Inherited, do not re-litigate**: [13-gate-failure-flow.md](./13-gate-failure-flow.md) already settled that **Learn Leaderboards require a gate-clearing Score (≥90% accuracy)**, expressed as a predicate on the Learn Leaderboard query and explicitly *not* by setting `leaderboard_eligible = 0`. That decision is fixed; this ticket builds on it.

This is the remainder of the destination's "Leaderboard rules."

## Answer

### Tie-breaking: `net_wpm DESC, id ASC`

Applied in **both** clauses — the outer top-10 ordering and the inner `ROW_NUMBER()` partition that picks each Player's best.

`id` is an autoincrement PK, so it is unique in a single key (no third fallback needed) and monotonic with insertion, which makes it implicitly mean **the earlier Score wins**. A later identical Score can never displace an earlier one, so the board doesn't churn.

Rejected: `accuracy DESC`, which would quietly turn the board into a partial accuracy ranking, contradicting [08-scoring-formulas.md](./08-scoring-formulas.md)'s decision that Net WPM is the ranked metric. On Learn boards it is worse than inconsistent — [13-gate-failure-flow.md](./13-gate-failure-flow.md) already imposes a ≥90% accuracy floor there, so tie-breaking on accuracy would smuggle it back in as a ranking dimension through the side door. `created_at ASC` was considered and is redundant: it expresses the same intent as `id ASC` but is an INTEGER that can itself tie.

Two consequences recorded:

- **The "earlier wins" meaning rides on id monotonicity.** It is a property of autoincrement integers, not something the ordering states. If ids ever became non-sequential (a UUID migration, say) the tie-break would keep working deterministically but would silently stop meaning "earlier".
- **The inner clause matters more than it looks.** [07-nickname-uniqueness.md](./07-nickname-uniqueness.md) snapshots the Nickname onto each Score, so a Player who renamed between two identical-WPM runs would otherwise see their board row flicker between two different names depending on which Score the window function happened to pick.

### The Player outside the top 10

Their own row is **appended below the ten**, visually separated, showing their true rank — plus a **personal-best indicator** when the Attempt beat their previous best.

Rank is what a leaderboard owes a Player, and it gives [07](./07-nickname-uniqueness.md)'s SSR-highlight rationale something to do in the common case where the Player isn't in the top ten. The personal-best marker is the part that matters for the audience the pedagogy research worries about: "#47" means little to a beginner, but "22 wpm — your best yet" is progress-coupled, which is what [research/typing-pedagogy.md](../research/typing-pedagogy.md) says to reward for young learners rather than standing. It also matches what [14-practice-loop.md](./14-practice-loop.md) built for Practice, where the session summary shows *movement* rather than rank — so both Tracks tell a Player they improved.

Note [13](./13-gate-failure-flow.md) already narrowed when this arises on Learn: the board only appears on a *cleared* Attempt, so the Player always sees it in the context of a win.

Showing a bare "you're #47" with no row was rejected as strictly worse — the same discouraging number without the context of seeing your own Score beside it.

### Ineligible Scores: shown, marked, unexplained

A Score with `leaderboard_eligible = 0` ([10-score-integrity.md](./10-score-integrity.md)) appears on that same appended row, **marked as not ranked, with no explanation of why**. No new UI — it is a state on a component the previous decision already requires.

This deliberately mirrors [11-first-run-onboarding.md](./11-first-run-onboarding.md)'s profanity redirect: state the outcome, never name the detection, never shame the false positive. The reasoning is the same in both places. 10 conceded that this check will catch genuinely fast typists as well as casual tamperers — and someone whose laptop slept mid-Attempt, throwing the wall clock. Silence would baffle a legitimate Player looking for a Score that is simply nowhere; an explanation would insult them and hand anyone probing the system a map of the ceiling.

Given how rare this is, it is also the option that justifies building nothing bespoke.

**Interaction**: if a Player's own best Score is ineligible they have no ranked best at all, so the appended row carries their Score marked not ranked rather than a rank.

### Thin boards: suppressed below a threshold

At launch **every** board is empty — 21 Learn boards plus the Speed Test — so this is the normal condition for a while, not an edge case.

The Leaderboard is **suppressed until a threshold number of distinct ranked Players exists**, specified as a named config constant with a sensible default rather than a hardcoded number. Its tuned value joins the map's fog as the fifth constant of that shape.

The rationale is that a two-row board is not a leaderboard, and presenting one as though it were manufactures a competitive signal that does not exist — which also sits better with the research's steer toward progress over competition for the youngest cohort. Padding to ten with placeholder slots was rejected: ten dashes beneath a single name reads as broken rather than aspirational, and advertises emptiness exactly when the app most needs to feel alive.

Crucially, **the stats half of 06's reveal survives regardless** — suppression removes the ranking, not the completion moment.

### Below the threshold: the personal panel alone

The reveal shows the Player's Score and personal-best indicator, with **no rank and no rows**.

This is the same component the out-of-top-10 case already requires, simply rendered without the ten rows above it. One component in two contexts: the design degrades gracefully rather than branching, and by the time a board crosses the threshold the Player's own row is already familiar rather than newly introduced. It is also the only option that keeps the reveal progress-coupled while the board is hidden — the same job 14's session summary does for Practice.

A placeholder message ("not enough scores yet, check back") was rejected for drawing attention to absence and promising a payoff on a timeline nobody controls, which on a quiet solo project may be a long wait.

### Consequences for other tickets

- **[09-db-schema.md](./09-db-schema.md)** — the Leaderboard query gains `, id ASC` in both clauses. Addendum recorded, along with two reads the schema ticket did not previously mention: the appended row needs the Player's rank among eligible bests, and the suppression check needs a count of distinct ranked Players for the Exercise. Neither is difficult; neither falls out of the existing top-10 query.
- **[06-prototype-visual-design.md](./06-prototype-visual-design.md)** — the reveal is refined a second time. 13 made it "on clearing, not merely finishing"; this makes it "stats always; board only above the threshold". Addendum recorded.

