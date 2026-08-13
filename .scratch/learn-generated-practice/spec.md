# Learn-side Lead-in — spec

Status: ready-for-agent

Synthesized from the wayfinder map at [map.md](./map.md) and its four resolved decision tickets in [issues/](./issues/). Every decision below has a ticket holding its full reasoning and its rejected alternatives; this document is the implementable summary, not the argument. Domain vocabulary is defined in [CONTEXT.md](../../CONTEXT.md) and is used strictly throughout — **Track, Stage, Exercise, Finger stretch, Speed Test, Attempt, Score, Player, Nickname, Leaderboard, Weak-key Profile, Corpus, Lead-in**.

Architectural decisions already recorded as ADRs: [0001 nickname-only identity](../../docs/adr/0001-nickname-only-identity.md), [0002 per-exercise leaderboards](../../docs/adr/0002-per-exercise-leaderboards.md), [0003 adaptive exercise generation](../../docs/adr/0003-adaptive-exercise-generation.md), [0004 sqlite/litestream](../../docs/adr/0004-single-vm-sqlite-litestream-deploy.md). This spec does not add an ADR. The Lead-in vs Exercise distinction is the existing rule **fixed content ⟺ Leaderboard, generated content ⟺ none**.

## Problem Statement

The Learn Track teaches a beginner one to three new keys per Stage and gates on a single fixed Exercise. That Exercise is letter-run / block grammar — `fff jjj fjf…` on Stage 1, and the same authored shape through Stage 21 — because its text is seeded, retried byte-identical, and ranked on a per-Exercise Leaderboard. Comparability requires that.

Pedagogy wanted something else *inside* a Stage: single keys → key pairs → words → sentences, with earlier weak keys recycled, not only drilled as runs of the new keys. The Practice Track already has that material: a Corpus of `letters` until Stage 5 (when `a` arrives) and `sentences` after, generated on demand, targeted from the Weak-key Profile. Learn never offers it before the gate. A Player meets words as a by-product of later Stages' letter runs, or by leaving Learn for Practice.

Finger stretch already generates no-Leaderboard practice on Learn, but only after repeated gate failure, and only in the authored block grammar. It unsticks a Player on *this* Stage's new keys. It does not give them words first, and it does not review earlier keys at the start of a Stage, which is when review would actually precede the Attempt.

Two product holes, one surface: generated, skippable, no-Leaderboard practice on the Learn Stage route, before the gated Exercise, without redrawing that Exercise.

## Solution

A **Lead-in** is offered on the same Learn Stage route as a card before the Attempt.

It is generated on the server from the existing Practice Corpus (sentence-mode: `sentences` when any entry is playable on this Stage's cumulative key set, otherwise `letters`). It targets Weak-key Profile scores for keys in that cumulative set, using the existing `targetingAggressiveness` knob, or draws uniformly when no such score exists. One run is one generated string (Practice's six-entry draw). Completing it writes no Score, folds the Weak-key Profile, and returns the Player to a card whose dominant action is the gated Exercise.

It is not an Exercise (an Exercise has a Leaderboard; this is generated). It is not a Finger stretch (that name, that grammar, and that failure-card moment stay). It is not an Attempt (an Attempt is a completed run through an Exercise, producing a Score). Child-facing copy does not say "Lead-in": Stage 5+ "Try some words first"; Stage 2–4 "Try these first".

Offer rules:

- **Stage 1: never.** The Exercise is already letter runs; Finger stretch covers stuckness.
- **Stage 2–4: when any previously-taught key (Stages 1..n−1) has a weakness score** (past the weighted 3-sample floor).
- **Stage 5+: always**, even with an empty Profile, because sentences exist.

The gated Exercise, the 90% bar, identical-text retry, Finger stretch, adult override, and every Leaderboard are unchanged. Skipping a Lead-in is the dominant path and is today's app.

## User Stories

### Type and skip

