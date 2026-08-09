# Decide whether a Player can see their own history, and what it shows

Type: grilling
Status: resolved
Assignee: Claude

## Question

**Six tickets justify keeping data by appealing to "personal history". No ticket specifies that a Player can ever see it.**

The phrase is load-bearing wherever it appears, and always as a reason to *retain* something:

- [09-db-schema.md](./09-db-schema.md) makes `scores.exercise_id` **nullable** so an ephemeral generated Practice Exercise still leaves a Score row — explicitly "for personal history" — and carries a **dedicated index** `(player_id, created_at)`, annotated "supports personal history, including null-exercise Practice rows".
- [10-score-integrity.md](./10-score-integrity.md) and [15-leaderboard-display-rules.md](./15-leaderboard-display-rules.md) keep a `leaderboard_eligible = 0` Score rather than rejecting it, because it "still counts for personal history".
- [13-gate-failure-flow.md](./13-gate-failure-flow.md) persists a sub-gate Score for the same reason.
- [16-learn-completion-and-revisiting.md](./16-learn-completion-and-revisiting.md) rejected discarding worse replays partly because hiding them "turns history into a highlight reel that cannot explain itself" — an argument that only bites if history is *visible*.

So the spec has an index built for a read nobody specified, a nullable foreign key whose only stated purpose is a screen that does not exist, and at least one decision argued on the assumption a Player sees this. Either the surface exists and belongs in the destination's "user flows for both Tracks", or it does not — and that has to be said out loud, because it changes what that index and that nullable column are for.

**The open decisions, if it exists:**

- **Where it lives.** [11-first-run-onboarding.md](./11-first-run-onboarding.md) deliberately made the home screen the app's one surface for everything that is not typing, and refused to invent extra entry points; [16](./16-learn-completion-and-revisiting.md) added the Stage list there on exactly that reasoning. A third thing on the home screen, or a route off it?
- **What it shows, and for whom.** The two Tracks produce very different rows: Learn has 21 fixed Exercises with a best Score each, while Practice produces a stream of null-`exercise_id` rows that are individually meaningless (each targeted different keys, generated uniquely). A raw reverse-chronological list of Attempts serves an adult chasing a trend and is close to useless — arguably discouraging — for a five-year-old.
- **Whether it duplicates surfaces that already exist.** [15](./15-leaderboard-display-rules.md)'s personal row already shows a Player their best and whether they just beat it; [14-practice-loop.md](./14-practice-loop.md)'s session summary already shows the Weak-key Profile moving; [16](./16-learn-completion-and-revisiting.md)'s Stage list already shows Learn progress at a glance. It is genuinely possible the answer is that history is *already* surfaced, three times, in the places it is actionable — and that a dedicated screen adds nothing.
- **What "no" costs.** If there is no surface, `scores` accumulates rows for every Practice Attempt forever with no reader, and the retention arguments in 10, 13, 15 and 16 need restating on other grounds (the Weak-key Profile, the Learn gate) — or the data model should stop pretending.

This sits inside the destination's "user flows for both Tracks", and touches the data model already settled in 09.

## Answer

### The surface exists

A **history screen**, reached from the home screen. The phrase six tickets used to justify retention now points at something real.

The alternative — declaring that history is *already* surfaced three times over, by [15](./15-leaderboard-display-rules.md)'s personal row, [14](./14-practice-loop.md)'s session summary and [16](./16-learn-completion-and-revisiting.md)'s Stage list, each at the moment it is actionable — was genuinely arguable and was rejected. Those three surfaces are all **momentary**: they appear attached to something the Player just did and vanish with it. None of them answers "am I getting better than I was a month ago", and that question is the entire proposition of the Speed Test & Practice Track. ADR 0003 built adaptive generation on the promise of faster improvement; 14 gave that promise a within-session surface; nothing gave it a across-sessions one.

### What it shows: sectioned by what each Track can honestly say

Three blocks, each rendering only what its data actually supports.

**Speed Test — a WPM trend over time.** This is the app's one apples-to-apples time series, and *only* because 14 made the Speed Test's content immutable: every retake is the same text, so the numbers are genuinely comparable. That immutability was decided to protect the Leaderboard's meaning; it turns out to be what makes a personal trend honest as well.

