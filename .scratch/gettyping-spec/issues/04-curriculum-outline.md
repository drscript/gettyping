# Design the Learn-track curriculum outline

Type: grilling
Blocked by: 03
Status: resolved

## Question

Using the findings in [03-research-typing-pedagogy.md](./03-research-typing-pedagogy.md), design the concrete Stage list for the Learn Track: how many Stages, what keys/skills each one teaches, the order, and the unlock threshold (what a Player must achieve on a Stage's Exercise to advance). This becomes part of the build-ready spec directly — it's the concrete answer to "easy for kids 5+ to start learning stage by stage." Exact lesson text/copy for each Stage is downstream and stays fog for now (see the map's Not yet specified).

## Answer

**Single, unbranched Stage sequence** (no age-fork between young kids and adult beginners — adults who already type place out via the Speed Test track instead), with a **tightening-then-loosening pace**: 1-2 new keys per Stage through the alphabet rows, loosening to 2-3 per Stage from bottom row onward. **21 Stages total**, each with exactly **one Exercise** (one Score, one Leaderboard, one gate — per [0002 per-exercise leaderboards](../../../docs/adr/0002-per-exercise-leaderboards.md)), gating on a **flat 90% accuracy threshold** throughout (no ratchet; WPM is shown but never gates). Each Stage's Exercise content is **cumulative** — drawn from all keys taught in Stages 1..*n*, weighted toward Stage *n*'s new keys, so earlier keys keep getting recycled rather than a strictly linear once-through sequence.

| # | Stage | Keys taught |
|---|-------|------|
| 1 | Home row: F & J | F, J |
| 2 | Home row: G & H | G, H |
| 3 | Home row: D & K | D, K |
| 4 | Home row: S & L | S, L |
| 5 | Home row: A & ; | A, ; |
| 6 | Top row: R & U | R, U |
| 7 | Top row: T & Y | T, Y |
| 8 | Top row: E & I | E, I |
| 9 | Top row: W & O | W, O |
| 10 | Top row: Q & P | Q, P |
| 11 | Bottom row: V & N | V, N |
| 12 | Bottom row: B & M | B, M |
| 13 | Bottom row: Z, X, C | Z, X, C |
| 14 | Shift & capitalization | Shift (modifier only) |
| 15 | Punctuation: comma & period | , . |
| 16 | Punctuation: apostrophe, ?, ! | ' ? ! |
| 17 | Numbers: 1 & 0 | 1, 0 |
| 18 | Numbers: 2 & 9 | 2, 9 |
| 19 | Numbers: 3 & 8 | 3, 8 |
| 20 | Numbers: 4 & 7 | 4, 7 |
| 21 | Numbers: 5 & 6 | 5, 6 |

Row order (home → top → bottom → shift/capitalization → punctuation → numbers) and mirrored left/right pairing within each row follow directly from [03-research-typing-pedagogy.md](./03-research-typing-pedagogy.md)'s finger-economy rationale. Exact lesson text/copy per Stage is ruled out of scope for the spec (see map's Out of scope) — it's content-authoring work for implementation time, not a spec decision.
