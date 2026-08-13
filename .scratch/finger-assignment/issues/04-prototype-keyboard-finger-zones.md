# 04 — Prototype: keyboard finger zones

Type: prototype
Status: resolved

## Question

Can finger zones be encoded with DESIGN.md’s palette (no rainbow), with shape as well as hue, without stealing Sunshine from the next key? What does the Stage 1 intro card look like on top of that keyboard?

## Answer

Prototype: [../prototypes/keyboard-finger-zones.html](../prototypes/keyboard-finger-zones.html) — vanilla HTML/CSS, open in a browser, no build.

**One encoding, not a bake-off.** Chevron + pips vs named finger icons were not tied: icons fail at cap size and require anatomy words. The prototype locks **hand-side chevron + 1–4 pips, hue on the badge, white caps, F/J bump ridge**. Reasoning in [01](./01-finger-to-key-map-and-visual-encoding.md).

Three scenes (bottom switcher):

1. **Resting marks** — every Learn cap carries its badge; no Sunshine.
2. **Next key F** — F takes Sunshine, Sunshine Deep edge, and rises; left-index badge remains.
3. **Stage 1 intro** — “Find the bumps” card, the three child-facing lines, Sunshine “I found the bumps” button, keyboard visible with **F and J** both on the next-key treatment plus index badges.

This file is the visual spec. Implementation matches it. No component tests for the marks — same posture as the resolved-design reference for colourblind feedback and next-key highlight.
