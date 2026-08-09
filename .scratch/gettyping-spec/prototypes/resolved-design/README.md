# Resolved design reference

Not a prototype in the wayfinder sense — nothing here is undecided. This renders
the design the spec actually specifies, so an implementer has one place to see it
rather than a winning variant and a changelog across seven tickets.

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
variant B's Leaderboard timing — the hybrid that won — plus every decision taken
after it, which the original prototype predates entirely.

## The scenario bar

Several specified states cannot be reached by playing forward in a demo: a
suppressed Leaderboard, an ineligible Score, Stage 21's completion screen, a
graduate's home screen. The floating bar at the bottom jumps straight to any of
them. Cycle with `←` / `→` (never stolen from a text field or from the typing
panel mid-Attempt), or pick from the list. Reload-stable via the URL hash.

It is deliberately styled as furniture — black pill, monospace — so it reads as
scaffolding rather than part of the design being evaluated.

## What it covers

Nineteen scenarios across eight screens.

| Screen | Ticket | What it shows |
|---|---|---|
| Track choice | 11 | Two doors framed by intent, never by age or self-assessed skill |
| Nickname | 11 | Tap-to-pick on Learn, free text on Speed Test; profanity rejection |
| Typing | 06, 12 | One visual language flexed per Track, keyboard, feedback, audio |
| → cleared | 15 | Stats, then the board — full, suppressed, or marked unranked |
| → gate failure | 13 | The accuracy against the target, no board, dominant retry |
| → practice | 14 | Compact stats, no board ever, "next" dominant |
| Home (returning) | 11, 16 | Continue CTA, the Stage list, other Track, "Not you?" |
| Stage 21 complete | 16 | The completion screen, Speed Test as its dominant CTA |
| Session summary | 14 | The Weak-key Profile visibly moving |
| Your scores | 17 | Speed Test trend, Learn bests, Practice aggregate |
| For grown-ups | 11, 13, 16 | The persistent adult route, including the override |

Mute and the grown-ups link sit in the corner of **every** screen, including
mid-Attempt — deliberately, per 12: the moment a parent decides they have had
enough is mid-exercise, and silencing the app must never cost a Stage in progress.

## Things worth poking at

- **Type a prompt with mistakes.** Correct characters get a filled pill and a ✓;
  incorrect get a *dashed* outline and an ×. Shape and glyph each carry the
  signal independently of hue — the baseline-accessibility decision in action.
- **Miss the 90% gate on a Learn Stage.** You land on 13's failure state: the
  accuracy against the target, a dominant "try again", and **no Leaderboard
  anywhere on the screen**. Retry and notice the text is identical — that is the
  rule *fixed content ⟺ has a Leaderboard, generated content ⟺ none*.
- **Fail three times.** A quiet, adult-voiced line appears pointing at the
  grown-ups route. There is never a child-facing skip button. (Three is a
  placeholder — the real count is a tuned constant in the map's fog.)
- **Compare the three board states** (scenarios 6–8). Above the threshold you get
  the ten plus your own appended row with its true rank and a personal-best
  marker; below it that same panel stands alone with no rank and no rows; an
  ineligible Score is marked *not ranked* and never told why. One component,
  three contexts.
- **Look at rows 2 and 3 of the board.** Both on 41 wpm. They are ordered by
  `id ASC`, so the earlier Score wins and the board cannot reshuffle between
  reads — the nondeterminism defect ticket 15 found and fixed.
- **Replay a cleared Stage from the home screen, badly** (scenario 11). You get
  the *ordinary* result, not a failure: the reveal is keyed to the Stage being
  cleared, not to this Attempt clearing it. Your earlier best still holds the
  board row, so nothing appears to have gone backwards.
- **Watch the graduate's home screen** (scenario 13). No new rule was needed —
  11's CTA is already "next unlocked Stage, *or the Speed Test*", and a graduate
  simply has no first branch left.
- **Open "My scores" from the home screen** (scenario 18). Three sections, because
  only one Track produces numbers that are comparable over time — and the Speed
  Test only does because 14 froze its text to protect the Leaderboard. Note the
  118 wpm entry: **listed and marked, but not on the line.** A list entry is a
  row; a trend is an assertion about direction.
- **Listen for the error tick.** It fires on errors only, never on correct keys,
  and never gets louder on a run of mistakes. There is deliberately **no failure
  sound** — it would fire loudest for the child having the worst time. Mute it
  and notice nothing is lost.
- **Try typing `damn` into "type your own".** The rejection never names what
  tripped and offers candidate cards as the escape, so it becomes a choice
  rather than a dead end. Note it only checks on *submit*, not per-keystroke.
- **Switch Tracks with the tabs.** The components are identical either side;
  only type scale and font family flex.

## Fidelity caveats

Demo-grade where the spec deliberately says nothing:

- The nickname candidates, the blocklist, the exercise text, and the weak-key
  figures on the session summary are throwaway samples. The real curated list
  and word banks are content-authoring, ruled out of scope on the map.
- Scoring is a simplified stand-in. The real formulas are in
  [08-scoring-formulas.md](../../issues/08-scoring-formulas.md), and per
  [10-score-integrity.md](../../issues/10-score-integrity.md) the server derives
  every aggregate from POSTed keystroke events — none of this is client-side in
  the real app.
- The Leaderboard is a fixed mock list. Real Leaderboards are computed on read
  via a window function, ordered `net_wpm DESC, id ASC` in both clauses.
- The two tuned constants the prototype has to pick a number for — the board's
  distinct-ranked-Players threshold and the consecutive-failure count — are
  named at the top of the script and set to placeholders. Both are fog on the
  map, awaiting live data; neither is a spec constant.
- Nothing persists. The real app stores the Player UUID list and the
  device-scoped mute preference in a cookie as `{ active, players[] }`.
