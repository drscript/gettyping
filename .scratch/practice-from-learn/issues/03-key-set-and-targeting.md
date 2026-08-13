# Key-set and targeting behaviour for Learn-only Players

Type: grilling
Status: resolved

## Question

If a Learn-only Player can enter Practice, what text can they be served? Ticket 14 bounded cold start by requiring the Speed Test; generation then coped with *partially*-unknown keys as the normal post-Test state. A Learn Player at Stage 3 has the opposite problem: their Profile and their taught keys are *narrow*, and serving the alphabet would ask them to type letters the curriculum has not taught.

Is the existing `cumulativeKeySet` enough, or does Practice from Learn need a new constraint, a new generation mode, or a change to the weakness formula?

## Answer

### Existing `cumulativeKeySet` is enough

No generation change. No formula change. No new key-set helper.

`src/lib/server/cumulative-key-set.ts` already:

- If Learn has **not** started (no Learn Score): the lowercase alphabet. A Speed-Test-only Player gets the full letter pool, which is what 14 assumed.
- If Learn **has** started (any Learn Score, including a failing Stage 1 Attempt): the union of `keysTaught` on every Stage whose state is `cleared` or `current`.

A Learn-only Player at Stage 3 has cleared 1–2 and current 3, so the set is `{f, j, g, h, d, k}`. Sentence-mode Corpus filtering and bigram adjacency already take that set as the pool. They cannot be served letters they have not been taught. That is the destination's example, and it already holds on main — the only reason tests have not shown it for Learn-*only* Players is that `GET /api/attempts/practice` 403s without exercise 22. [01](./01-eligibility-rule.md) removes that 403; this ticket does not touch the set.

"Learn started" is the same predicate as "has a Learn Score," so eligibility and the key set cannot disagree: a Player who just became eligible via a Stage 1 Attempt is also the Player whose set collapses from the alphabet to `{f, j}` (Stage 1 is current). A Speed-Test-only Player is eligible via the other disjunct and has not started Learn, so they keep the alphabet.

### Targeting is already fed by both Tracks

The Weak-key Profile already aggregates every accepted Attempt on both Tracks ([23](../../gettyping-spec/issues/23-weak-key-profile.md)). Learn-only Practice therefore targets keys that Player has actually mistyped or hesitated on, inside the taught set. Keys below the weighted three-sample floor still have no weakness score; generation already copes with that as the normal thin-profile state (14, 24). A Stage 1 Learn-only Player is a *narrow* thin profile, not an empty one.

Scoring formula unchanged: `weakness(key) = errorRate × 0.7 + latencyFactor × 0.3` past the floor. Decay unchanged. Aggressiveness knob unchanged.

### Modes, loop, Leaderboard rule unchanged

Sentences (Corpus-constrained) and Focused bigrams stay. Session summary still snapshots the top weak keys at start and diffs at finish, client-side, no session table. Generated Exercises still create no Exercise row and still have no Leaderboard — ranking Players who each typed different text still measures nothing (ADR 0002 + 0003, 14's "one Leaderboard on this Track").

### Rejected

- **A Learn-specific generator or a third mode.** The existing two modes plus the key set already do the job. A new mode would be a new architecture, and this map forbids a new ADR.
- **Full alphabet for Learn-only Players, on the grounds that Practice is "ungated."** Ungated means no pass/fail score. It does not mean "type keys we have not taught." That would violate the curriculum's cumulative contract ([04](../../gettyping-spec/issues/04-curriculum-outline.md)).
- **Changing `cumulativeKeySet` to cleared-only (drop current).** Stage 1 current is how a brand-new Learner is allowed to type F and J at all. Dropping current would give a failing-Stage-1 Player an empty set and 503 the generator.
- **Changing `cumulativeKeySet` to require a Speed Test before expanding to the alphabet.** Speed-Test-only Players already get the alphabet by the "Learn never started" branch. Do not break them.
- **Trusting the Profile without the key set**, on the grounds that untaught keys have no samples. A Speed Test mixed in later, or a stretch, can put mass on keys the current Stage has not taught; the set is the gate on *what can be generated*, not a guess about the Profile.

### Implementation consequence

[10](./10-practice-eligibility-from-learn-scores.md) must prove, through the HTTP seam, that a Learn-only Player (no Speed Test Score) at Stage 3 is served only taught keys. That assertion fails on current main because the request 403s. It is the proof that this ticket's "already enough" claim is load-bearing rather than hopeful. Do not rewrite `cumulative-key-set.ts` unless a test finds a real hole.
