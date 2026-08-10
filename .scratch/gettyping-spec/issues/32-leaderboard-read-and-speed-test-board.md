# 32 — The Leaderboard read and the Speed Test board

Type: task
Blocked by: 22
Status: done

## What to build

Per-Exercise Leaderboards — the app's competitive hook — starting with the Speed Test's, which is the closest thing to a global board this app will have.

A board is **computed on read**, never materialised. It dedupes to each Player's best Score and orders by Net WPM descending with an **`id ASC` tie-break in both the deduplication and the ordering**. The tie-break is not optional: without it two Players on identical Net WPM order nondeterministically and the board visibly reshuffles between reads when nobody has typed anything. Because ids are monotonic it also means the earlier Score wins a tie, and a renamed Player's row cannot flicker between snapshotted Nicknames.

```sql
WITH ranked AS (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY player_id ORDER BY net_wpm DESC, id ASC
  ) AS rk
  FROM scores
  WHERE exercise_id = ? AND leaderboard_eligible = 1
)
SELECT * FROM ranked WHERE rk = 1 ORDER BY net_wpm DESC, id ASC LIMIT 10;
```

Two further reads the board needs and this query does not give: **the Player's own rank** among eligible bests, and **a count of distinct ranked Players** on the Exercise.

**Display rules.** The board is **hidden while typing** and **revealed when the Attempt ends**, so it lands as a reward rather than competing for attention during the Attempt. The Player's row is **always their best, never their latest**, and the personal-best marker fires **only when this Attempt became that best** — which is what gives a beginner at rank 47 something to feel. Outside the top ten, their own row is **appended below the ten**, visually separated, showing their true rank.

An **ineligible Score** appears on that row **marked as not ranked, with no explanation** of what tripped — mirroring the profanity redirect: state the outcome, never name the detection. If a Player's own best is ineligible they have no ranked best, so the row carries the Score rather than a rank.

**Below a configured threshold of distinct ranked Players the board is suppressed entirely** and the reveal shows the personal panel alone — the same component, rendered without the ten rows. A board of two names manufactures a competition that does not exist. **Stats always survive suppression**, so suppressing the ranking never costs the completion moment. At launch every board is empty, so this is the normal condition for a while and must be built as the normal path, not an edge case.

## Acceptance criteria

- [x] A board returns each Player's best eligible Score, at most ten rows.
- [x] Repeated reads of a board containing tied Net WPMs return identical order, with the earlier Score first.
- [x] The board is not shown during an Attempt, and is revealed when it ends.
- [x] A Player outside the top ten sees their own row appended below the ten with their true rank.
- [x] The appended row shows the Player's best, not their latest.
- [x] The personal-best marker fires only on the Attempt that became the best.
- [x] An ineligible Score is shown marked as not ranked, with no explanation, and occupies no rank.
- [x] Below the configured distinct-Player threshold no rows are shown and the personal panel stands alone; the threshold is config.
- [x] Stats are shown whether or not the board is suppressed.
