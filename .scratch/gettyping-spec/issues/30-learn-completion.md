# 30 — Stage 21 completion and the graduate's home screen

Type: task
Blocked by: 29
Status: done

## What to build

The moment finishing the curriculum is marked, and what the app looks like afterwards.

Clearing Stage 21 goes to a **distinct completion screen** rather than another ordinary Stage clear — finishing the whole curriculum deserves marking. Its **dominant action is the Speed Test**: a Player who has finished Learn should not be left on a screen whose main action has nothing left to do.

The home screen needs **no new rule**. Its continue action was already "the next unlocked Stage, *or* the Speed Test", and a graduate simply has no first branch left, so the app leads with the Speed Test on its own and moves on with them. The Stage list stays, and every Stage stays replayable.

## Acceptance criteria

- [x] Clearing Stage 21 shows a distinct completion screen, not the ordinary Stage-clear result.
- [x] Its dominant action is the Speed Test.
- [x] A graduate's home screen leads with the Speed Test through the existing continue rule, with no special case added.
- [x] The Stage list remains on the graduate's home screen and every Stage remains replayable.
- [x] Completing the Track via the adult override on Stage 21 reaches the same completion state.
