# Prototype the visual design for the typing interface

Type: prototype
Status: resolved

## Question

The UI must be "visually simple to allow users to focus on typing," but the Learn Track (kids 5+) and Speed Test & Practice Track (people who already type) plausibly call for different visual tones — playful/colorful/big vs. clean/minimal/dense. Build a rough UI prototype (via the `/prototype` skill) to answer: is this one visual language flexed slightly per Track, or two distinct visual modes? Does the typing interface show an on-screen keyboard? How is correct/incorrect feedback shown (per the baseline-accessibility decision: not color alone)? What does a Leaderboard look like inline with an Exercise?

## Answer

Prototype: [.scratch/gettyping-spec/prototypes/06-visual-design/](../prototypes/06-visual-design/) — three structurally different variants (A "Playful-Adaptive", B "Split Identity", C "Quiet Focus"), each rendering both Tracks live and typable side by side.

> The winning hybrid described below is rendered on its own in [prototypes/resolved-design/](../prototypes/resolved-design/), together with the later onboarding and audio decisions. The three-variant prototype above is kept as the record of how the choice was made.

**Winner: Variant A's visual language and keyboard, with Variant B's Leaderboard timing** — a hybrid, not a straight pick of one variant:

- **One shared visual language, flexed per Track** (not two distinct modes): one component system — rounded pill feedback, one on-screen keyboard, one Leaderboard treatment — with only type scale/font flexed bigger and rounder for Learn vs. tighter and more compact for Speed Test & Practice.
- **On-screen keyboard: yes, on both Tracks.** Highlights the next expected key. Validated as good for both a beginner learning finger position and an experienced typist doing weak-key practice.
- **Correct/incorrect feedback: color paired with a second channel**, satisfying the baseline-accessibility decision (not color alone) — correct chars get a filled pill + a check glyph, incorrect chars get a dashed-outline pill + an × glyph. Shape (dashed vs. solid) and glyph both carry the signal independent of hue.
- **Leaderboard: hidden during the Attempt, revealed only on completing the Exercise/Stage.** Variant A's always-visible sidebar Leaderboard was rejected as distracting while typing — pulled from Variant B's "trophy shelf" reveal-on-finish behavior instead. Leaderboard is not inline-live during typing; it appears once the Attempt is scored.

Feeds the destination's visual/UX-principles section directly. No data-model impact — this is presentation timing, not a new fact to store (an Attempt's Score is already computed at completion, which is when the Leaderboard read naturally happens).

## Addendum — reveal condition refined by [13-gate-failure-flow.md](./13-gate-failure-flow.md)

"Revealed only on completing the Exercise" is ambiguous for a failed Attempt: every character was typed, so the Exercise *was* completed, and as written this reveals the Leaderboard to a Player who just missed the Learn gate.

**Refined**: the Leaderboard is revealed on **clearing** the Exercise, not merely finishing it. A sub-90% Learn Attempt goes to a distinct failure state with no Leaderboard — the pedagogy research is explicit that young learners should get progress-coupled framing over "competitive/leaderboard mechanics", and a child who scored 62% should not be shown their rank beneath ten strangers. The Score still persists and still counts for personal history. Everything else above is unchanged.

## Addendum — reveal refined again by [15-leaderboard-display-rules.md](./15-leaderboard-display-rules.md)

The reveal now has two conditions rather than one. 13 established that it fires on *clearing* an Exercise, not merely finishing it. 15 adds that the **Leaderboard itself only appears once the Exercise has a threshold number of distinct ranked Players** — below that, a board of one or two rows manufactures a competitive signal that does not exist.

**Net effect on the completion screen:**
- **Stats always.** Suppression removes the ranking, never the completion moment.
- **Above the threshold**: the top 10, plus the Player's own row appended below with their rank when they fall outside it, carrying a personal-best marker when the Attempt improved on their previous best, or a "not ranked" marker when the Score was ineligible.
- **Below the threshold**: that same personal row alone — Score and personal-best marker, no rank, no rows.

One component in two contexts, so the design degrades gracefully instead of branching. Everything else above is unchanged.
