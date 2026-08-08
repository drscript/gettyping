# Prototype the visual design for the typing interface

Type: prototype
Status: resolved

## Question

The UI must be "visually simple to allow users to focus on typing," but the Learn Track (kids 5+) and Speed Test & Practice Track (people who already type) plausibly call for different visual tones — playful/colorful/big vs. clean/minimal/dense. Build a rough UI prototype (via the `/prototype` skill) to answer: is this one visual language flexed slightly per Track, or two distinct visual modes? Does the typing interface show an on-screen keyboard? How is correct/incorrect feedback shown (per the baseline-accessibility decision: not color alone)? What does a Leaderboard look like inline with an Exercise?

## Answer

Prototype: [.scratch/gettyping-spec/prototypes/06-visual-design/](../prototypes/06-visual-design/) — three structurally different variants (A "Playful-Adaptive", B "Split Identity", C "Quiet Focus"), each rendering both Tracks live and typable side by side.

**Winner: Variant A's visual language and keyboard, with Variant B's Leaderboard timing** — a hybrid, not a straight pick of one variant:

- **One shared visual language, flexed per Track** (not two distinct modes): one component system — rounded pill feedback, one on-screen keyboard, one Leaderboard treatment — with only type scale/font flexed bigger and rounder for Learn vs. tighter and more compact for Speed Test & Practice.
- **On-screen keyboard: yes, on both Tracks.** Highlights the next expected key. Validated as good for both a beginner learning finger position and an experienced typist doing weak-key practice.
- **Correct/incorrect feedback: color paired with a second channel**, satisfying the baseline-accessibility decision (not color alone) — correct chars get a filled pill + a check glyph, incorrect chars get a dashed-outline pill + an × glyph. Shape (dashed vs. solid) and glyph both carry the signal independent of hue.
- **Leaderboard: hidden during the Attempt, revealed only on completing the Exercise/Stage.** Variant A's always-visible sidebar Leaderboard was rejected as distracting while typing — pulled from Variant B's "trophy shelf" reveal-on-finish behavior instead. Leaderboard is not inline-live during typing; it appears once the Attempt is scored.

Feeds the destination's visual/UX-principles section directly. No data-model impact — this is presentation timing, not a new fact to store (an Attempt's Score is already computed at completion, which is when the Leaderboard read naturally happens).
