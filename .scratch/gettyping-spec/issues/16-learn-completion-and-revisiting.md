# Design Learn-track completion and Stage revisiting

Type: grilling
Status: resolved
Assignee: Claude

## Question

Every Learn flow specified so far moves in one direction: clear a Stage, unlock the next. Two things outside that forward march are undefined, and the first is load-bearing on the data model.

**Can a Player re-attempt a Stage they have already cleared?** [13-gate-failure-flow.md](./13-gate-failure-flow.md) settled retrying after a *failure*, but nothing covers returning to a cleared Stage. The Leaderboard design assumes they can: [09-db-schema.md](./09-db-schema.md)'s query picks each Player's **best** Score via `ROW_NUMBER() OVER (PARTITION BY player_id ...)`, which is meaningless if every Player has exactly one Score per Exercise. So the schema already implies repeat Attempts while no flow describes reaching them. If revisiting is in, the open decisions are: how a Player navigates to a cleared Stage (the home screen from [11-first-run-onboarding.md](./11-first-run-onboarding.md) currently shows only a single "continue" CTA — is there a Stage list?), whether a *worse* repeat Score is recorded or discarded, and whether re-clearing changes anything beyond a possible Leaderboard improvement.

**What happens when a Player clears Stage 21?** The Learn Track has no terminal state. [04-curriculum-outline.md](./04-curriculum-outline.md) fixes 21 Stages; nothing says what the twenty-first completion looks like, whether it differs from any other Stage clear, or what the home screen shows afterwards — its dominant "continue" CTA has nothing left to continue to, and its progress display reads "21 of 21" indefinitely.

[14-practice-loop.md](./14-practice-loop.md) sharpened this second question rather than answering it: the Speed Test is now a one-time prerequisite for Practice, so a Learn graduate who wants to keep typing has exactly one onward path — take the Speed Test, then practise. Whether the app surfaces that route at completion, mentions it once, or leaves the Player to find the other Track on their own is undecided. Related: whether a graduate's home screen re-purposes itself toward Speed Test & Practice, or keeps presenting Learn with everything cleared.

Both halves sit inside the destination's "user flows for both Tracks."

## Answer

### Cleared Stages are freely replayable

Any cleared Stage can be re-attempted at any time, with no cooldown and no cap.

This is the option [09-db-schema.md](./09-db-schema.md) already assumed. Its Leaderboard query picks each Player's best Score through `ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY net_wpm DESC, id ASC)`; with one Score per Player per Exercise that window function is dead code, and the whole "your best Score competes" definition in [CONTEXT.md](../../CONTEXT.md) collapses into "your only Score competes". Choosing forward-only would have meant going back and simplifying the Learn half of that query to a plain `SELECT`, and accepting that a Learn Leaderboard is a lottery on first-contact performance.

The Player-facing argument is stronger still. [15-leaderboard-display-rules.md](./15-leaderboard-display-rules.md) appends an out-of-top-10 Player's own row with their true rank precisely because a beginner's first Score sits far below ten strangers, and it carries a personal-best marker because that is what motivates someone at #47. Without replay, #47 is not a starting position — it is a permanent one, and the personal-best marker can never move. Replay is what makes 15's design mean anything on the Learn Track.

**Deferring replay until after Stage 21** was rejected for the same reason: it sets a beginner's permanent Leaderboard row on first contact and leaves it uncorrectable for the weeks it takes to reach the end.

### Navigation: a Stage list on the home screen

[11-first-run-onboarding.md](./11-first-run-onboarding.md)'s returning-Player home screen grows a visual list of all 21 Stages — cleared, current, locked — beneath its dominant continue CTA. Every Stage becomes directly addressable, and the progress display stops being a decorative "7 of 21" and becomes the thing the Player taps.

11 chose a home screen over deep-linking straight into the next Stage precisely because the app needs one surface for everything that is not typing — mis-pick recovery, the grown-ups route, the editable Nickname from [07-nickname-uniqueness.md](./07-nickname-uniqueness.md), the "Not you?" switch — and rejected "inventing five separate entry points". Putting the Stage list on a *second* screen would have been the sixth. It goes on the home screen for the same reason everything else did.

The list must read for a five-year-old: icon and colour states per Stage, not a table of rows and numbers, and the three states (cleared / current / locked) distinguished by shape as well as colour under [06-prototype-visual-design.md](./06-prototype-visual-design.md)'s never-colour-alone rule. A visible locked Stage is motivation in its own right — the child can see there is more. Accepted cost: this is the app's first screen that scrolls.

**Replay only from the Stage-clear result screen** was rejected. An "again?" button beside "next Stage" makes a Stage unreachable the moment the Player moves past it, so replay would only ever mean *immediately*, and yesterday's Stage 3 would be gone for good — which undoes the climb-the-Leaderboard case above.

### Every Attempt is recorded, worse ones included

A replay that scores below the Player's existing best still writes an ordinary `scores` row. No suppression, no discard.

09 and [10-score-integrity.md](./10-score-integrity.md) already separate *recorded* from *ranked*: the server derives aggregates from every accepted keystroke stream, the stream feeds the Weak-key Profile, and the `ROW_NUMBER()` partition ensures only the best Score ever reaches a Leaderboard. Nothing new is required — the concepts were in place before the flow existed.

Discarding sub-best Attempts would throw away Weak-key Profile signal from exactly the runs where the Player struggled most, which are the runs the adaptive engine most wants; [14-practice-loop.md](./14-practice-loop.md) made the Profile recency-weighted specifically so that recent evidence dominates, and silently dropping the worst recent evidence would corrupt it. Keeping the row but hiding it from personal history was also rejected: it turns history into a highlight reel that cannot explain itself, and it erases the ordinary experience of a bad day.

