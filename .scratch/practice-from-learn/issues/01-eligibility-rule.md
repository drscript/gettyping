# Eligibility rule (what unlocks Practice)

Type: grilling
Status: resolved

## Question

[14-practice-loop.md](../../gettyping-spec/issues/14-practice-loop.md) made the Speed Test a one-time **prerequisite** for Practice: no Score on exercise 22, no generated Exercises. That was right for a Player who skipped Learn — an empty Weak-key Profile cannot target anything honest, and ADR 0003 refused a cold-profile fallback because it would be random text wearing the adaptive label.

It is now wrong for a mid-curriculum Learn Player. Learn Attempts already fold into the same Weak-key Profile ([23-weak-key-profile.md](../../gettyping-spec/issues/23-weak-key-profile.md)). `cumulativeKeySet` already restricts generation to keys taught so far. The Player has been taught, has been measured, and still hits `GET /api/attempts/practice` 403 and a client bounce to `/speed-test`.

What should unlock Practice? Must the Speed Test remain the only door? Does a failing Stage Attempt count? Does a Finger stretch? Does an adult override with no Score?

## Answer

### Practice unlocks on a Learn Score or a Speed Test Score

A Player may start Practice when they hold **at least one Learn Score** or **at least one Speed Test Score**.

That is the whole rule. It is sequencing, not a pass/fail gate — there is still no score to beat and nothing to fail, so Speed Test & Practice remains ungated in the sense 14 used that word.

**Learn Score** means a `scores` row whose Exercise is on the Learn Track. Accuracy, Net WPM, `leaderboard_eligible`, and whether the Stage cleared do not matter. Completing an Attempt produces a Score; that is enough. A sub-gate Stage 1 Attempt unlocks Practice. A plausibility-flagged Learn Score unlocks Practice. Both already fold into the Weak-key Profile, so the targeting engine has something to work with.

**Speed Test Score** means a `scores` row whose Exercise is the Speed Test. This is today's door, kept. A Player who skipped Learn still takes the diagnostic first.

**Nickname-only Players with zero Attempts stay out.** They have no Profile and no taught-key constraint that reflects typing they have done. Serving them Practice would be the cold-start 14 and ADR 0003 already refused. They 403 and the client sends them to `/speed-test` — that is the diagnostic door for someone who skipped Learn.

### What does not unlock Practice

- **A Finger stretch.** It is not an Exercise, writes no Score, and counts for nothing ([CONTEXT.md](../../../CONTEXT.md)). Stretch may have folded keystrokes into the Profile, but eligibility is Score-shaped on purpose: the same unit the rest of the app uses for "this Player has typed this Exercise." In practice a stretch is only offered after consecutive Stage failures, so a stretch-capable Player already has Learn Scores.
- **An adult override with no Score.** `stage_unlocks` resolves a Stage; it is not an Attempt. A parent who resolves Stage 1 before the child types has not given the Profile anything to target. The child remains ineligible until they complete an Attempt (any Learn Exercise, or the Speed Test).
- **A Practice Score.** Circular, and unreachable: Practice Scores have a null `exercise_id` and can only exist after eligibility already held.

Implementation may treat the rule as "this Player has a Score whose `exercise_id` is not null" — Learn Exercises and the Speed Test are the only seeded Exercises, and generated Practice is the only Score with a null `exercise_id`. Prefer joining `exercises.track` (`learn` or `speed_test`) over hardcoding exercise id 22.

### Why not "cleared a Stage" or "finished Learn"

Requiring a cleared Stage would lock out the stuck Player — the person whose Profile is *most* worth targeting — until they hit 90%. Requiring Stage 21 would keep today's problem for twenty Stages. The product-owner stance is one Learn Score, and that is also the honest reading of "keys they have actually been taught": a Stage 1 Attempt, even a failing one, has already taught F and J as the current Stage, and `cumulativeKeySet` already includes current `keysTaught`.

### Dual-track Players

A Player who took the Speed Test and also Learn is unchanged. Both doors already work today once exercise 22 has a Score; after this change either door is sufficient.

### Amends 14; does not reopen ADR 0003

14's sentence "Practice is unavailable until the Speed Test has been taken once" is amended to the OR rule above. The rest of 14 stands: Player-paced loop, session summary, recency-weighted Profile, Speed Test retakeable as an ordinary Attempt, one Leaderboard on the Track (the Speed Test's), immutable Speed Test text.

ADR 0003 still generates Practice from the Weak-key Profile. This ticket only changes *who is allowed to ask* for a generated Exercise, not *how* one is generated.

### Rejected

- **Keep the Speed Test as the only door.** Contradicts the destination. A Learn Player already has a Profile.
- **Unlock on Weak-key Profile rows rather than Scores.** Stretch-only or partial writes would sneak in; Score is the domain unit for a completed Attempt.
- **Unlock on cookie presence / Nickname.** Cold start.
- **A new `practice_unlocked` flag or table.** Derived from Scores, same as Stage progression. No schema change.
