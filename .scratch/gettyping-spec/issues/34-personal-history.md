# 34 — Personal history

Type: task
Blocked by: 24, 26, 32
Status: ready-for-agent

## What to build

A place a Player can see their own past Scores and tell whether they are better than they were a month ago.

Reached from the **home screen's secondary row**, and **plainly styled but not adult-gated** — a Player's own Scores are not an adult's business, and the primary reader is a Speed Test Player looking at their own trend.

Three sections, each saying only what its Track can honestly say:

**Speed Test** — a Net WPM **trend over time**. This is the app's only apples-to-apples series, and only because the Speed Test's content is immutable. Every retake is listed; an **ineligible Score is listed and marked but never plotted**. A list entry is a row; a trend is an assertion about direction, and one bad reading must not distort the shape of someone's progress.

**Learn** — the **best Score on each cleared Stage**, in the same vocabulary the Stage list uses, so a Player can see which ones are worth going back to beat.

**Practice** — an **aggregate** (Attempts, time typing) plus the **current Weak-key Profile**. Never individual generated Attempts: each targeted different keys, so listing them renders noise as data.

This needs **no schema change**. It gives a reader to two pieces the schema already carried speculatively — the per-Player chronological index and the nullable Exercise reference.

## Acceptance criteria

- [ ] History is reachable from the home screen's secondary row and is not behind the grown-ups route.
- [ ] The Speed Test section plots Net WPM over time and lists every retake.
- [ ] An ineligible Speed Test Score is listed and marked, but absent from the plotted line.
- [ ] The Learn section lists the best Score per cleared Stage and nothing for uncleared ones.
- [ ] The Practice section shows an aggregate plus the current Profile, and lists no individual generated Attempt.
- [ ] A Player with no Attempts on a Track gets an honest empty state rather than a broken section.
- [ ] No migration is needed.
