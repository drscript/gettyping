# 26 — Stage 1 end to end and the 90% gate

Type: task
Blocked by: 21
Status: ready-for-agent

## What to build

The Learn Track's core loop, proved on Stage 1.

A Player on Learn is served their Stage's single Exercise, types it through **exactly the same serve/submit/derive path the Speed Test uses** — there is no second scoring calculation anywhere in the system — and clears the Stage by reaching **90% accuracy**. Speed is measured and shown but **never gates**: a beginner must not be punished for the slowness that is the entire point of being a beginner, and seeing their speed improve should be encouraging rather than threatening.

The standard is **flat across all 21 Stages**, so "cleared Stage 6" means the same thing as "cleared Stage 16".

**Progression is derived, not stored.** A Stage is resolved when the Player holds a Score on its Exercise at or above the threshold; the next Stage is available when the previous one is resolved. Clearing opens the next Stage **immediately** — the reward for clearing is momentum.

An **ineligible Score still satisfies the gate**. A child who finishes at 94% and hits a suspended laptop must not lose the Stage, with no account and no support inbox to appeal to.

Authors Stage 1's Exercise text. Content is **cumulative**: each Stage's text draws on every key taught so far, weighted toward that Stage's new keys, so earlier keys keep being recycled rather than taught once and abandoned. For Stage 1 that is F and J alone.

## Acceptance criteria

- [x] A Learn Exercise is served, typed and submitted through the same path as the Speed Test, producing the same derived aggregates.
- [x] 90% accuracy clears the Stage; 89% does not.
- [x] Speed is shown on the result and never affects whether the Stage clears.
- [x] The threshold is flat — the same value applies at Stage 1 and at Stage 21.
- [x] Stage availability is derived from Scores rather than stored on the Player.
- [x] Clearing a Stage opens the next one immediately.
- [x] A Score marked ineligible still satisfies the gate.
- [x] Stage 1's text uses only the keys Stage 1 teaches.
