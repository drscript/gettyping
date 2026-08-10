# 29 — The Stage list and replaying a cleared Stage

Type: task
Blocked by: 27
Status: ready-for-agent

## What to build

The whole path visible on the home screen, and the ability to go back to any part of it.

**All 21 Stages** are shown with their state — cleared, next, or not yet open. **Locked Stages are visible rather than hidden**, so a Player can see there is more ahead. The list reads as **icons and colours rather than a table of numbers**, because a young Player uses it before they can read well, and the three states carry **shape and glyph as well as hue**.

**Any cleared Stage can be replayed**, so a Score set on a first clumsy attempt can be improved.

A replay that goes badly gets the **ordinary result screen, not the failure state**. The result is keyed to the Stage *being cleared* — by this Attempt or any earlier one — not to this Attempt clearing it. Revisiting must not be punished with a failure screen for a Stage already passed. The Stage does not re-lock, and the earlier best still holds the Player's place, so nothing appears to have gone backwards.

**Every Attempt is recorded, including worse ones.** A Player's history is what happened rather than a highlight reel.

## Acceptance criteria

- [ ] The home screen shows all 21 Stages with cleared, current and locked states.
- [ ] Locked Stages are visible, not hidden.
- [ ] The three states are distinguishable by shape and glyph with hue removed, and read as icons rather than a table.
- [ ] Any cleared Stage can be replayed from the list.
- [ ] A sub-threshold replay of a cleared Stage returns the ordinary result screen.
- [ ] A sub-threshold replay does not re-lock that Stage or any later one.
- [ ] A worse replay writes a Score and does not displace the Player's earlier best.
