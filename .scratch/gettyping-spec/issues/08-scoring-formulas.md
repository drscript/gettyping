# Define WPM/accuracy scoring formulas

Type: grilling
Status: resolved

## Question

What exact formulas compute WPM and accuracy for a Score, and are they the same across both Tracks? (E.g. gross WPM = (characters typed / 5) / minutes elapsed, vs. net WPM which subtracts errors — standard conventions exist and should be confirmed rather than invented.) This also determines what a Score needs to record (raw keystrokes/timing vs. just the final numbers) for the DB schema ticket ([09-db-schema.md](./09-db-schema.md)).

## Answer

1. **Net WPM is the canonical, Leaderboard-ranking Score.** Gross WPM = (total characters typed ÷ 5) ÷ minutes elapsed. Net WPM = Gross WPM − (uncorrected errors ÷ minutes elapsed); Net WPM is what's shown and ranked. Gross WPM may still be computed/stored as a secondary stat but never ranks.
2. **Accuracy counts corrected errors.** Accuracy = correct keystrokes ÷ total keystrokes typed, where "total" includes characters later backspaced over — not just the final submitted text. A mistake still counts even if the Player fixes it.
3. **One formula everywhere.** Both Tracks use identical WPM/accuracy formulas, feeding every Exercise's Leaderboard (Learn Stage Exercises and Speed Test & Practice Exercises alike) the same way. The Learn Track's flat 90%-accuracy progression gate ([04-curriculum-outline.md](./04-curriculum-outline.md)) reads the accuracy half of this same formula — it doesn't invent a separate calculation, and it ignores WPM entirely for gating.
4. **Score stores only aggregates, not raw keystrokes.** A Score row records: Net WPM, Gross WPM (secondary), accuracy, elapsed time, total characters, error count. Keystroke-level events (key, correct/incorrect, timing) are captured transiently per Attempt, folded into the Weak-key Profile's per-key running totals (attempts/errors/cumulative-latency, per [05-prototype-weak-key-generation.md](./05-prototype-weak-key-generation.md)), then discarded — no raw keystroke log is persisted.

Schema implications for [09-db-schema.md](./09-db-schema.md): the Score/Attempt row needs columns for net_wpm, gross_wpm, accuracy, elapsed_time, char_count, error_count (plus the snapshotted nickname from [07-nickname-uniqueness.md](./07-nickname-uniqueness.md)) — no raw-keystroke table.
