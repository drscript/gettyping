# Design the Speed Test & Practice session loop

Type: grilling
Status: resolved
Assignee: Claude

## Question

[05-prototype-weak-key-generation.md](./05-prototype-weak-key-generation.md) settled **how a single Practice Exercise is generated** (weakness score, word-bank vs. bigram modes, the aggressiveness knob) and [10-score-integrity.md](./10-score-integrity.md) moved that generation server-side. [09-db-schema.md](./09-db-schema.md) made generated Exercises ephemeral, with a nullable `exercise_id` so Attempts on them still persist.

What none of them specify is **the shape of the Track itself** — what a Player actually does across a sitting, as opposed to within one Exercise.

Open decisions: After the Speed Test reports a result, what happens next — is a Practice Exercise served immediately, or does the Player choose to start practising? Is practice a continuous stream (finish one, the next is generated), a fixed-size set (a "session" of N exercises with an end and a summary), or strictly one-at-a-time-on-request? Each implies a different screen after an Attempt and a different sense of when you're "done."

Is the Speed Test **retakeable**, and what does retaking mean for the Weak-key Profile — reseed it, or fold in as another Attempt like any other? ([09](./09-db-schema.md) has the Profile aggregating every Attempt on both Tracks, which suggests fold-in, but a Player retaking the diagnostic after months of improvement plausibly wants a fresh read rather than an average with their old self.)

Must a Player take the Speed Test **before** practice is available, or can they skip straight to practice? The Speed Test's stated job in [CONTEXT.md](../../CONTEXT.md) is to "seed their Weak-key Profile before any targeted practice is generated," which implies a gate — but [05](./05-prototype-weak-key-generation.md) requires 3+ samples per key before a weakness score is trusted, so one Speed Test may not seed enough anyway, and the behaviour with a thin or empty Profile is undefined.

Finally: the Speed Test is a single seeded Exercise row with a real Leaderboard, while Practice Exercises are ephemeral and have none. So a Player's *only* competitive surface on this Track is the Speed Test itself — worth confirming that's intended rather than accidental, given Leaderboards are the app's stated competitive hook.

This is the other half of the destination's "user flows for both Tracks."

## Answer

### Entry: the Speed Test is a prerequisite

Practice is unavailable until the Speed Test has been taken once. [CONTEXT.md](../../CONTEXT.md) already defines the Speed Test as the diagnostic "used to seed their Weak-key Profile **before any targeted practice is generated**" — this confirms the domain vocabulary rather than inventing a rule. And [0003-adaptive-exercise-generation.md](../../../docs/adr/0003-adaptive-exercise-generation.md) explicitly rejected a fixed exercise set because it "doesn't meaningfully help someone improve faster than generic typing practice would" — which is exactly what a cold-profile fallback would have to serve. "Adaptive practice" against an empty Profile is random text wearing the label.

The cost is one ~1–2 minute Exercise that is the Track's headline feature, not a chore standing in front of it.

**On the destination's word "ungated":** this is a *sequencing* requirement, not a pass/fail gate. There is no score to beat and nothing to fail — the contrast the destination draws with Learn's accuracy thresholds holds intact.

**This does not eliminate the cold-start problem, only bounds it.** [05-prototype-weak-key-generation.md](./05-prototype-weak-key-generation.md) requires 3+ samples per key before a weakness score is trusted, and a single Speed Test will not clear that bar for rare keys — q, z, x, j may take zero samples. Generation must cope with partially-unknown keys as the *normal* post-Test state, not an edge case.

### After the Test: the result screen routes onward

The Speed Test is fixed content with a real Leaderboard, so completing it triggers the full stats-and-Leaderboard reveal ([06-prototype-visual-design.md](./06-prototype-visual-design.md)). That screen gains a **dominant "practise your weak keys" CTA**, with [11-first-run-onboarding.md](./11-first-run-onboarding.md)'s sub-floor "start from the beginning instead?" offer as the conditional secondary.

Auto-serving the first Practice Exercise was rejected: it spends the reveal 06 deliberately built as the reward, dropping the Player into fresh text while they are still reading their WPM. Returning to the home screen was rejected as the opposite failure — a navigation hop inserted between the diagnostic and the thing the diagnostic exists to feed.

Both of the Track's exit routes now sit in one predictable place, mirroring 11's home-screen pattern of one dominant continue with alternatives clearly subordinate.

