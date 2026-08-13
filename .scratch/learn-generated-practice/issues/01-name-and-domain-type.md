# Name and domain type of the Learn-side generated activity

Type: grilling
Status: resolved
Blocked by: None
Part of: learn-generated-practice map

## Question

The Learn Track's gated Exercise per Stage is still letter-run / block grammar, because that text is fixed and Leaderboard-bearing. Pedagogy wanted keys → pairs → words → sentences *before* that gate. Finger stretch already generates no-Leaderboard practice, but only on the failure card after repeated misses, and only in the authored block grammar.

What is the Learn-side generated activity at Stage start, in domain terms? Is it an Exercise? Is it a Finger stretch reused at a new moment? Is it an Attempt? What is it called in the glossary, and what may child-facing copy say?

## Answer

**It is a Lead-in.** A generated, no-Leaderboard practice offered at the start of a Learn Stage so the Player can review earlier keys — and, from Stage 5, type words and sentences — before the gated Exercise. It is not an Exercise, not a Finger stretch, not an Attempt, and not a Score.

CONTEXT.md already defines an Exercise as a typing activity **with its own Leaderboard**. The load-bearing rule behind that definition is the one [13-gate-failure-flow.md](../../gettyping-spec/issues/13-gate-failure-flow.md) made explicit:

> **Fixed content ⟺ has a Leaderboard. Generated content ⟺ has none.**

A Lead-in is generated, so it cannot have a Leaderboard, so it cannot be an Exercise. Calling it one would put a Stage in the position of presenting two Exercises, only one of which ranks, and would quietly break [ADR 0002](../../../docs/adr/0002-per-exercise-leaderboards.md)'s "each Exercise has a board" reading. The Speed Test & Practice Track already generates Practice Exercises with no `exercises` row and no board; that Track's vocabulary is allowed to say "Practice Exercise" because the Track is Practice. Learn must not grow a second Exercise per Stage. The gated row stays the Stage's one Exercise.

**It is not a Finger stretch.** Finger stretch is the failure-card offer: block grammar (runs → pairs → anchor → pairs), no Score, Weak-key Profile still folds, triggered after `stretchOfferCount` consecutive gate misses. Reusing that name for a Stage-start Corpus review would smash two moments, two grammars, and two intents into one word. Finger stretch's discarded placeholder was "Warm-up"; that word stays retired. The two surfaces are siblings. They share a recording contract (generated handshake, no Score, Profile folds) and a UI pattern (card-swap on the Stage route). They do not share a name.

**It is not an Attempt.** CONTEXT.md: an Attempt is one completed run through an Exercise, producing a Score. A Lead-in produces no Score and is not a run through an Exercise. Finger stretch already established this carve-out; Lead-in inherits it. Keystrokes still fold the Weak-key Profile — the Profile is fed by accepted streams, not only by Attempts.

**Glossary term: Lead-in.** Rejected names:

| Name | Why not |
|---|---|
| Exercise | Has a Leaderboard by definition. Generated content cannot. |
| Finger stretch | Already names the failure-card mini-run. Different trigger, different grammar. |
| Drill / Challenge | CONTEXT.md Avoid on Exercise and Finger stretch. Competitive flavour the Learn Track has spent tickets stripping out of failure. |
| Warm-up | Finger stretch's discarded placeholder. Reusing it reopens a closed naming fight. |
| Practice | That is the Track. A Learn Player is not "doing Practice." |
| Mini-Exercise | Finger stretch's addendum used this loosely in prose. It still contains Exercise. |

Child-facing copy does not have to say "Lead-in". The glossary term is for specs, tickets, and code comments. On the card, warmer copy is correct: Stage 5+ **"Try some words first"**; Stage 2–4 **"Try these first"** (the Corpus there is still `letters`, and promising "words" before the first vowel would be a lie). The gated Exercise remains the dominant CTA, labelled as the Stage itself (the existing "Find X and Y" heading made into the primary action).

No new ADR. The type distinction is the fixed-content rule already in the spec, applied to a new surface. [ADR 0003](../../../docs/adr/0003-adaptive-exercise-generation.md) says the other Track generates Practice from a Weak-key Profile; it does not say generated text on Learn is an Exercise, and it does not forbid reusing the generator for a non-Exercise.
