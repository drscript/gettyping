# Design the Learn-track gate-failure and retry flow

Type: grilling
Status: resolved
Assignee: Claude

## Question

[04-curriculum-outline.md](./04-curriculum-outline.md) fixed the gate — a flat 90% accuracy threshold on each of the 21 Stages — and [09-db-schema.md](./09-db-schema.md) confirmed it's an application-level constant checked against `scores.accuracy`. But nothing anywhere specifies **what happens when a Player misses it**, which is the single most common non-happy-path in the Track aimed at five-year-olds.

Open decisions: What does a Player see immediately after an Attempt that scores below 90% — the same Leaderboard-and-stats reveal as a pass with different framing, or a distinct screen? Does retrying replay the *identical* Exercise text, or re-draw from the Stage's cumulative content ([04](./04-curriculum-outline.md) specifies content is drawn from all keys taught in Stages 1..*n*, so re-drawing is possible)? Is there any limit on retries, and is there any bypass at all — because a child who cannot clear Stage 3 after fifteen attempts currently has no path forward and the app's answer is an infinite loop, which is how a beginner quits for good.

Related but distinct: does repeated failure change what the *next* Attempt looks like — a shorter Exercise, a narrower key set, a hint — or is the retry always identical in difficulty? [05-prototype-weak-key-generation.md](./05-prototype-weak-key-generation.md) built adaptive generation for the other Track, and the Weak-key Profile is fed by Learn Attempts too ([09](./09-db-schema.md) point 4), so the machinery to adapt a retry already exists; whether Learn should *use* it is undecided.