**Learn — best Score per cleared Stage.** Mirrors 16's Stage list rather than inventing a second progress vocabulary, and reuses the "your best" framing 15 already established. Twenty-one fixed Exercises with one best each is a table that means something.

**Practice — an aggregate, never individual Attempts.** Attempts, time spent, and the Weak-key Profile as it currently stands. A single generated Practice Exercise is meaningless in isolation: each one targeted a different set of keys, chosen from a Profile that was itself different that day. Listing them would render noise as data. The aggregate is the honest unit, and the current Profile is the thing that actually carries forward.

Rejected: **one reverse-chronological list of every Attempt** — it sets a Practice Attempt targeting `q` and `z` beside one targeting `e` and `t` as though the numbers relate, and buries the Speed Test trend under rows from the Track that generates the most of them. Also rejected: **a single WPM-over-time chart across everything**, the least honest option in the set — one line plotting different texts, different key sets, and two Tracks with different purposes, moving for reasons that have nothing to do with the Player improving.

### Entry: a plainly-styled route off the home screen

It sits in the home screen's secondary row, beside "Try the Speed Test instead" and "Not you?".

**This does not violate 11 or 16.** What [11-first-run-onboarding.md](./11-first-run-onboarding.md) refused was replacing one home screen with five separate entry points; what it *built* was a hub with routes hanging off it — the "For grown-ups" affordance is itself exactly such a route. 16 added the Stage list on the same reasoning. This is the established pattern, not an exception to it.

**Plainly styled, not adult-gated.** The deliberately-uninteresting treatment 11 invented for "For grown-ups" is for things that are an *adult's* business — cookies, recovery, the override. A Player's own Scores are not that. The primary reader here is a Speed Test Player watching their own WPM climb, and routing them through a door marked "for grown-ups" to find it would be the wrong door. A five-year-old on Learn will see the affordance and mostly ignore it; 16's Stage list already shows them their progress in a form they can read.

### Ineligible Scores: listed and marked, but never plotted

An ineligible Score ([10-score-integrity.md](./10-score-integrity.md)) appears in the Speed Test list carrying **15's existing "not ranked" marker** — same vocabulary, same silence about why. No new component and no new concept: 15 already built this marker for the appended board row, and this is its second context.

**It is excluded from the trend line.** A plausibility failure is by definition a number the app does not trust, and a trend is an *assertion* about direction — one bogus 900 WPM from a laptop that slept mid-Attempt would make that assertion false. The distinction is clean: **marked where it is a row, absent where it would be a claim.**

Excluding it from the screen altogether was rejected as directly contradicting what 10, 13 and 15 said when they chose to persist these rows, and as recreating precisely the bafflement 15 refused — a Player whose Score is simply nowhere, in the one place it was promised to be. Showing it unmarked and plotted was rejected because it lets an outlier define the shape of the only thing this screen exists to show.

### No schema change — and two speculative pieces of 09 stop being speculative

Nothing new to store. More usefully, this retroactively justifies two things [09-db-schema.md](./09-db-schema.md) already carries:

- The index `(player_id, created_at)`, annotated "supports personal history, including null-exercise Practice rows", now has a specified reader. It was an index built for a query no ticket had described.
- The **nullable `exercise_id`** on `scores`, whose only stated purpose was retaining ephemeral Practice Scores "for personal history", now has a surface those rows feed — the Practice aggregate.

The reads are ordinary: the Speed Test trend is `scores` filtered to that Exercise for this Player ordered by `created_at`; the Learn table is best-per-Exercise for this Player; the Practice aggregate is a count, a sum of `elapsed_ms`, and the existing `weak_key_stats` read that 14's session summary already performs.

### Addenda raised elsewhere

- **09** — the `(player_id, created_at)` index and the nullable `exercise_id` gain their specified reader; three new reads named, all ordinary.
- **11** — the home screen's secondary row gains a third route; the hub-with-routes pattern is confirmed rather than extended.
- **15** — the "not ranked" marker gains a second context, unchanged in wording and in its refusal to explain itself.
- **06** — a new screen for the reference render, which does not yet have it.