1. As a beginner on a Learn Stage, I want an optional chance to try generated practice before the gated Exercise, so that I can review earlier keys and (from Stage 5) type words and sentences without the Stage's Leaderboard depending on that text.
2. As a beginner, I want the Stage's own Exercise to stay the obvious next thing, so that a prelude cannot hide the gate I actually have to clear.
3. As a beginner who does not want extra practice, I want to skip the Lead-in in one tap, so that I am playing the same Stage I would have played yesterday.
4. As a beginner who skipped, I want the gated Exercise text to be exactly the seeded string, so that I am not punished for skipping with a different test.
5. As a beginner who took the Lead-in, I want the gated Exercise afterwards to still be that same seeded string, so that review never becomes a different gate.
6. As a beginner, I want never to be told I have to finish a Lead-in to open the Stage, so that optional practice cannot become a second gate.
7. As a beginner, I want a Lead-in never to count as clearing the Stage, so that "cleared Stage 6" still means I passed the Exercise at 90%.
8. As a Player, I want a Lead-in not to be called an Exercise, so that I am not looking for a Leaderboard on generated text.
9. As a Player, I want Finger stretch to keep its own name and its own moment, so that failure-card practice and Stage-start review do not collapse into one thing I cannot tell apart.

### When it appears

10. As a Stage 1 beginner, I want to go straight into the gated Exercise, so that the first keys I ever type are not behind a prelude that is the same activity again.
11. As a Stage 2 beginner who has already typed F and J enough for a weakness score, I want a Lead-in offered, so that I can review those keys before G and H's Exercise.
12. As a Stage 2 Player who reached the Stage by adult override without a weakness score on earlier keys, I want no Lead-in, so that I am not asked to review keys the app has never seen me type.
13. As a Stage 4 Player whose earlier keys have all dropped below the sample floor, I want no Lead-in, so that forgotten keys are not dressed up as review.
14. As a Stage 5 beginner, I want a Lead-in even if my Profile is empty, so that I still meet words and sentences before a letter-run Exercise now that the Corpus can form them.
15. As a Stage 12 Player with a fully populated Profile, I want a Lead-in every time I land on the Stage, so that sentences-before-the-gate does not depend on me currently being "weak".
16. As a Player replaying a cleared Stage 7, I want the same offer rules as a first visit, so that a replay can still start with optional sentences without re-locking the Stage.
17. As a Player replaying Stage 1, I want no Lead-in, so that Stage 1 stays a straight Attempt on every visit.

### Content

18. As a Stage 3 Player taking a Lead-in, I want text drawn from the letters Corpus over the keys taught so far, so that I am reviewing real earlier material rather than this Stage's new-key runs.
19. As a Stage 3 Player, I want no English sentences in that Lead-in, so that the app does not invent words from a key set that has no vowel.
20. As a Stage 5 Player taking a Lead-in, I want sentences from the Corpus that only use keys taught through Stage 5, so that I am not asked for a letter I have not been taught.
21. As a Player whose F is past the sample floor and currently my weakest cumulative key, I want the Lead-in to favour material that uses F, so that review aims at what I actually stumble on.
22. As a Player on Stage 5 with no scores in the cumulative set, I want a uniformly drawn playable sentence Lead-in, so that an empty Profile still gets words rather than an error.
23. As a Player, I want a Lead-in to be one run, not a Practice-style chain of many, so that the prelude cannot replace the Stage.
24. As a Player who wants more review, I want to take another Lead-in from the result card, so that one run is not a hard cap.
25. As a Player taking a second Lead-in, I want a freshly generated string, so that I am not reciting the first one.
26. As every Player on a given Stage's gated Exercise, I want that Exercise text unchanged by anyone's Lead-in, so that the Leaderboard still compares the same string.

### Flow

