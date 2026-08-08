# Prototype: visual design for the typing interface

Throwaway. Resolves [wayfinder ticket 06](../../issues/06-prototype-visual-design.md).

Open it directly in a browser — no server, no deps, no build step:

```bash
open .scratch/gettyping-spec/prototypes/06-visual-design/index.html
```

## Question this answers

Does the Learn Track (kids 5+) and Speed Test & Practice Track (people who
already type) need one visual language flexed per Track, or two distinct
visual modes? Does the typing interface show an on-screen keyboard? How is
correct/incorrect feedback shown, given the baseline-accessibility decision
that it can't be color alone? What does a Leaderboard look like inline with
an Exercise?

## What it does

Three structurally different variants, switchable via the floating bottom
bar (click the arrows or press `←`/`→` when not actively typing) or the
`?variant=A|B|C` URL param. Each variant renders **both** Tracks side by
side so the "one language vs. two modes" question is visible directly —
click into a prompt and type it for real to feel the feedback:

- **A — Playful-Adaptive**: one shared component system (rounded pill
  feedback with a check/× glyph, one on-screen keyboard, sidebar
  Leaderboard) used on both Tracks, flexed only via type scale/font per
  Track.
- **B — Split Identity**: two visibly different products. Learn gets a
  colorful card, a reacting buddy face, a chunky glowing keyboard, and a
  trophy-shelf Leaderboard revealed only on finishing. Speed Test gets a
  dark dense terminal aesthetic, no keyboard, underline/strikethrough
  feedback, and a persistent top ticker for rank.
- **C — Quiet Focus**: one minimal system on both Tracks, no on-screen
  keyboard anywhere, feedback via weight/icon/shake rather than fills (a
  check glyph, a ghost hint of the expected letter), Leaderboard tucked in
  a one-click drawer so it never competes with the text.

All three keep a live Leaderboard (toy scoring: correct − 2×errors against
a fixed mock list) so you can react to *where* the Leaderboard sits relative
to the Exercise, not just what it looks like.
