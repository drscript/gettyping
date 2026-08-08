# Resolved design reference

Not a prototype in the wayfinder sense — nothing here is undecided. This renders
the design the spec actually specifies, so an implementer has one place to see it
rather than three competing variants and a changelog across three tickets.

```bash
open .scratch/gettyping-spec/prototypes/resolved-design/index.html
```

No server, no deps, no build step. Audio is synthesised via WebAudio, so there
are no asset files (those are content-authoring, out of scope).

## How this differs from `../06-visual-design/`

That directory is the **decision tool**: three structurally different variants
(A Playful-Adaptive, B Split Identity, C Quiet Focus) built so the choice could
be made by reacting to them. Two lost. It is preserved as the record of how the
decision was reached.

This directory is the **outcome**: variant A's visual language and keyboard with
variant B's Leaderboard timing — the hybrid that won — plus the onboarding and
audio decisions taken afterwards, which the original prototype predates entirely.

## What it covers

Five screens, walkable end to end:

| Screen | Ticket | What it shows |
|---|---|---|
| Track choice | 11 | Two doors framed by intent, never by age or self-assessed skill |
| Nickname | 11 | Tap-to-pick on Learn, free text on Speed Test; profanity rejection |
| Typing | 06, 12 | One visual language flexed per Track, keyboard, feedback, audio |
| Home (returning) | 11 | Continue CTA, progress, other Track, "Not you?" device switch |
| For grown-ups | 11 | The persistent adult route |

Mute and the grown-ups link sit in the corner of **every** screen, including
mid-Attempt — deliberately, per 12: the moment a parent decides they have had
enough is mid-exercise, and silencing the app must never cost a Stage in progress.

## Things worth poking at

- **Type a prompt with mistakes.** Correct characters get a filled pill and a ✓;
  incorrect get a *dashed* outline and an ×. Shape and glyph each carry the
  signal independently of hue — the baseline-accessibility decision in action.
- **Watch when the Leaderboard appears.** It stays hidden for the whole Attempt
  and is revealed only on completion (06 rejected the always-visible sidebar as
  distracting while typing).
- **Listen for the error tick.** It fires on errors only, never on correct keys,
  and never gets louder on a run of mistakes. Mute it and notice nothing is
  lost — every sound is strictly redundant with the screen.
- **Try typing `damn` into "type your own".** The rejection never names what
  tripped and offers candidate cards as the escape, so it becomes a choice
  rather than a dead end. Note it only checks on *submit*, not per-keystroke.
- **Switch Tracks with the tabs.** The components are identical either side;
  only type scale and font family flex.

## Fidelity caveats

Demo-grade where the spec deliberately says nothing:

- The nickname candidates, the blocklist, and the exercise text are throwaway
  samples. The real curated list and word banks are content-authoring, ruled
  out of scope on the map.
- Scoring is a simplified stand-in. The real formulas are in
  [08-scoring-formulas.md](../../issues/08-scoring-formulas.md), and per
  [10-score-integrity.md](../../issues/10-score-integrity.md) the server derives
  every aggregate from POSTed keystroke events — none of this is client-side in
  the real app.
- The Leaderboard is a fixed mock list. Real Leaderboards are computed on read
  via a window function.
- Nothing persists. The real app stores the Player UUID list and the
  device-scoped mute preference in a cookie as `{ active, players[] }`.