Also unsettled: whether a near-miss is treated differently from a heavy miss, and how failure interacts with the [12-audio-design.md](./12-audio-design.md) event sounds (which currently fire on "Stage cleared" — a failed Attempt's audio, if any, is unspecified).

This is squarely inside the destination's "user flows for both Tracks."

## Answer

### The failure state: no Leaderboard

A distinct screen leading with the accuracy achieved against the 90% target and a dominant "try again". The Score still persists and still counts for personal history.

**This refines [06-prototype-visual-design.md](./06-prototype-visual-design.md)**, which said the Leaderboard is "revealed only on completing the Exercise". A failed Attempt *is* a completed Exercise — every character was typed — so as written, 06 reveals the Leaderboard on failure. Corrected: **the Leaderboard is revealed on *clearing* the Exercise, not merely finishing it.**

The reason is specific to this cohort rather than general politeness. [research/typing-pedagogy.md](../research/typing-pedagogy.md) is explicit that young learners should get "narrative/character-based framing over competitive/leaderboard mechanics", with rewards "tightly coupled to typing progress itself". Showing a five-year-old who scored 62% their rank beneath ten strangers is precisely the mechanic the research warns off, delivered at the worst possible moment. Showing the rank *and* saying "not yet" was rejected as the worst of both: the discouragement of the full reveal, with the single clear next action muddied.

### The retry: identical text

The same string, every time. No re-draw from the Stage's cumulative key set, even though [04-curriculum-outline.md](./04-curriculum-outline.md) describes content as drawn from Stages 1..*n* and [10-score-integrity.md](./10-score-integrity.md) already put a server-side generator in the codebase for Practice.

This makes explicit a pattern that was already implicit across the spec and should be stated as a rule:

> **Fixed content ⟺ has a Leaderboard. Generated content ⟺ has no Leaderboard.**

Practice Exercises are generated and deliberately carry no Leaderboard ([09-db-schema.md](./09-db-schema.md)); the Speed Test is a single seeded row and carries one. If Learn Stages re-drew their text per Attempt, a Stage 6 Leaderboard would rank Players who each typed *different strings* — quietly gutting the per-Exercise Leaderboard that [0002-per-exercise-leaderboards.md](../../../docs/adr/0002-per-exercise-leaderboards.md) built the competitive model on. It also matches the schema as it stands: 09 seeds 22 Exercise rows each with one `content` column.

Accepted cost: a child retrying six times is partly reciting by the end. Tolerable for this cohort — repetition drilling is exactly Read, Write & Type's model, the motor pattern still forms, and 04's cumulative recycling resurfaces those keys in unfamiliar combinations in later Stages.

### No escalating support on retry

The retry is identical in every respect — no hint layer, no slow mode, no highlighting of personally-weak keys.

The reason only became visible once 06 was settled: **the maximum hint is already permanently on.** 06 put an on-screen keyboard on both Tracks, always visible, always highlighting the next expected key, from the first keystroke of Stage 1 for every Player. There is nothing to escalate *to* — the app has already given away which key comes next, by default, to everyone.

Weak-key highlighting was the interesting version and was rejected twice over: [05-prototype-weak-key-generation.md](./05-prototype-weak-key-generation.md) needs 3+ samples per key before a weakness score is trusted, so it would misfire for exactly the brand-new Player most likely to be stuck, and it would add a second competing visual signal to a prompt 06 deliberately kept quiet.

There is also a cleaner reading of what "stuck" means: if a child cannot reach 90% *while being shown the correct key before every keystroke*, the deficit is motor control or attention, not information. The adult override below is the honest answer to that; a cleverer hint is not.

### The stuck Player: an adult-granted override

After **N consecutive failures on the same Stage**, the failure screen gains a quiet, adult-voiced line — the same deliberately-not-kid-facing treatment [11-first-run-onboarding.md](./11-first-run-onboarding.md) gave the "For grown-ups" affordance — pointing to the grown-ups route, where an adult can unlock the next Stage for this Player.

**The child never sees a skip button.** A child offered an escape from effort takes it immediately and every time, and arrives at Stage 21 having learned nothing; offering a five-year-old a skip is offering them the button they will always press. Equally rejected: lowering the bar after repeated failure, which contradicts 04's deliberate choice of a flat gate over the research's suggested ratchet, and does something worse than move a number — it makes "cleared Stage 6" mean different things for different Players, corrupting the only progress signal the Learn Track has.

The judgment "my child is stuck and miserable, let them move on" needs context the app doesn't have and is genuinely an adult's to make. 11 already established both the surface for adult decisions and the principle that adult-facing things are styled so children skate past them.

Two costs recorded rather than buried:

- **This requires a schema change** — the first in several tickets. Stage unlock is currently *derived* from `scores` (any Score on Stage *n* at ≥90%), and an adult override cannot be derived from a Score that never happened. It needs storage: a `stage_unlocks` table keyed on `(player_id, stage_id)` with a `granted_at`. Addendum recorded on 09.
- **Discoverability is imperfect.** A frustrated child may be alone with no adult to fetch. This design does not solve that; it declines to solve it by handing the child a skip button.

Doing nothing at all (unlimited retries, no bypass ever) was rejected as the option that isn't a gate but a wall — the app's answer to a stuck beginner would be an infinite loop, which is how they quit permanently.

### Tone: no failure sound, no tiering

**No event sound on failure.** [12-audio-design.md](./12-audio-design.md) fires event sounds on wins only — Stage cleared, gate passed, Leaderboard entry earned. Three of its own constraints argue against a failure sting: audio must be "informational, not punitive"; the error ticks already fired during the Attempt, so a summary sound piles on; and the redundancy invariant means it would add no information the screen lacks. The decisive argument is distributional — **a failure sound fires most often for the Player having the worst time.** 12 made the error tick self-attenuating so the app grows quieter as a Player improves; a failure sting inverts that exactly, growing louder the more a child struggles.

**One failure state, not tiered by severity.** Showing the accuracy and the target together — "89% — you need 90%" — states proximity more precisely than any near-miss tier, and avoids designing, specifying, and thresholding a second state for something the number already says.

### Learn Leaderboards require a gate-clearing Score

A sub-gate Attempt produces a perfectly valid Score, and gate failure does *not* set `leaderboard_eligible = 0` — 10 reserved that flag for plausibility failures. So as previously specified, a Player typing Stage 6 fast and sloppy at 85% accuracy could top Stage 6's Leaderboard **having never cleared Stage 6**. Net WPM discounts errors ([08-scoring-formulas.md](./08-scoring-formulas.md)), but penalised is not excluded: a fast 85% run can still beat a careful slow one.

**Resolved: only Attempts at ≥90% accuracy rank on a Learn Exercise's Leaderboard.** A Stage's board is the record of best performance *on that Stage*, and a run that missed the Stage's own published standard is not a qualifying performance. A child looking at Stage 6's board should be looking at Players who passed Stage 6. This creates a two-rule system only in the sense that Learn has a gate and Speed Test doesn't — already true.

**Implemented as a predicate on the Learn Leaderboard query, never by setting `leaderboard_eligible = 0`.** That column means "implausible, possibly tampered" and doubles as the manual moderation lever; overloading it to also mean "typed sloppily but honestly" would conflate a suspected cheat with an ordinary struggling beginner and poison the one column an operator reaches for when investigating a bogus entry.

Cross-referenced on [15-leaderboard-display-rules.md](./15-leaderboard-display-rules.md), which is still open and inherits this rather than re-litigating it.

### Logged rather than decided

**N** — how many consecutive failures before the adult line appears. A playtest-tuned number, the same shape as the targeting-aggressiveness knob and the Speed Test floor already in the map's fog.