27. As a Player opening a Stage that offers a Lead-in, I want a card first rather than the typing surface, so that I can choose review or the Stage before anything is being timed.
28. As a Player on that card, I want the Stage's own start action visually dominant, so that skip is the easy path.
29. As a Player on that card, I want a quieter "Try some words first" (or "Try these first" before Stage 5), so that the optional path is findable without sounding like a test.
30. As a Player who starts the gated Exercise from that card, I want the handshake to begin only then, so that a skipped Lead-in is not already counting server time against an Attempt I have not started.
31. As a Stage 1 Player (and a Stage 2–4 Player with no offer), I want the Exercise to start as it does today, so that Stages without a Lead-in do not gain an extra tap.
32. As a Player in a Lead-in, I want the same typing surface as every other run — keyboard, next-key highlight, colour and glyph — so that review is not a different game.
33. As a Player who finishes a Lead-in, I want a short card with no numbers, so that I am not shown a Score-shaped result for something that is not an Attempt.
34. As a Player on that result card, I want starting the Stage to be the dominant action, so that review dumps me into the gate rather than into a menu.
35. As a Player who missed the gate, I want Try again to start the identical Exercise immediately, so that the retry loop is not interrupted by a Lead-in card.
36. As a Player who took a Finger stretch after failing, I want Try the Stage to start the gated Exercise, so that I am not offered a second prelude after I already warmed up.
37. As a Player who left the Stage and came back, I want the offer rules applied fresh, so that a new visit is a new start.
38. As a stuck Player, I want Finger stretch to still appear on the failure card after the usual number of misses, so that Stage-start review has not eaten the unstick path.
39. As a parent, I want the adult override and the 90% bar untouched by Lead-ins, so that optional practice cannot become an escape or a moving standard.

### Recording and identity

40. As a Player, I want a Lead-in generated on the server, so that the app can check what I typed against what it served, and so my Weak-key Profile never has to travel to the browser.
41. As a Player, I want my Lead-in keystrokes to update my Weak-key Profile, so that review actually changes what I will be served next.
42. As a Player, I want a Lead-in to write no Score, so that generated text cannot appear on a Leaderboard or pretend to be an Attempt.
43. As a Player whose Lead-in submission is structurally broken, I want nothing persisted, so that a truncated stream cannot corrupt my Profile.
44. As a Player mid-Lead-in, I want the same token rules as every other served string — mine, unconsumed, unexpired — so that a Lead-in is not a hole in the integrity posture.
45. As a Player on a Stage that is not open, I want a Lead-in refused, so that generated practice cannot skip the curriculum order.
46. As a visitor with no Nickname, I want a Lead-in refused, so that review cannot start before identity.

### History and boards

47. As a Player looking at a Stage Leaderboard, I want only gated-Exercise Scores there, so that generated Lead-in text is not ranked against anyone.
48. As a Player looking at my Learn history, I want bests per cleared Stage only, so that a Lead-in cannot masquerade as a Stage result.
49. As a Player looking at my Practice aggregate, I want Lead-ins not counted there, so that Learn-side review does not pad the Track I did not choose.
50. As a Player, I want my Profile snapshot on history to reflect Lead-in keystrokes, so that the one honest place a Lead-in can show up is the keys it actually moved.

### Sound

51. As a Player mistyping during a Lead-in, I want the same soft error tick as everywhere else, so that my eyes can stay on my hands.
52. As a Player finishing a Lead-in, I want no completion sound, so that a cheer is reserved for clearing a Stage.
53. As a Player who typed a Lead-in badly, I want no failure sound, so that a prelude cannot scold.
54. As a parent, I want mute to work mid-Lead-in exactly as mid-Attempt, so that silencing the room never depends on which card is showing.

## Implementation Decisions

