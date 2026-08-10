# 28 — The adult override

Type: task
Blocked by: 20, 27
Status: ready-for-agent

## What to build

A way past a Stage a child is genuinely stuck on, reachable only by an adult — because the app's answer to a stuck child cannot be an infinite loop.

After a **configured number of consecutive failures**, the failure screen surfaces one quiet, adult-voiced line pointing at the grown-ups route. It is not a button and not an offer to the child. **There is never a child-facing skip**, because a child offered an escape from effort will take it every time.

On the grown-ups page an adult can **resolve the Stage** for the Player. That writes the one thing progression cannot derive — the qualifying Score never happened — and from then on the Stage counts as resolved exactly as a cleared one would, opening the next.

Reading that record as "**this Stage counts as resolved**" rather than "the next Stage is unlocked" is what makes the override work on Stage 21: a record on 21 completes the Track without needing to reference a Stage 22 that does not exist. A child stuck at the very end must not be the one person the escape hatch cannot help.

**The standard itself is untouched.** Clearing a Stage keeps meaning the same thing for every child, and the 90% bar never moves.

## Acceptance criteria

- [ ] The adult-voiced line appears only after the configured number of consecutive failures, and that count is config.
- [ ] No skip appears anywhere a child can reach, at any failure count.
- [ ] An adult can resolve a Stage from the grown-ups page.
- [ ] A Stage resolved by override counts as resolved and opens the next, with no qualifying Score.
- [ ] The override works on Stage 21 and completes the Track.
- [ ] The accuracy threshold is unchanged for every Stage before and after an override.