### The loop: Player-paced, with a real end

After each Practice Exercise, a **compact result** — stats only, since these Exercises are ephemeral and carry no Leaderboard ([09-db-schema.md](./09-db-schema.md), reaffirmed by 13's fixed-vs-generated rule) — with **"next" as the dominant CTA and "finish" subordinate**.

Finishing produces a **session summary showing how the Weak-key Profile moved**: the keys the Player came in weakest on, and which have dropped off the list.

The summary is the substance of this decision, not decoration. ADR 0003 justified building adaptive generation on the promise that targeted practice helps a Player improve faster than generic typing — but nothing in the spec ever **showed the Player that working**. The Profile shifted silently in a table they never see. This gives that payoff a surface, and it fits the pedagogy research's principle of rewards "tightly coupled to typing progress itself" rather than disconnected prizes: the reward here is literally the evidence of progress.

Rejected: a **fixed session of N exercises** — N is arbitrary, annoying both the Player who wanted three and the one who wanted forty, and it would become a fourth playtest-tuned number in the map's fog. Also rejected: **endless auto-advance**, which is frictionless but never tells a Player they accomplished anything; they leave by closing the tab.

**Implementation note — a "session" is a client-side grouping, not a modelled entity.** The summary needs a before/after on the Profile, which tempts a `sessions` table. It doesn't need one: snapshot the top weak keys when practice begins, diff against the current Profile at finish. No schema change.

### The Weak-key Profile becomes recency-weighted

Retaking the Speed Test is permitted and is **an ordinary Attempt** — no special case, exactly as 09 point 4 already says. Pulling on the retake question, though, exposed a defect that was never about retakes.

**As specified, the Profile never forgets.** 05 stores per (Player, key) an attempt count, an error count, and cumulative latency; 09 point 4 aggregates every Attempt on both Tracks into them. Those are lifetime totals, so a Player who fumbled `q` badly in week one carries those errors permanently — after a few thousand attempts, recent performance barely moves the number. **The Player who has genuinely fixed `q` keeps being served `q` practice**, and the Profile grows *less* responsive precisely as they improve. That undermines the capability ADR 0003 built the Track for.

**Resolved: decay the counters on write.** Multiply the stored `attempts` / `errors` / `totalLatencyMs` by a factor below 1 before folding in each new sample, giving exponentially-weighted statistics.

Resetting the Profile on retake was rejected as crude and perverse: it discards all practice data — the bulk of the signal, since a Player does far more practice Attempts than Speed Tests — leaving the Profile at its *worst* immediately after the diagnostic meant to sharpen it.

Costs, recorded rather than buried:
- **The decay factor is another tuned constant**, joining the fog alongside the aggressiveness knob, the Speed Test floor, and the failure count.
- **05's "3+ samples" becomes a weighted threshold** rather than a clean integer count, since `attempts` is no longer an integer.
- **Free structurally** — same three stored values, no schema change. Only the arithmetic on write differs.

Addendum recorded on 05.

### One Leaderboard on this Track, and it is immutable

The Track has exactly one Leaderboard — the Speed Test's — while Learn has twenty-one. **Intended and deliberate**, now stated rather than left as a side-effect of the schema.

Giving Practice a competitive surface is incoherent on inspection: a Leaderboard ranks Players against each other on *the same text*, and Practice Exercises are generated uniquely per Player from their own weaknesses. Ranking them would compare a Player targeting `q` and `z` against one targeting `e` and `t` — measuring nothing. Seeding additional fixed Exercises for more boards invents content-authoring work the map has repeatedly ruled out.

Two consequences worth recording:

**The Speed Test board is the app's de facto flagship.** [0002-per-exercise-leaderboards.md](../../../docs/adr/0002-per-exercise-leaderboards.md) refused a global Leaderboard in favour of per-Exercise ones — but one shared text taken by every Player of this Track, ranked by net WPM, is functionally the closest thing to a global board the app will ever have. Named here so a future reader doesn't "add the missing global leaderboard" and re-litigate 0002.

**Therefore the Speed Test's text is immutable once live.** Its Leaderboard's meaning depends on every ranked Player having typed the same thing. Editing that Exercise's `content` later would silently leave old and new Scores incomparable while still ranked together. If the text ever needs to change it must be a **new Exercise row with a fresh board**, never an edit to the existing one.
