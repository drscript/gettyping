# Practice from Learn

Label: wayfinder:map

## Destination

A Learn Player who has actually typed — at least one Learn Score — can enter Practice and be served generated Exercises targeting keys they have been taught. The Speed Test stays the diagnostic door for someone who skipped Learn. Practice stays on the Speed Test & Practice Track. Home Continue is unchanged. No third Track, no new ADR, no new glossary term.

This is a sequencing change to [14-practice-loop.md](../gettyping-spec/issues/14-practice-loop.md)'s "Speed Test is a one-time prerequisite." Architecture is untouched: ADR 0003 still generates Practice from the Weak-key Profile; Sentence-mode Corpus still constrains *what* can be generated via `cumulativeKeySet`.

## Notes

- Domain vocabulary: [CONTEXT.md](../../CONTEXT.md) — Track, Stage, Exercise, Speed Test, Attempt, Score, Player, Weak-key Profile, Corpus. Practice is generated Exercises on the Speed Test & Practice Track.
- ADRs in force: [0002 per-exercise Leaderboards](../../docs/adr/0002-per-exercise-leaderboards.md), [0003 adaptive exercise generation](../../docs/adr/0003-adaptive-exercise-generation.md). No new ADR.
- Product-owner stance is locked in the four decision tickets unless it contradicts an ADR. It does not.
- Code facts on current main: `GET /api/attempts/practice` requires a Score with `exerciseId` 22; the Practice client 403s to `/speed-test`; home Continue is next Stage else `/speed-test`; `cumulativeKeySet` already unions cleared+current `keysTaught` once Learn has started, else the alphabet.

## Decisions so far

- [Eligibility rule](issues/01-eligibility-rule.md) — Practice unlocks on **at least one Learn Score or at least one Speed Test Score**. Nickname-only Players with zero Attempts stay out (nothing to target). A sub-gate or Leaderboard-ineligible Learn Score still counts; a Finger stretch does not (it writes no Score); an adult override with no Score does not. Amends 14's Speed Test prerequisite. No schema change.
- [Navigation and copy](issues/02-navigation-and-copy.md) — Do not auto-route Learn Players into Practice. Continue stays "next Stage, else Speed Test." Eligible home gains a **secondary** `/practice` action. `/practice` 403 still sends the ineligible Player to the Speed Test. Learn complete keeps Speed Test as the dominant CTA and drops the claim that Practice draws from the Speed Test. Speed Test result keeps "practise your weak keys."
- [Key-set and targeting](issues/03-key-set-and-targeting.md) — Existing `cumulativeKeySet` is enough. A Learn-only Player at Stage 3 cannot be served untaught letters. A Speed-Test-only Player still gets the alphabet. Weak-key Profile, scoring formula, generation modes, session summary shape, and no-Leaderboard-on-generated-Exercises are unchanged.
- [Practice stays on the Speed Test & Practice Track](issues/04-practice-stays-on-speed-test-track.md) — The Track is the mode of activity, not how the Player became eligible. Splitting Practice into Learn would break ADR 0003. Copy must not imply Practice is a Learn feature. History's Practice section already exists and will fill once a Learn-only Player practises.

## Not yet specified

- Exact wording of the home secondary pill beyond the locked phrase **Practise weak keys** (visual weight, icon, order among History / Not you?) — implementation may match the existing secondary-row pills. The href, the eligibility gate, and the phrase are locked.
- Whether a Practice session-summary Speed Test link should branch "Take" vs "Retake" on whether a Speed Test Score exists. Locked to the single phrase **Take the Speed Test**, which does not lie to a Learn-only Player and matches Learn complete.

## Out of scope

- A third Track, or moving Practice Exercises onto Learn.
- Auto-routing Continue or Learn complete into `/practice`.
- Changing Practice generation, modes (Sentences / Focused bigrams), targeting aggressiveness, Weak-key Profile arithmetic, or adding a Leaderboard to generated Exercises.
- A new history section.
- Gating or freezing the Speed Test (it stays ungated, retakeable, immutable text, flagship Leaderboard).
- Changing `cumulativeKeySet` (Learn-started → taught keys; else alphabet).
- New glossary terms. New ADRs.