The Player is protected by presentation, not by deletion — the reveal shows this run against the personal best from 15, and that best never moves backwards.

### A sub-gate replay is not a failure: the reveal is keyed to the Stage

**[13-gate-failure-flow.md](./13-gate-failure-flow.md)'s reveal condition is refined.** 13 said the Leaderboard is revealed on *clearing*, not merely finishing. Replay makes that ambiguous, so it is restated precisely: **the Leaderboard is revealed when the Stage is cleared — by this Attempt or by any earlier one.** A cleared Stage always reveals.

So a Player replaying a cleared Stage at 84% sees the ordinary result screen and the ordinary Leaderboard. Their sub-gate Score is not gate-clearing, so 13's Learn Leaderboard predicate keeps it off the board on its own; their existing best still holds their row, and nothing appears to have gone backwards. No failure state, no re-locking of a cleared Stage, and none of the retry-and-eventually-override machinery, all of which exists to route a Player who has *not yet* passed.

Showing 13's failure state on a sub-gate replay would have been one consistent rule at the price of a punitive screen for someone who already passed. Withholding the Leaderboard for that one run keeps 13's wording literal but makes the reveal flicker between replays of the same Stage, which reads as a bug rather than a rule.

### Stage 21 ends on its own screen, with the Speed Test as its CTA

Clearing Stage 21 does not clear like Stage 20. It earns a distinct completion screen: the whole 21-Stage arc acknowledged, one of [12-audio-design.md](./12-audio-design.md)'s rare event moments, and a dominant CTA into the Speed Test.

This makes the app's two Track hand-offs the same shape. 14 gave the Speed Test's result screen a dominant "practise your weak keys" CTA into Practice; Learn's completion screen now hands off into the Speed Test the same way. 11 had already established that the app offers the other Track by intent rather than leaving a Player to find it, in its mis-pick recovery path — this is that principle at the one moment it is most obviously right, since 14 made the Speed Test a one-time prerequisite and a graduate therefore has exactly one onward path.

Treating the twenty-first clear as unremarkable was rejected: 21 gated Stages is the longest commitment the app asks of anyone, and its end is the single moment a child is proudest. Celebrating without an onward CTA was rejected for leaving the graduate's home screen pointing at nothing.

### The graduate's home screen needs no new rule

11 already specifies the dominant CTA as "next unlocked Stage, **or the Speed Test**". A graduate simply has no first branch left, so the CTA falls through to the second — the Speed Test, and after that Practice, per 14's sequencing. No new rule, no special-cased graduate screen.

Learn stays present but demoted: the Stage list below, showing 21 of 21 cleared, every Stage replayable. The progress display stops being a countdown and becomes a record.

Promoting "replay a Stage" to the dominant CTA would point the graduate's most prominent affordance at content they have mastered while burying the only new thing left to offer them. Two co-equal CTAs would break 11's deliberate one-dominant-one-secondary structure, and the undirected screen that results is hardest on the youngest Players.

### `stage_unlocks` re-read: "this Stage is resolved", not "the next one is available"

13's override unlocks *the next* Stage. On Stage 21 there is no next Stage, so as specified the override had nothing to grant and a child stuck on the final Stage sat in exactly the infinite loop 13 called a wall — after clearing twenty.

**Resolved by changing what a `stage_unlocks` row means.** A row on `(player_id, stage_id)` now reads "**Stage *n* counts as resolved for this Player**", not "Stage *n+1* is available". Stage *n+1* being available is then derived the same way it is for a gate-clearing Score — Stage *n* is resolved — and the last Stage needs no special case at all: an override row on Stage 21 resolves Stage 21, which is graduation.

- **Same table, same columns.** `(player_id, stage_id, granted_at)` is unchanged; only its interpretation moves. Recorded as a semantic addendum on 09.
- **No dangling reference.** The alternative required a `stage_unlocks` row pointing at a Stage 22 that does not exist, breaking the FK to `stages` for the sake of one edge case.
- **Arguably the better model regardless.** An adult acting on "my child is stuck on *this* Stage" grants against the Stage they are stuck on, not against its successor.

**The completion screen is identical whether reached by clearing or by override.** 13 made the override deliberately invisible to the child — adult-voiced, adult-routed, never a child-facing skip button — and a quieter "you were let through" completion screen would leak it straight back at the app's proudest moment. The celebration stays honest where it counts: 13's predicate still bars the sub-gate Score from Stage 21's Leaderboard, so the screen says *you finished*, never *you were fast*.

Suppressing the override line on Stage 21 was rejected as recreating the wall 13 refused, at the Stage where being stuck costs the most.

### Inherited, not decided here

- **Replays feed the Weak-key Profile** like any other Attempt — 09 has the Profile fed by both Tracks, 10 has it fed by every accepted keystroke stream, 14 made it recency-weighted. A Learn graduate replaying Stages therefore keeps their Profile current for the Speed Test & Practice Track they are being pointed at.
- **No new table or column anywhere.** The only data-model movement is the `stage_unlocks` semantic addendum above.

### Addenda raised elsewhere

- **09** — `stage_unlocks` re-read as "Stage *n* is resolved"; Stage-*n+1* availability derived from it.
- **13** — reveal condition restated as *the Stage is cleared*, not *this Attempt cleared it*; override semantics re-read as above and now valid on Stage 21.
- **11** — home screen grows the Stage list; its "next unlocked Stage, or the Speed Test" CTA rule covers graduates unchanged.
- **06** — Stage list states (cleared / current / locked) distinguished by shape as well as colour; reveal now conditional on Stage-cleared.
