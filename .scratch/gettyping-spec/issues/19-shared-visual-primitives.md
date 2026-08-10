# 19 — Shared visual primitives

Type: task
Blocked by: 18
Status: done

## What to build

The component vocabulary every screen after this one is assembled from, built once against the resolved-design reference render rather than re-derived per slice.

One visual language flexed per Track, not two separate visual systems: the same components on both Tracks, with only type scale and font family differing — bigger and rounder for Learn, tighter and more compact for Speed Test & Practice.

Four pieces:

**Per-character feedback.** A correct character gets a filled pill and a check glyph; an incorrect one gets a *dashed* outline and a cross. Shape and glyph each carry the signal independently of hue, so the feedback still works with colour removed entirely. This is the baseline-accessibility line — colourblind-safe feedback and legible sizing, not full assistive-tech support.

**The on-screen keyboard**, present on both Tracks, highlighting the next expected key so a beginner can learn finger position without looking down.

**The persistent corner furniture** — a mute toggle and a "For grown-ups" link — on every screen including mid-Attempt. Both are placed and reachable here; muting actually silences anything in 36, and the grown-ups page itself is written in 20.

**The Track flex**, as a single switch rather than two parallel stylesheets.

These are verified against the reference render at [prototypes/resolved-design/](../prototypes/resolved-design/), which walks all nineteen specified states. Component tests were considered and declined as the most brittle tests in the set for the least return.

## Acceptance criteria

- [x] A route walks every primitive in both Track flexes.
- [x] Correct and incorrect characters remain distinguishable with hue removed — shape and glyph alone carry the signal.
- [x] The on-screen keyboard highlights the next expected key, and appears on both Tracks.
- [x] The mute toggle and the grown-ups link are reachable from every screen including while an Attempt is in progress, and neither can interrupt or end one.
- [x] Switching Track changes type scale and font family only; component structure is identical either side.
- [x] The primitives match the resolved-design reference render.