- **No schema change.** A Lead-in is served and validated through the existing `attempt_tokens` table's `generated` handshake kind — the same content-pinning and server-clock mechanism Practice and Finger stretch already use.
- **No new `exercises` row, no Score row.** Completion deletes the token and folds `weak_key_stats`. The response body is accuracy-only (`{ accuracy }`), matching Finger stretch, so a result card cannot accidentally render WPM.
- **Not an Attempt, not an Exercise.** Code and comments use Lead-in. Do not name the surface Finger stretch, Practice, Drill, Challenge, Warm-up, or Exercise.
- **Generation is server-side**, sentence mode only, against the existing Practice Corpus and the existing playable / cumulative-key-set rules. Pass a weakness map filtered to this Stage's cumulative key set (keys with a non-null weakness score). Reuse existing `targetingAggressiveness`. Empty map → uniform draw. Draw count is Practice's six entries unless and until that count is named config.
- **Cumulative key set** for generation and playability is the Learn one: union of `keysTaught` for cleared Stages plus the current Stage. Do not fall back to the whole alphabet; that fallback is for a Player who has never started Learn, and a Lead-in only exists on an open Learn Stage.
- **Offer policy is a landing-card concern.** Stage 1 never; Stage 2–4 iff any key taught in Stages 1..n−1 has `weakness !== null`; Stage 5–21 always. Directly requesting generation on an open Stage is still authorized the way a Finger stretch is servable before its offer count — 403 only when the Stage is not open, 401 when there is no active Player.
- **Landing must not start the gated Exercise handshake** when a Lead-in is on offer. Stages with no offer keep today's auto-start.
- **HTTP seam.** Sibling of `/api/attempts/stretch/{stageId}`: GET serves `{ token, exercise: { content } }`; POST accepts `{ token, events }` and returns `{ accuracy }` or 400. Same structural validation, same Profile fold, no Score. Parameterized by Stage.
- **UI.** Same Stage route, card-swap. Offer card: dominant start-the-Stage, subordinate Lead-in copy as above. Result card: no numbers; dominant start-the-Stage; subordinate another Lead-in (new generation). Failure **Try again** and stretch **Try the Stage** skip the offer card and serve the gated Exercise. A new navigation to the Stage reapplies offer rules.
- **Audio.** Error ticks from the shared typing surface. Do not play the completion sound on Lead-in finish. No failure sound (already none). Mute unchanged.
- **History.** No new reads. Because there is no Score, Learn bests, Leaderboards, and the Practice aggregate (`exercise_id IS NULL`) cannot include a Lead-in. Profile reads already reflect folded stats.
- **Finger stretch is untouched** in trigger, grammar, copy, recording, and failure-card placement.
- **Gated Exercise is untouched** in content, handshake kind (`fixed`), retry identity, 90% bar, and Leaderboard predicate.
- **Zero new tunables required to ship.** Draw count may later become named config (see map fog). Do not hardcode a new "weakness cutoff" for the offer rule.

## Testing Decisions

**One seam: HTTP against the running SvelteKit server, backed by a freshly migrated SQLite database per test.** This matches the existing acceptance tests. A good test sends a request and checks the response and the resulting database state. It does not reach into a scoring function, assert on an intermediate value, or name a private helper.

Generation helpers already have unit-test prior art (practice generation, Corpus playability, cumulative key set, Finger stretch generation). New generation wiring may add unit tests in that same style; they are not a second seam and they are not required where calling the existing sentence-mode generator is the whole trick. They must not replace HTTP coverage of offer, recording, and history.

Per-test config injection already exists (`targetingAggressiveness`, decay, stretch offer count, and the rest). Use it where a test needs a known targeting blend or a known failure streak. Seeded generation randomness already exists; Lead-in tests that care about targeting must use it.

What this seam must cover:

- **Offer and skip.** An available Stage 5 lands such that the gated Exercise handshake has not been created, and starting the Stage still serves the seeded Exercise byte-identical to today. Stage 1 still auto-starts the Exercise with no Lead-in resource required. Stage 2 after a Profiled Stage 1 offers; Stage 2 with no previously-taught weakness score does not show the offer (Exercise auto-starts). Stage 5 with an empty Profile still serves a Lead-in of playable sentences.
- **Content.** Lead-in text uses only keys in the Stage's cumulative set. Stage 2–4 text comes from `letters` (no English sentence). Stage 5+ text includes Corpus sentences once they are playable. High `targetingAggressiveness` with a single floored weak key in the cumulative set biases draws toward that key under a seeded RNG. An empty weakness map still returns playable content (no 503 on an open Stage 5).
- **Recording.** Completing a Lead-in inserts no `scores` row, increments `weak_key_stats` for typed keys, and returns `{ accuracy }` only. A structurally incomplete POST is 400 and folds nothing. 403 when the Stage is not open; 401 without an active Player.
- **Gate isolation.** After a Lead-in, the next gated Attempt is the seeded text. A qualifying Score on that Attempt still clears; a Lead-in accuracy of 100% does not. `consecutiveStageFailures` is unchanged by taking a Lead-in.
- **History.** After a Lead-in and nothing else, Learn history has no new row, Practice aggregate count stays 0, and the Profile snapshot has moved.
- **Coexistence.** After a Lead-in and then `stretchOfferCount` failed gated Attempts, the failure payload still reports a Finger stretch available. Completing that stretch still writes no Score and still does not use Corpus sentences as its grammar. Try-again after failure serves the gated Exercise without requiring a Lead-in completion.

**Not covered by this seam, and accepted:** child-facing copy tone, card visual dominance, error-tick character, and the absence of a completion sound. Those are the same class of visual/audio rules the build spec already verifies against the typing surface's existing behaviour rather than through HTTP. The HTTP-observable stand-in for "no completion ceremony" is the accuracy-only body and the absence of a Score.

## Out of Scope

- Redrawing, shortening, or sentence-rewriting any gated Learn Exercise.
- Authoring new Corpus entries, a word bank, or a Lead-in-only vocabulary.
- Bigram-mode Lead-ins.
- Renaming or re-grammars of Finger stretch; changing `stretchOfferCount`.
- Making a Lead-in required, a bypass, or a Score.
- A new route, a new handshake kind, a schema migration, or a new ADR.
- Practice Track changes, Speed Test content, Leaderboard query changes, adult-override changes, or moving the 90% bar.
- A "how weak is weak" offer threshold beyond the existing 3-sample floor.
- Child-facing use of the word Lead-in.
- Screen-reader / assistive-tech work (still out of product scope).

## Further Notes

The single most load-bearing rule is still *fixed content ⟺ Leaderboard, generated content ⟺ none*. A Lead-in is the Learn Track finally using the generated side of that rule without touching the fixed side. If an implementation puts an `exercises` row, a Score, or a board on it, it has built an Exercise and broken the destination.

Finger stretch and Lead-in share a recording contract on purpose. They must not share a name, a trigger, or a grammar. Collapse any of those three and the failure card becomes a sentence quiz, or Stage start becomes another block-grammar drill.

Stage 5 is the pedagogical hinge because it is the first vowel. Everything about "always offer from 5" and "letters until then" is that fact, not a taste call. Do not "fix" Stage 2–4 by inventing vowelless words.

Draw count is the only number this spec is willing to retune later. Everything else is locked.

## Glossary update required

CONTEXT.md needs a **Lead-in** entry (see the package summary). Finger stretch's Avoid list should name Lead-in so the siblings stay distinct. Corpus and Weak-key Profile should mention that a Lead-in draws from the Corpus and folds the Profile without being an Attempt.

## Implementation tickets

Vertical slices, numbered from 10, each ready-for-agent:

- [10 — Stage 5+ Lead-in, skippable, generated, no Score](issues/10-stage-five-lead-in.md)
- [11 — Adaptive offer, letters Corpus, targeting](issues/11-adaptive-offer-and-targeting.md)
- [12 — History invisibility, audio, Finger stretch coexistence](issues/12-history-audio-and-stretch.md)
