# 33 — The Learn Leaderboard rules

Type: task
Blocked by: 26, 32
Status: ready-for-agent

## What to build

What the board does on the 21 Learn Exercises, where a Stage gate exists.

**A Learn board only ranks Scores that cleared the Stage.** Without that, a Player could top a Stage's board having never cleared it — a fast, sloppy Attempt still produces a perfectly valid Score.

This is a **predicate on the board query, and deliberately not the eligibility flag**. That column means "implausible, possibly tampered" and doubles as the operator's manual moderation lever; making it also mean "typed sloppily but honestly" would poison the one column an operator reaches for.

**The reveal is keyed to the Stage being cleared** — by this Attempt or any earlier one — not merely to finishing. So a Player who missed the gate never sees a board at all, and is never shown their rank in the middle of failing. A sub-threshold replay of an already-cleared Stage gets the ordinary result *with* its board, where that Attempt's Score simply cannot rank under the accuracy predicate.

Everything else about the board — suppression, the appended own row, the not-ranked marking, the personal-best marker — behaves exactly as it does on the Speed Test's board. The Speed Test has no gate, so no accuracy predicate applies to it.

## Acceptance criteria

- [ ] A sub-threshold Score never appears on a Learn board, however fast it was.
- [ ] The exclusion is a query predicate; the eligibility flag is untouched by it.
- [ ] Clearing a Stage reveals its board.
- [ ] Missing the gate reveals no board anywhere on the screen.
- [ ] Replaying a cleared Stage below the threshold reveals the board, with the Player's earlier best still holding the row.
- [ ] Suppression, the appended own row and the not-ranked marking behave on a Learn board exactly as on the Speed Test's.
- [ ] The Speed Test board applies no accuracy predicate.
