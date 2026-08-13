# When the Lead-in is offered

Type: grilling
Status: resolved
Blocked by: 01
Part of: learn-generated-practice map

## Question

When does a Player see a Lead-in? Always on every Stage, only when earlier keys are weak, or both depending on Stage? Is it skippable? Does a good Lead-in move the 90% gate or replace the Attempt? How does it sit next to Finger stretch — same card, same trigger, or a different moment? Does replaying a cleared Stage still get one?

## Answer

**Skippable, never a bypass, never the gate.** The gated Exercise is the Stage. The Lead-in is an optional prelude on the way to it. Skipping it must be the obvious, unpunished path — the dominant CTA starts the Exercise. Taking it does not unlock the next Stage, does not count as an Attempt, does not change the 90% bar, and does not rewrite the Exercise text. A child who always skips is playing today's app. A child who always takes it is reviewing, then facing the same gate as everyone else.

Rejected: making it required (a second gate in front of the gate, and a five-year-old's first extra tap on every Stage). Rejected: treating a high-accuracy Lead-in as clearing the Stage (that is a bypass wearing review clothing). Rejected: lowering or skipping the 90% bar after a Lead-in (the standard would mean different things for different Players, which [04-curriculum-outline.md](../../gettyping-spec/issues/04-curriculum-outline.md) and [13](../../gettyping-spec/issues/13-gate-failure-flow.md) both refused).

### Offer rules

**Stage 1: never.** The gated Exercise is already letter runs on F and J. A generated letters Lead-in in front of it is the same activity twice. Stuckness on Stage 1 is Finger stretch's job (failure card, block grammar on those two keys). An empty-profile Stage 1 has nothing earlier to review.

**Stage 2–4: when any previously-taught key (Stages 1..n−1) has a weakness score.** A weakness score exists only past the weighted 3-sample floor (`weakness !== null`). There is no second "how weak is weak" cutoff — that would be a new playtest-tuned number this destination does not need. Relative weakness is a *generation* concern (ticket 03), not an *offer* concern. If every previously-taught key is below the floor (adult-overridden into Stage 2 having never typed Stage 1, or decay has forgotten them), there is no Lead-in: there is nothing honest to review, and Stage 2–4 still have no English sentences.

This is "has a weakness score", not "is currently one of the weakest keys in the whole Profile". After clearing Stage 1, F and J will almost always have scores, so Stage 2 will almost always offer a Lead-in. That is the point: review the keys just taught, as letters, before the new Stage's block-grammar Exercise. Suggestion 3's "still weak" is served by targeting inside the Lead-in, not by hiding the card from a Player whose earlier keys merely exist in the Profile.

**Stage 5+: always, even with an empty Profile.** Stage 5 is where `a` arrives and the Corpus grows `sentences`. The pedagogical hole this destination exists to fill — words and sentences before the gated letter-run Exercise — is now available, and it does not depend on the Profile being populated. An adult-overridden Player landing on Stage 5 with no samples still gets sentences drawn uniformly from what is playable on the cumulative key set. A Player whose earlier keys have all dropped below the floor still gets sentences. Targeting still applies when scores exist (ticket 03).

Rejected: always on every Stage including 1 (duplicates Stage 1, promises words the Corpus cannot yet form on 2–4). Rejected: adaptive-only on 5+ (a Player with a quiet Profile would never see sentences before the gate, which is the whole Stage-5 reason). Rejected: always on 2–4 regardless of Profile (serving letter-run review of keys the Player has never typed, or that decay has dropped below the floor, is noise in front of the Exercise).

### Finger stretch stays on the failure card

Two moments, two offers, never one card:

| | Lead-in | Finger stretch |
|---|---|---|
| When | Stage start, before the Attempt | Gate-failure card, after `stretchOfferCount` consecutive misses |
| Why | Review earlier keys; from Stage 5, type words/sentences | Unstick a Player who is failing *this* Stage's new keys |
| Grammar | Practice Corpus | Authored block grammar |
| Skip | Dominant CTA is the gated Exercise | Dominant CTA is "try again" (identical Exercise) |

Rejected: showing a Lead-in on the failure card (collides with Finger stretch, and Corpus sentences are the wrong tool for "you just failed `aaaa ;;;; a;a;…`"). Rejected: replacing Finger stretch with a Lead-in (failure needs the Stage's own key grammar, not a Corpus draw). Rejected: offering both on the same card (two optional practices, one obvious retry, is a menu).

After a failed Attempt, **Try again starts the gated Exercise directly** — no Lead-in interstitial. The Player is in the retry loop; the identical-text retry from [13](../../gettyping-spec/issues/13-gate-failure-flow.md) must stay one tap. Finger stretch's **Try the Stage** likewise returns to the gated Exercise, not to a Lead-in card: they already warmed up. Leaving the Stage and coming back is a new start, and the offer rules apply again.

A Lead-in does not touch `consecutiveStageFailures`. Same reason as Finger stretch: banking review against the streak would defer the adult line; resetting it would retreat the adult line when it is most needed.

### Replay

A cleared Stage, replayed from the Stage list, follows the same offer rules as a first visit. The gate is already satisfied; the Lead-in is still optional review before a Leaderboard-bearing replay. It does not re-lock, does not hide the ordinary result screen, and does not become a failure path. Stage 1 replay still has no Lead-in.
